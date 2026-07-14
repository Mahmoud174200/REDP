<?php

namespace App\Console\Commands;

use App\Models\Building;
use App\Models\ProjectMedia;
use App\Models\Project;
use App\Models\Unit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates realistic architectural drawings for the interactive
 * unit-selection flow:
 *   - One shared building elevation image, applied to every building.
 *   - A realistic floor plan per (building, floor): outer walls, a central
 *     lift/stair core, corridor, and the apartments drawn with internal
 *     rooms, doors, windows and furniture.
 *   - A detailed apartment plan per unit (rooms + areas + furniture).
 *   - Each unit's floor_plan_hotspot is aligned to its apartment on the plan.
 *
 * Usage: php artisan demo:floorplans {projectId} [--force]
 */
class GenerateDemoFloorPlans extends Command
{
    protected $signature = 'demo:floorplans {projectId} {--force : Overwrite units that already have a layout image}';
    protected $description = 'Generate realistic floor & apartment plans and a shared building image, then wire interactive hotspots';

    private const FW = 1200;   // floor plan canvas width
    private const FH = 820;    // floor plan canvas height

    private const WALL = '#1f2937';
    private const FURN_FILL = '#eef2f7';
    private const FURN_STROKE = '#9aa6b8';

    public function handle(): int
    {
        $projectId = $this->argument('projectId');
        $project = Project::find($projectId);
        if (!$project) {
            $this->error("Project {$projectId} not found.");
            return self::FAILURE;
        }

        $units = Unit::where('project_id', $projectId)
            ->orderBy('building')->orderBy('floor')->orderBy('unit_number')->get();
        if ($units->isEmpty()) {
            $this->error('No units found for this project.');
            return self::FAILURE;
        }

        // 1) One shared building image for every building.
        $buildingPath = "projects/{$projectId}/buildings/_shared-building.svg";
        Storage::disk('public')->put($buildingPath, $this->buildBuildingSvg());
        foreach (Building::where('project_id', $projectId)->pluck('name')->unique() as $bName) {
            ProjectMedia::updateOrCreate(
                ['project_id' => $projectId, 'media_type' => 'building', 'reference_key' => $bName],
                ['id' => (string) Str::uuid(), 'image_path' => $buildingPath, 'caption' => "Building {$bName}"]
            );
        }
        // Fallback for unit-driven building names not in the buildings table
        foreach ($units->pluck('building')->filter()->unique() as $bName) {
            ProjectMedia::updateOrCreate(
                ['project_id' => $projectId, 'media_type' => 'building', 'reference_key' => $bName],
                ['id' => (string) Str::uuid(), 'image_path' => $buildingPath, 'caption' => "Building {$bName}"]
            );
        }

        $groups = [];
        foreach ($units as $u) {
            $groups[($u->building ?: 'Main Building') . '|' . (int) $u->floor][] = $u;
        }

        $floorCount = 0; $unitCount = 0;
        foreach ($groups as $key => $groupUnits) {
            [$building, $floor] = explode('|', $key);
            $placements = $this->floorPlacements(count($groupUnits));

            $floorPath = 'layouts/istockphoto-1260071659-612x612.jpg';

            ProjectMedia::updateOrCreate(
                ['project_id' => $projectId, 'media_type' => 'floor_plan', 'reference_key' => $key],
                ['id' => (string) Str::uuid(), 'image_path' => $floorPath, 'caption' => "{$building} — floor {$floor}"]
            );
            $floorCount++;

            foreach ($groupUnits as $i => $u) {
                $p = $placements[$i];
                $u->floor_plan_hotspot = [
                    'x' => round($p['x'], 2), 'y' => round($p['y'], 2),
                    'w' => round($p['w'], 2), 'h' => round($p['h'], 2),
                ];
                $u->layout_image_url = 'layouts/images.png';
                $u->save();
                $unitCount++;
            }
        }

        $this->info("Done. {$floorCount} floor plans updated, {$unitCount} apartments updated to global layout.");
        return self::SUCCESS;
    }

    /* ───────────────────────── Layout geometry ───────────────────────── */

