<?php

namespace App\Console\Commands;

use App\Models\Building;
use App\Models\BuildingFloor;
use App\Models\BuildingHotspot;
use App\Models\EoiReservation;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\Reservation;
use App\Models\Unit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Builds the building structure for the Patio Luxury Compound master plan:
 * creates buildings positioned on the aerial master plan (pins + footprint
 * polygons), generates floors + units, and wires drill-down floor plans and
 * apartment layouts via the demo:floorplans generator.
 *
 * Usage: php artisan patio:setup {projectId} [--wipe] [--floors=4] [--units=3]
 */
class SetupPatioMasterPlan extends Command
{
    protected $signature = 'patio:setup {projectId} {--wipe : Remove existing buildings/units/hotspots first} {--floors=4} {--units=3}';
    protected $description = 'Create buildings positioned on the Patio master plan with floors, units and drill-down media';

    /**
     * Building centers on the aerial master plan, as percentages (x, y).
     * Estimated from the render; fine-tune by dragging pins in the editor.
     */
    private const POSITIONS = [
        ['B01', 24, 22], ['B02', 37, 21], ['B03', 50, 21], ['B04', 62, 21], ['B05', 75, 22],
        ['B06', 14, 26], ['B07', 85, 28],
        ['B08', 62, 38], ['B09', 74, 37], ['B10', 25, 35], ['B11', 86, 46],
        ['B12', 25, 55], ['B13', 38, 54], ['B14', 58, 54], ['B15', 70, 54],
        ['B16', 24, 71], ['B17', 41, 72], ['B18', 56, 72], ['B19', 69, 71],
    ];

    public function handle(): int
    {
        $projectId = $this->argument('projectId');
        $project = Project::find($projectId);
        if (!$project) {
            $this->error("Project {$projectId} not found.");
            return self::FAILURE;
        }

        $phase = $project->released_phases[0] ?? 'Phase 1';
        $floorsPerBuilding = (int) $this->option('floors');
        $unitsPerFloor = (int) $this->option('units');

        if ($this->option('wipe')) {
            $this->warn('Wiping existing buildings, floors, units, hotspots and floor/building media...');
            $this->wipe($projectId);
        }

        $unitVariants = [
            ['area' => 220, 'beds' => 4, 'baths' => 3],
            ['area' => 175, 'beds' => 3, 'baths' => 2],
            ['area' => 140, 'beds' => 2, 'baths' => 2],
            ['area' => 110, 'beds' => 2, 'baths' => 1],
        ];

        $globalUnitIdx = 0;

        foreach (self::POSITIONS as $sort => [$name, $xp, $yp]) {
            $building = Building::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'name' => $name,
                'name_ar' => $name,
                'type' => 'apartment_building',
                'total_floors' => $floorsPerBuilding,
                'has_elevator' => true,
                'elevator_count' => 2,
                'staircase_count' => 2,
                'parking_type' => 'basement',
                'parking_capacity' => $unitsPerFloor * $floorsPerBuilding,
                'status' => 'under_construction',
                'sort_order' => $sort + 1,
            ]);

            for ($f = 1; $f <= $floorsPerBuilding; $f++) {
                $floor = BuildingFloor::create([
                    'id' => (string) Str::uuid(),
                    'building_id' => $building->id,
                    'floor_number' => $f,
                    'floor_label' => "Floor {$f}",
                    'floor_type' => 'typical',
                    'units_count' => $unitsPerFloor,
                    'ceiling_height' => 3.2,
                ]);

                for ($n = 1; $n <= $unitsPerFloor; $n++) {
                    $v = $unitVariants[($globalUnitIdx) % count($unitVariants)];
                    // Deterministic status mix: mostly available, some reserved/sold.
                    $status = 'available';
                    if ($globalUnitIdx % 7 === 0) $status = 'sold';
                    elseif ($globalUnitIdx % 5 === 0) $status = 'reserved';

                    Unit::create([
                        'id' => (string) Str::uuid(),
                        'project_id' => $projectId,
                        'building_id' => $building->id,
                        'floor_id' => $floor->id,
                        'building' => $name,
                        'floor' => $f,
                        'unit_number' => sprintf('%s-%d%02d', $name, $f, $n),
                        'type' => 'apartment',
                        'area' => $v['area'],
                        'net_area' => round($v['area'] * 0.85, 2),
                        'bedrooms' => $v['beds'],
                        'bathrooms' => $v['baths'],
                        'view_type' => ['garden', 'pool', 'landmark', 'street'][$globalUnitIdx % 4],
                        'orientation' => ['north', 'east', 'south', 'west'][$globalUnitIdx % 4],
                        'price' => $v['area'] * 45000,
                        'status' => $status,
                        'phase' => $phase,
                    ]);
                    $globalUnitIdx++;
                }
            }

            // Pin + footprint polygon on the master plan
            $px = (float) $xp; $py = (float) $yp;
            $poly = [
                ['x' => max(0, $px - 6), 'y' => max(0, $py - 8)],
                ['x' => min(100, $px + 6), 'y' => max(0, $py - 8)],
                ['x' => min(100, $px + 6), 'y' => min(100, $py + 8)],
                ['x' => max(0, $px - 6), 'y' => min(100, $py + 8)],
            ];
            BuildingHotspot::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'building_id' => $building->id,
                'x_percent' => $px,
                'y_percent' => $py,
                'label' => $name,
                'pin_color' => '#003DA6',
                'polygon_points' => $poly,
            ]);

            $this->line("  ✓ {$name} @ ({$xp}%, {$yp}%) — {$floorsPerBuilding} floors × {$unitsPerFloor} units");
        }

        $this->info('Buildings created. Generating floor plans & apartment layouts...');
        Artisan::call('demo:floorplans', ['projectId' => $projectId, '--force' => true], $this->getOutput());

        $this->info('Done. ' . count(self::POSITIONS) . ' buildings wired onto the master plan.');
        return self::SUCCESS;
    }

    private function wipe(string $projectId): void
    {
        $unitIds = Unit::where('project_id', $projectId)->pluck('id');
        $buildingIds = Building::where('project_id', $projectId)->pluck('id');

        Schema::disableForeignKeyConstraints();
        // Preserve EOI records but unlink the units we're about to delete.
        EoiReservation::where('project_id', $projectId)->update(['unit_id' => null]);
        Reservation::whereIn('unit_id', $unitIds)->delete();
        Unit::where('project_id', $projectId)->delete();
        BuildingFloor::whereIn('building_id', $buildingIds)->delete();
        BuildingHotspot::where('project_id', $projectId)->delete();
        Building::where('project_id', $projectId)->delete();
        ProjectMedia::where('project_id', $projectId)
            ->whereIn('media_type', ['floor_plan', 'building'])->delete();
        Schema::enableForeignKeyConstraints();

        $this->line('  ✓ Wiped previous structure.');
    }
}