    /**
     * Apartment hotspot boxes (percent of canvas). For the common 3-units
     * floor we use a left + two-right layout around a central core; otherwise
     * fall back to a simple grid.
     */
    private function floorPlacements(int $n): array
    {
        if ($n === 3) {
            return [
                ['x' => 4,  'y' => 11, 'w' => 37, 'h' => 78],  // left (large)
                ['x' => 60, 'y' => 11, 'w' => 36, 'h' => 37],  // top-right
                ['x' => 60, 'y' => 52, 'w' => 36, 'h' => 37],  // bottom-right
            ];
        }
        $cols = $n <= 2 ? $n : ($n <= 6 ? 2 : 4);
        $rows = (int) ceil($n / $cols);
        $padX = 4; $padY = 11; $gap = 3;
        $cw = (100 - 2 * $padX - ($cols - 1) * $gap) / $cols;
        $ch = (88 - $padY - ($rows - 1) * $gap) / $rows;
        $out = [];
        for ($i = 0; $i < $n; $i++) {
            $c = $i % $cols; $r = intdiv($i, $cols);
            $out[] = ['x' => $padX + $c * ($cw + $gap), 'y' => $padY + $r * ($ch + $gap), 'w' => $cw, 'h' => $ch];
        }
        return $out;
    }

    private function pct2px(array $b): array
    {
        return [
            'x' => $b['x'] / 100 * self::FW, 'y' => $b['y'] / 100 * self::FH,
            'w' => $b['w'] / 100 * self::FW, 'h' => $b['h'] / 100 * self::FH,
        ];
    }

    /* ───────────────────────── Floor plan ───────────────────────── */

    private function buildFloorPlanSvg(string $building, int $floor, $units, array $placements): string
    {
        $w = self::FW; $h = self::FH; $wall = self::WALL;
        $title = htmlspecialchars($building, ENT_QUOTES) . " — Floor {$floor}";

        $apts = '';
        foreach ($units as $i => $u) {
            $px = $this->pct2px($placements[$i]);
            $apts .= $this->renderApartment($px['x'], $px['y'], $px['w'], $px['h'], $u, false);
        }

        // Central core (lifts + stairs) between the apartments.
        $core = $this->renderCore(self::FW * 0.435, self::FH * 0.30, self::FW * 0.13, self::FH * 0.42);

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}" font-family="Segoe UI, Arial, sans-serif">
  <rect x="0" y="0" width="{$w}" height="{$h}" fill="#ffffff"/>
  <!-- title block -->
  <text x="40" y="44" font-size="26" font-weight="800" fill="#0f172a">{$title}</text>
  <text x="40" y="64" font-size="13" fill="#64748b">Typical floor plan · scale n.t.s. · all dimensions approximate</text>
  <line x1="40" y1="74" x2="{$w}" y2="74" transform="translate(-40,0)" stroke="#e5e9f0" stroke-width="1"/>
  <!-- building outer shell -->
  <rect x="34" y="86" width="1132" height="700" fill="#f8fafc" stroke="{$wall}" stroke-width="9"/>
{$core}
{$apts}
</svg>
SVG;
    }

    private function renderCore(float $x, float $y, float $w, float $h): string
    {
        $wall = self::WALL;
        $x = round($x, 1); $y = round($y, 1); $w = round($w, 1); $h = round($h, 1);
        $halfH = round($h / 2 - 6, 1);
        $cx = round($x + $w / 2, 1);
        $liftY = round($y + 8, 1);
        $stairY = round($y + $h / 2 + 6, 1);
        // two lift cabins + a staircase below, with a "CORE" label
        return <<<SVG
  <g>
    <rect x="{$x}" y="{$y}" width="{$w}" height="{$h}" fill="#eef2f7" stroke="{$wall}" stroke-width="4"/>
    <rect x="{$x}" y="{$liftY}" width="{$w}" height="{$halfH}" fill="#ffffff" stroke="{$wall}" stroke-width="2"/>
    <line x1="{$x}" y1="{$liftY}" x2="{$cx}" y2="{$liftY}" stroke="none"/>
    <line x1="{$cx}" y1="{$liftY}" x2="{$cx}" y2="{$stairY}" stroke="{$wall}" stroke-width="2"/>
    <text x="{$cx}" y="{$liftY}" dy="26" text-anchor="middle" font-size="13" font-weight="700" fill="#475569">LIFTS</text>
    <line x1="{$x}" y1="{$stairY}" x2="{$x}" y2="{$stairY}" stroke="none"/>
    <rect x="{$x}" y="{$stairY}" width="{$w}" height="{$halfH}" fill="#ffffff" stroke="{$wall}" stroke-width="2"/>
    <text x="{$cx}" y="{$stairY}" dy="20" text-anchor="middle" font-size="12" font-weight="700" fill="#475569">STAIRS</text>
  </g>
SVG;
    }

    /**
     * Draw an apartment with internal rooms, doors, windows and light furniture.
     * Used both inside the floor plan (compact) and standalone (detailed).
     */
    private function renderApartment(float $x, float $y, float $w, float $h, Unit $u, bool $detailed): string
    {
        $wall = self::WALL;
        $beds = max(1, (int) ($u->bedrooms ?: 2));
        $area = (float) ($u->area ?: 120);

        // Balcony strip on the right edge.
        $balW = $w * 0.10;
        $coreW = $w - $balW;
        // Two columns: left = reception + kitchen, right = bedrooms + bath.
        $leftW = $coreW * 0.52;
        $rightW = $coreW - $leftW;

        $rx = round($x, 1); $ry = round($y, 1); $rw = round($w, 1); $rh = round($h, 1);

        $rooms = '';
        // Reception (left, lower ~60%)
        $recH = $h * 0.58;
        $rooms .= $this->room($x, $y + ($h - $recH), $leftW, $recH, 'Reception', $area * 0.30, $detailed ? 'sofa' : null);
        // Kitchen (left, upper)
        $rooms .= $this->room($x, $y, $leftW, $h - $recH, 'Kitchen', $area * 0.13, $detailed ? 'kitchen' : null);
        // Bedrooms (right column, stacked)
        $bedZoneH = $h * 0.74;
        $bedH = $bedZoneH / $beds;
        for ($b = 0; $b < $beds; $b++) {
            $rooms .= $this->room($x + $leftW, $y + $b * $bedH, $rightW, $bedH, $b === 0 ? 'Master Bed' : 'Bedroom ' . ($b + 1), ($area * 0.40) / $beds, $detailed ? 'bed' : null);
        }
        // Bathroom (right, bottom)
        $rooms .= $this->room($x + $leftW, $y + $bedZoneH, $rightW, $h - $bedZoneH, 'Bath', $area * 0.07, $detailed ? 'bath' : null);
        // Balcony (right strip)
        $rooms .= $this->balcony($x + $coreW, $y + $h * 0.1, $balW, $h * 0.8);

        // Entrance door swing at bottom-left of the apartment.
        $door = $this->doorArc($x + $leftW * 0.5, $y + $h, 26, 'up');

        // Apartment label badge
        $badge = '';
        if (!$detailed) {
            $num = htmlspecialchars($u->unit_number, ENT_QUOTES);
            $areaTxt = rtrim(rtrim(number_format($area, 1), '0'), '.') . ' m²';
            $bx = round($x + 10, 1); $by = round($y + 10, 1);
            $badge = <<<SVG
    <g>
      <rect x="{$bx}" y="{$by}" width="118" height="40" rx="8" fill="#0f172a" opacity="0.86"/>
      <text x="{$bx}" y="{$by}" dx="10" dy="18" font-size="15" font-weight="800" fill="#ffffff">{$num}</text>
      <text x="{$bx}" y="{$by}" dx="10" dy="33" font-size="11" fill="#cbd5e1">{$areaTxt} · {$beds} BR</text>
    </g>
SVG;
        }

        return <<<SVG
  <g>
    <rect x="{$rx}" y="{$ry}" width="{$rw}" height="{$rh}" fill="#ffffff" stroke="{$wall}" stroke-width="5"/>
{$rooms}
{$door}
{$badge}
  </g>
SVG;
    }

    private function room(float $x, float $y, float $w, float $h, string $name, float $area, ?string $furn): string
    {
        if ($w < 4 || $h < 4) return '';
        $wall = self::WALL;
        $rx = round($x, 1); $ry = round($y, 1); $rw = round($w, 1); $rh = round($h, 1);
        $cx = round($x + $w / 2, 1); $cy = round($y + $h / 2, 1);
        $name = htmlspecialchars($name, ENT_QUOTES);
        $areaTxt = rtrim(rtrim(number_format($area, 1), '0'), '.') . ' m²';
        $furnSvg = $furn ? $this->furniture($furn, $x, $y, $w, $h) : '';
        $fs = $h < 60 ? 11 : 13;
        return <<<SVG
    <rect x="{$rx}" y="{$ry}" width="{$rw}" height="{$rh}" fill="none" stroke="{$wall}" stroke-width="2"/>
{$furnSvg}
    <text x="{$cx}" y="{$cy}" text-anchor="middle" font-size="{$fs}" font-weight="700" fill="#0f172a">{$name}</text>
    <text x="{$cx}" y="{$cy}" dy="16" text-anchor="middle" font-size="11" fill="#64748b">{$areaTxt}</text>
SVG;
    }

    private function balcony(float $x, float $y, float $w, float $h): string
    {
        if ($w < 4) return '';
        $wall = self::WALL;
        $rx = round($x, 1); $ry = round($y, 1); $rw = round($w, 1); $rh = round($h, 1);
        // diagonal hatch
        $lines = '';
        for ($i = 0; $i < $h; $i += 14) {
            $y1 = round($y + $i, 1);
            $lines .= '<line x1="' . $rx . '" y1="' . $y1 . '" x2="' . round($x + $w, 1) . '" y2="' . round(min($y + $h, $y1 + $w), 1) . '" stroke="#cbd5e1" stroke-width="1"/>';
        }
        return <<<SVG
    <rect x="{$rx}" y="{$ry}" width="{$rw}" height="{$rh}" fill="#fbfdff" stroke="{$wall}" stroke-width="2"/>
    {$lines}
SVG;
    }

    private function furniture(string $kind, float $x, float $y, float $w, float $h): string
    {
        $f = self::FURN_FILL; $s = self::FURN_STROKE;
        $cx = $x + $w / 2; $cy = $y + $h / 2;
        if ($kind === 'bed') {
            $bw = min($w * 0.6, 90); $bh = min($h * 0.7, 70);
            $bx = round($cx - $bw / 2, 1); $by = round($cy - $bh / 2, 1);
            $pw = round($bw, 1); $ph = round($bh * 0.25, 1);
            return '<g><rect x="' . $bx . '" y="' . $by . '" width="' . round($bw, 1) . '" height="' . round($bh, 1) . '" rx="4" fill="' . $f . '" stroke="' . $s . '" stroke-width="1.5"/><rect x="' . $bx . '" y="' . $by . '" width="' . $pw . '" height="' . $ph . '" fill="#ffffff" stroke="' . $s . '" stroke-width="1"/></g>';
        }
        if ($kind === 'sofa') {
            $sw = min($w * 0.62, 130); $sh = min($h * 0.26, 46);
            $sx = round($cx - $sw / 2, 1); $sy = round($y + $h - $sh - 12, 1);
            return '<rect x="' . $sx . '" y="' . $sy . '" width="' . round($sw, 1) . '" height="' . round($sh, 1) . '" rx="9" fill="' . $f . '" stroke="' . $s . '" stroke-width="1.5"/>';
        }
        if ($kind === 'kitchen') {
            $cw = round($w * 0.8, 1); $kx = round($x + $w * 0.1, 1); $ky = round($y + 8, 1);
            return '<g><rect x="' . $kx . '" y="' . $ky . '" width="' . $cw . '" height="14" fill="' . $f . '" stroke="' . $s . '" stroke-width="1.5"/><circle cx="' . round($kx + 16, 1) . '" cy="' . round($ky + 7, 1) . '" r="5" fill="none" stroke="' . $s . '" stroke-width="1.2"/><circle cx="' . round($kx + 34, 1) . '" cy="' . round($ky + 7, 1) . '" r="5" fill="none" stroke="' . $s . '" stroke-width="1.2"/></g>';
        }
        if ($kind === 'bath') {
            $tx = round($x + $w * 0.15, 1); $ty = round($cy - 8, 1);
            return '<g><rect x="' . $tx . '" y="' . $ty . '" width="' . round($w * 0.45, 1) . '" height="16" rx="6" fill="' . $f . '" stroke="' . $s . '" stroke-width="1.2"/><circle cx="' . round($x + $w * 0.78, 1) . '" cy="' . round($ty + 8, 1) . '" r="7" fill="' . $f . '" stroke="' . $s . '" stroke-width="1.2"/></g>';
        }
        return '';
    }

    /** A door opening with a quarter-circle swing arc. */
    private function doorArc(float $x, float $y, float $r, string $dir): string
    {
        $x = round($x, 1); $y = round($y, 1); $r = round($r, 1);
        $ex = round($x + $r, 1); $sy = round($y - $r, 1);
        // gap in the wall + arc
        return '<g><path d="M ' . $x . ' ' . $y . ' L ' . $ex . ' ' . $y . ' A ' . $r . ' ' . $r . ' 0 0 0 ' . $x . ' ' . $sy . '" fill="none" stroke="#64748b" stroke-width="1.4"/></g>';
    }

    /* ───────────────────────── Apartment (detailed) ───────────────────────── */

    private function buildApartmentSvg(Unit $u): string
    {
        $w = 980; $h = 700;
        $beds = (int) ($u->bedrooms ?: 2);
        $baths = (int) ($u->bathrooms ?: ($beds > 2 ? 2 : 1));
        $area = (float) ($u->area ?: 120);
        $num = htmlspecialchars($u->unit_number, ENT_QUOTES);
        $type = htmlspecialchars(ucfirst($u->type), ENT_QUOTES);
        $totalArea = rtrim(rtrim(number_format($area, 1), '0'), '.');

        // Big single apartment using the same room engine.
        $apt = $this->renderApartment(60, 110, 860, 540, $u, true);

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}" font-family="Segoe UI, Arial, sans-serif">
  <rect x="0" y="0" width="{$w}" height="{$h}" fill="#ffffff"/>
  <text x="60" y="56" font-size="28" font-weight="800" fill="#003DA6">Unit {$num}</text>
  <text x="60" y="80" font-size="14" fill="#64748b">{$type} · {$beds} Bed · {$baths} Bath · {$totalArea} m² (built-up)</text>
  <line x1="60" y1="92" x2="920" y2="92" stroke="#e5e9f0" stroke-width="1"/>
{$apt}
  <text x="60" y="684" font-size="11" fill="#94a3b8">Indicative layout — room dimensions approximate, furniture for reference only.</text>
</svg>
SVG;
    }

    /* ───────────────────────── Building elevation ───────────────────────── */

    private function buildBuildingSvg(): string
    {
        $w = 640; $h = 460;
        $floors = 5; $cols = 4;
        $bx = 120; $by = 70; $bw = 400; $bh = 330;
        $fh = $bh / $floors; $cw = $bw / $cols;

        $wins = '';
        for ($f = 0; $f < $floors; $f++) {
            for ($c = 0; $c < $cols; $c++) {
                $wx = round($bx + $c * $cw + $cw * 0.18, 1);
                $wy = round($by + $f * $fh + $fh * 0.2, 1);
                $ww = round($cw * 0.64, 1);
                $wh = round($fh * 0.42, 1);
                $wins .= '<rect x="' . $wx . '" y="' . $wy . '" width="' . $ww . '" height="' . $wh . '" rx="2" fill="#bcd2e8" stroke="#7f9bb8" stroke-width="1"/>';
                // balcony rail under each window
                $by2 = round($wy + $wh + 4, 1);
                $wins .= '<line x1="' . $wx . '" y1="' . $by2 . '" x2="' . round($wx + $ww, 1) . '" y2="' . $by2 . '" stroke="#c7ccd4" stroke-width="3"/>';
            }
        }

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}" font-family="Segoe UI, Arial, sans-serif">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eaf2fb"/><stop offset="1" stop-color="#f6f9fc"/>
    </linearGradient>
    <linearGradient id="facade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9edf2"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="{$w}" height="{$h}" fill="url(#sky)"/>
  <!-- ground -->
  <rect x="0" y="400" width="{$w}" height="60" fill="#e7efe4"/>
  <rect x="0" y="400" width="{$w}" height="4" fill="#cfe0c8"/>
  <!-- trees -->
  <circle cx="70" cy="392" r="26" fill="#cfe0c0"/><circle cx="566" cy="392" r="26" fill="#cfe0c0"/>
  <circle cx="96" cy="398" r="18" fill="#c2d6b2"/><circle cx="544" cy="398" r="18" fill="#c2d6b2"/>
  <!-- building body -->
  <rect x="{$bx}" y="{$by}" width="{$bw}" height="{$bh}" fill="url(#facade)" stroke="#cfd6df" stroke-width="2"/>
  <!-- roof parapet -->
  <rect x="106" y="56" width="428" height="18" rx="3" fill="#dfe5ec" stroke="#cfd6df" stroke-width="1"/>
  <!-- floor slabs -->
  <g stroke="#dde3ea" stroke-width="2">
    <line x1="{$bx}" y1="136" x2="520" y2="136"/><line x1="{$bx}" y1="202" x2="520" y2="202"/>
    <line x1="{$bx}" y1="268" x2="520" y2="268"/><line x1="{$bx}" y1="334" x2="520" y2="334"/>
  </g>
{$wins}
  <!-- entrance -->
  <rect x="296" y="352" width="48" height="48" rx="3" fill="#aebfcf" stroke="#7f9bb8" stroke-width="1.5"/>
  <rect x="284" y="346" width="72" height="8" fill="#d6dde6"/>
  <text x="320" y="432" text-anchor="middle" font-size="13" font-weight="700" fill="#64748b">Residential Building · 5 Floors</text>
</svg>
SVG;
    }
}
