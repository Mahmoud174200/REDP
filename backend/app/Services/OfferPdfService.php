<?php

namespace App\Services;

use App\Models\Unit;
use App\Models\Project;
use App\Models\ProjectAmenity;
use App\Models\ProjectMedia;
use App\Models\ProjectPaymentPlan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mpdf\Mpdf;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Property Offer PDF generator
 *
 * Builds premium, multi-page bilingual (Arabic RTL + English) PDF brochures:
 *   • generateForUnit()     — a full offer for a SINGLE available unit.
 *   • generateForCompound() — a price-list offer covering MANY available
 *                             units in one compound (all, or a chosen subset).
 *
 * Visual language: full-bleed navy section bands, an editorial cover with a
 * full-width hero, gold accents, card/tile grids that fill each page.
 * Rendered with mpdf (Arabic shaping + RTL). Files land on the public disk and
 * are streamed back through the API.
 * ─────────────────────────────────────────────────────────
 */
class OfferPdfService
{
    /** Brand palette. */
    protected string $navy = '#0E2338';
    protected string $navy2 = '#17324D';
    protected string $gold = '#C4A052';
    protected string $goldSoft = '#EADFC6';
    protected string $ink = '#22303C';
    protected string $body = '#46535F';
    protected string $muted = '#94A1AD';
    protected string $line = '#E6DFD2';
    protected string $cream = '#FAF7F1';

    /** Rotating pool of lifestyle images used for page-filling bottom bands. */
    protected array $bandPool = [];
    protected int $bandCursor = 0;

    // ── Public entry points ────────────────────────────────

    /**
     * @return array{url:string, path:string, filename:string, pages:int}
     */
    public function generateForUnit(Unit $unit): array
    {
        $unit->loadMissing('project');
        $project = $unit->project;

        if (!$project) {
            throw new \RuntimeException('This unit is not linked to a project/compound yet.');
        }
        if (strtolower((string) $unit->status) !== 'available') {
            throw new \RuntimeException("Unit {$unit->unit_number} is not available (status: {$unit->status}). An offer can only be generated for available, unsold units.");
        }

        $amenities = ProjectAmenity::where('project_id', $project->id)->get();
        $plans = ProjectPaymentPlan::where('project_id', $project->id)->get();
        $filename = 'offer-' . Str::slug($project->name . '-' . $unit->unit_number) . '-' . $unit->id . '.pdf';

        $this->buildBandPool($project);
        return $this->render($project, $unit, $this->unitSections($unit, $project, $amenities, $plans), $filename);
    }

    /**
     * @param  \Illuminate\Support\Collection<int,Unit>  $units
     * @return array{url:string, path:string, filename:string, pages:int, units:int}
     */
    public function generateForCompound(Project $project, $units): array
    {
        if (!$units || $units->isEmpty()) {
            throw new \RuntimeException('There are no available units to include for ' . $project->name . '.');
        }

        $amenities = ProjectAmenity::where('project_id', $project->id)->get();
        $plans = ProjectPaymentPlan::where('project_id', $project->id)->get();
        $filename = 'offer-' . Str::slug($project->name) . '-compound-' . $units->count() . 'u-' . substr(md5($units->pluck('id')->implode(',')), 0, 8) . '.pdf';

        $this->buildBandPool($project);
        $result = $this->render($project, null, $this->compoundSections($project, $units, $amenities, $plans), $filename);
        $result['units'] = $units->count();
        return $result;
    }

    // ── Rendering pipeline ─────────────────────────────────

    /**
     * @param  array<int,string>  $sections
     * @return array{url:string, path:string, filename:string, pages:int}
     */
    protected function render(Project $project, ?Unit $unit, array $sections, string $filename): array
    {
        $mpdf = $this->makeMpdf($project, $unit);
        $mpdf->WriteHTML($this->css(), \Mpdf\HTMLParserMode::HEADER_CSS);

        // Full-bleed layout: zero margins, no running footer — every page fills
        // the sheet edge to edge (page numbers would collide with bottom bands).
        foreach ($sections as $section) {
            $mpdf->WriteHTML($section, \Mpdf\HTMLParserMode::HTML_BODY);
        }

        Storage::disk('public')->makeDirectory('offers');
        $relative = 'offers/' . $filename;
        $absolute = Storage::disk('public')->path($relative);
        $mpdf->Output($absolute, \Mpdf\Output\Destination::FILE);

        $pages = (int) $mpdf->page;
        Log::info('offer.pdf.generated', ['project' => $project->name, 'unit' => $unit->unit_number ?? null, 'pages' => $pages, 'path' => $relative]);

        return [
            'url' => '/api/v1/public/finance/offers/' . $filename,
            'storage_url' => Storage::disk('public')->url($relative),
            'path' => $relative,
            'filename' => $filename,
            'pages' => $pages,
        ];
    }

    protected function makeMpdf(Project $project, ?Unit $unit): Mpdf
    {
        $tmp = storage_path('app/mpdf-tmp');
        if (!is_dir($tmp)) {
            @mkdir($tmp, 0775, true);
        }
        @ini_set('pcre.backtrack_limit', '5000000');

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 0,
            'margin_right' => 0,
            'margin_top' => 0,
            'margin_bottom' => 0,
            'margin_header' => 0,
            'margin_footer' => 0,
            'default_font' => 'dejavusans',
            'default_font_size' => 10.5,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'tempDir' => $tmp,
        ]);

        $subject = $unit ? $unit->unit_number : 'Available units';
        $mpdf->SetTitle('REDP Offer — ' . $project->name . ' — ' . $subject);
        $mpdf->SetAuthor('REDP — Real Estate Digital Platform');
        $mpdf->SetCreator('REDP');
        return $mpdf;
    }

    protected function footerHtml(): string
    {
        return '<table width="100%" style="font-size:7.5pt;color:' . $this->muted . ';"><tr>'
            . '<td style="padding:0 16mm;">© ' . date('Y') . ' REDP · وثيقة سرية / Confidential</td>'
            . '<td align="right" style="padding:0 16mm;color:' . $this->gold . ';font-weight:bold;">{PAGENO}</td>'
            . '</tr></table>';
    }

    // ── Section playlists ──────────────────────────────────

    /** @return array<int,string> */
    protected function unitSections(Unit $unit, Project $project, $amenities, $plans): array
    {
        $sections = [
            $this->unitCover($unit, $project),
            $this->aboutCompoundPage($project),
            $this->masterPlanPage($project),
            $this->locationPage($project),
            $this->amenitiesPage($project, $amenities),
            $this->infrastructurePage($project),
            $this->unitOverviewPage($unit),
            $this->unitLayoutPage($unit, $project),
            $this->pricingPage($unit, $plans),
            $this->paymentPlansIntroPage($unit, $plans),
        ];
        foreach ($plans as $i => $plan) {
            $sections[] = $this->paymentPlanPage($unit, $plan, $i + 1, count($plans));
        }
        $sections[] = $this->termsPage();
        $sections[] = $this->contactPage($project, $unit->unit_number);
        $sections[] = $this->backCoverPage($project);
        return $sections;
    }

    /** @return array<int,string> */
    protected function compoundSections(Project $project, $units, $amenities, $plans): array
    {
        $sections = [
            $this->compoundCover($project, $units),
            $this->aboutCompoundPage($project),
            $this->masterPlanPage($project),
            $this->locationPage($project),
            $this->amenitiesPage($project, $amenities),
            $this->infrastructurePage($project),
        ];
        foreach ($this->priceListPages($project, $units) as $p) {
            $sections[] = $p;
        }
        $sections[] = $this->paymentPlansIntroPage(null, $plans);
        foreach ($plans as $i => $plan) {
            $sections[] = $this->paymentPlanPage(null, $plan, $i + 1, count($plans), $units);
        }
        $sections[] = $this->termsPage();
        $sections[] = $this->contactPage($project, null);
        $sections[] = $this->backCoverPage($project);
        return $sections;
    }

    // ── Covers ─────────────────────────────────────────────

    protected function unitCover(Unit $unit, Project $project): string
    {
        $type = htmlspecialchars((string) Str::title(str_replace('_', ' ', (string) $unit->type)));
        $loc = htmlspecialchars((string) ($project->location ?: '—'));
        return $this->coverShell(
            $project,
            $this->firstImage([$unit->layout_image_url, $project->image_url, $project->master_plan_image_url]),
            'Exclusive Property Offer',
            'عرض عقاري حصري',
            'وحدة ' . htmlspecialchars($unit->unit_number),
            $type . ' &nbsp;·&nbsp; ' . $loc,
            'السعر · PRICE',
            $this->money($unit->price)
        );
    }

    protected function compoundCover(Project $project, $units): string
    {
        $min = (float) $units->min('price');
        $max = (float) $units->max('price');
        $range = $min === $max ? $this->money($min) : ($this->money($min) . ' — ' . $this->money($max));
        $loc = htmlspecialchars((string) ($project->location ?: '—'));
        return $this->coverShell(
            $project,
            $this->firstImage([$project->image_url, $project->master_plan_image_url]),
            'Available Units — Price Offer',
            'عرض أسعار الوحدات المتاحة',
            $units->count() . ' وحدة متاحة',
            'كل الوحدات المتاحة &nbsp;·&nbsp; ' . $loc,
            'تبدأ من · FROM',
            $range
        );
    }

    /** Editorial cover: full-width hero, then a navy block with all the type. */
    protected function coverShell(Project $project, ?string $heroPath, string $en, string $ar, string $subject, string $meta, string $priceLabel, string $price): string
    {
        $hero = $this->bgCover($heroPath, '150mm');
        return '
        <div style="height:150mm;">' . $hero . '</div>
        <div style="background:' . $this->navy . ';color:#fff;height:147mm;padding:15mm 18mm;">
            <table width="100%"><tr>
                <td style="font-size:9pt;letter-spacing:5px;color:' . $this->gold . ';">R E D P</td>
                <td align="right" style="font-size:7.5pt;letter-spacing:2px;color:#93A1AD;">REAL ESTATE DIGITAL PLATFORM</td>
            </tr></table>
            <div style="border-top:1px solid rgba(255,255,255,0.14);margin:9mm 0 8mm;"></div>
            <div style="color:' . $this->gold . ';font-size:10pt;letter-spacing:3px;">' . htmlspecialchars($en) . '</div>
            <div style="font-size:36pt;font-weight:bold;line-height:1.02;margin-top:4mm;">' . htmlspecialchars($project->name) . '</div>
            <div dir="rtl" style="font-size:17pt;color:#E9EDF3;margin-top:4mm;">' . $ar . ' — ' . $subject . '</div>
            <div style="font-size:10.5pt;color:#93A1AD;margin-top:3mm;">' . $meta . '</div>
            <table width="100%" style="margin-top:14mm;"><tr>
                <td style="vertical-align:bottom;">
                    <div style="color:' . $this->gold . ';font-size:9pt;letter-spacing:2px;font-weight:bold;">' . $priceLabel . '</div>
                    <div style="font-size:26pt;font-weight:bold;color:#fff;margin-top:1mm;">' . $price . '</div>
                </td>
                <td align="right" style="vertical-align:bottom;color:#7C8A99;font-size:8pt;">
                    تاريخ العرض<br><b style="color:#E9EDF3;">' . date('Y-m-d') . '</b>
                </td>
            </tr></table>
        </div>
        <pagebreak />';
    }

    // ── Content pages ──────────────────────────────────────

    protected function aboutCompoundPage(Project $project): string
    {
        $strip = $this->bgCover($this->firstImage([$project->image_url, $project->master_plan_image_url]), '66mm');

        $intro = '<p class="lead ar">يقع <b>' . htmlspecialchars($project->name) . '</b> في ' . htmlspecialchars((string) ($project->location ?: 'موقع متميّز'))
            . ' ليقدّم مجتمعاً سكنياً متكاملاً بمساحات خضراء واسعة وخدمات شاملة تلبّي احتياجات الأسرة العصرية، مع تصميمات معمارية حديثة وأنظمة أمان على مدار الساعة.</p>'
            . '<p class="lead en">' . htmlspecialchars($project->name) . ' is a fully integrated gated community offering generous green spaces, complete facilities and modern architecture with round-the-clock security.</p>';

        $facts = $this->factsCard([
            ['الموقع / Location', $project->location],
            ['نوع المشروع / Project type', Str::title(str_replace('_', ' ', (string) $project->project_type))],
            ['الحالة / Status', Str::title((string) $project->status)],
            ['التسليم / Delivery', $project->delivery_date],
        ]);

        $stats = $this->tileRow([
            [$project->total_units ? number_format((float) $project->total_units) : '—', 'إجمالي الوحدات', 'Total units'],
            [$project->total_buildings_count ? number_format((float) $project->total_buildings_count) : '—', 'عدد المباني', 'Buildings'],
            [$this->area($project->land_area, $project->land_area_unit) ?: '—', 'مساحة الأرض', 'Land area'],
        ]);

        $body = '<div style="height:64mm;">' . $strip . '</div>'
            . '<div class="pad">'
            . '<table width="100%"><tr>'
            . '<td width="56%" style="vertical-align:top;padding-left:8mm;">' . $intro . '</td>'
            . '<td width="44%" style="vertical-align:top;">' . $facts . '</td>'
            . '</tr></table>'
            . '<div style="height:8mm;"></div>' . $stats
            . '</div>';

        return $this->band('01', 'عن الكومبوند', 'About the compound') . $body . $this->lifestyleBand('60mm') . '<pagebreak />';
    }

    protected function masterPlanPage(Project $project): string
    {
        $img = $this->imageTag(
            $this->firstImage([$project->master_plan_image_url, $project->master_plan_svg_url, $project->image_url]),
            'max-width:100%;max-height:150mm;',
            true,
            'لا يتوفر مخطط عام مرفوع بعد. / No master-plan image uploaded yet.'
        );
        $stats = $this->tileRow([
            [$this->areaSqm($project->total_built_area) ?: '—', 'المساحة المبنية', 'Built area'],
            [$this->areaSqm($project->total_green_area) ?: '—', 'مساحات خضراء', 'Green area'],
            [$project->total_parking_spaces ? number_format((float) $project->total_parking_spaces) : '—', 'مواقف', 'Parking'],
            [$project->density_per_feddan ? $project->density_per_feddan : '—', 'وحدة/فدان', 'Density'],
        ]);
        $body = '<div class="pad"><div class="imgframe" style="margin-top:8mm;">' . $img . '</div>'
            . '<div style="height:6mm;"></div>' . $stats . '</div>';
        return $this->band('02', 'المخطط العام', 'Master plan') . $body . '<pagebreak />';
    }

    protected function locationPage(Project $project): string
    {
        $loc = htmlspecialchars((string) ($project->location ?: '—'));
        $near = [
            ['مدارس وجامعات', 'Schools & universities'],
            ['مراكز تجارية ومولات', 'Malls & retail'],
            ['مستشفيات وعيادات', 'Hospitals & clinics'],
            ['محاور وطرق رئيسية', 'Main axes & highways'],
            ['مطاعم وكافيهات', 'Dining & cafés'],
            ['نوادٍ ومساحات ترفيهية', 'Clubs & leisure'],
        ];
        $cells = '';
        foreach ($near as $i => $n) {
            if ($i % 2 === 0) { $cells .= '<tr>'; }
            $cells .= '<td width="50%" style="padding:5px;">' . $this->featureRow($n[0], $n[1]) . '</td>';
            if ($i % 2 === 1) { $cells .= '</tr>'; }
        }

        $body = '<div class="pad">'
            . '<p class="lead ar" style="margin-top:8mm;">يتميّز الموقع في <b>' . $loc . '</b> بسهولة الوصول من وإلى المحاور الرئيسية والطرق السريعة، مع قربه من كل الخدمات الحيوية التي تحتاجها الأسرة يومياً.</p>'
            . '<p class="lead en">The ' . $loc . ' location offers direct access to main axes and highways, and proximity to every key daily service.</p>'
            . '<h3 class="subhead">على مقربة منك <span class="muted">/ Around you</span></h3>'
            . '<table width="100%" style="border-collapse:collapse;">' . $cells . '</table>'
            . '</div>';
        return $this->band('03', 'الموقع وسهولة الوصول', 'Location & connectivity') . $body . $this->lifestyleBand('86mm') . '<pagebreak />';
    }

    protected function amenitiesPage(Project $project, $amenities): string
    {
        $items = [];
        if ($amenities && count($amenities)) {
            foreach ($amenities as $a) {
                $items[] = [
                    (string) ($a->name_ar ?: $a->type_label),
                    (string) ($a->name ?: $a->type_label),
                    $a->quantity ? ('عدد ' . $a->quantity) : ($a->area ? $this->areaSqm($a->area) : ''),
                ];
            }
        } else {
            foreach ([
                ['حمام سباحة', 'Swimming pool'], ['نادي رياضي', 'Gym & fitness'],
                ['مساحات خضراء', 'Landscaped gardens'], ['أمن 24 ساعة', '24/7 security'],
                ['منطقة تجارية', 'Commercial area'], ['مسجد', 'Mosque'],
                ['منطقة أطفال', 'Kids area'], ['مواقف سيارات', 'Parking'],
                ['مسار مشي', 'Walking track'], ['كلوب هاوس', 'Clubhouse'],
            ] as $d) { $items[] = [$d[0], $d[1], '']; }
        }

        $cells = '';
        foreach ($items as $i => $it) {
            if ($i % 2 === 0) { $cells .= '<tr>'; }
            $cells .= '<td width="50%" style="padding:6px;">' . $this->amenityCard($it[0], $it[1], $it[2]) . '</td>';
            if ($i % 2 === 1) { $cells .= '</tr>'; }
        }
        if (count($items) % 2 === 1) { $cells .= '<td width="50%"></td></tr>'; }

        $body = '<div class="pad">'
            . '<p class="lead ar" style="margin-top:8mm;">مجتمع متكامل الخدمات صُمّم ليمنحك أسلوب حياة راقٍ. / A fully-serviced community designed for an elevated lifestyle.</p>'
            . '<table width="100%" style="border-collapse:collapse;">' . $cells . '</table>'
            . '</div>';
        // Adaptive band: fewer amenities → taller image, so the page always fills.
        $rows = (int) ceil(count($items) / 2);
        $bandH = max(60, min(190, 210 - $rows * 16));
        return $this->band('04', 'الخدمات والمرافق', 'Amenities & facilities') . $body . $this->lifestyleBand($bandH . 'mm') . '<pagebreak />';
    }

    protected function infrastructurePage(Project $project): string
    {
        $tiles = $this->tileRow([
            [$this->areaSqm($project->total_built_area) ?: '—', 'المساحة المبنية', 'Built area'],
            [$this->areaSqm($project->total_green_area) ?: '—', 'مساحات خضراء', 'Green area'],
            [$project->total_parking_spaces ? number_format((float) $project->total_parking_spaces) : '—', 'مواقف سيارات', 'Parking'],
            [$project->total_buildings_count ? number_format((float) $project->total_buildings_count) : '—', 'عدد المباني', 'Buildings'],
        ]);
        $facts = $this->factsCard([
            ['نسبة البناء / Building ratio', $project->building_ratio ? $project->building_ratio . '%' : null],
            ['أقصى ارتفاع / Max height', $project->max_height_allowed ? $project->max_height_allowed . ' م' : null],
            ['أقصى عدد أدوار / Max floors', $project->max_floors_allowed],
            ['مساحة الطرق / Roads area', $this->areaSqm($project->total_roads_area)],
            ['الكثافة / Density', $project->density_per_feddan ? $project->density_per_feddan . ' وحدة/فدان' : null],
            ['ملاحظات / Notes', $project->infrastructure_notes],
        ], true);

        $body = '<div class="pad"><div style="height:8mm;"></div>' . $tiles
            . '<div style="height:8mm;"></div>' . $facts . '</div>';
        return $this->band('05', 'البنية التحتية والإحصائيات', 'Infrastructure & statistics') . $body . $this->lifestyleBand('78mm') . '<pagebreak />';
    }

    protected function unitOverviewPage(Unit $unit): string
    {
        $specs = [
            [$this->areaSqm($unit->area) ?: '—', 'المساحة', 'Built-up area'],
            [$this->areaSqm($unit->net_area) ?: '—', 'صافي', 'Net area'],
            [$unit->bedrooms ?? '—', 'غرف نوم', 'Bedrooms'],
            [$unit->bathrooms ?? '—', 'حمامات', 'Bathrooms'],
            [$unit->living_rooms ?? '—', 'معيشة', 'Living'],
            [$unit->kitchen_count ?? '—', 'مطابخ', 'Kitchens'],
            [$unit->balcony_count ?? '—', 'شرفات', 'Balconies'],
            [$unit->floor === 0 ? 'أرضي' : ($unit->floor ?? '—'), 'الدور', 'Floor'],
        ];
        $grid = '';
        for ($i = 0; $i < count($specs); $i += 4) {
            $grid .= '<tr>';
            for ($j = $i; $j < $i + 4 && $j < count($specs); $j++) {
                $grid .= '<td width="25%" style="padding:5px;">' . $this->specTile($specs[$j][0], $specs[$j][1], $specs[$j][2]) . '</td>';
            }
            $grid .= '</tr>';
        }

        $facts = $this->factsCard([
            ['رقم الوحدة / Unit number', $unit->unit_number],
            ['النوع / Type', Str::title(str_replace('_', ' ', (string) $unit->type))],
            ['المبنى / Building', $unit->building],
            ['الإطلالة / View', Str::title((string) $unit->view_type)],
            ['الاتجاه / Orientation', $unit->orientation],
            ['التشطيب / Finishing', Str::title(str_replace('_', ' ', (string) $unit->finishing_type))],
            ['المرحلة / Phase', $unit->phase],
            ['الاستلام / Handover', $unit->handover_date],
        ], true);

        $extras = [];
        if ($unit->has_maid_room) { $extras[] = 'غرفة خادمة'; }
        if ($unit->has_storage) { $extras[] = 'غرفة تخزين'; }
        if ($unit->has_private_garden) { $extras[] = 'حديقة خاصة'; }
        if ($unit->has_private_parking) { $extras[] = 'جراج خاص'; }
        $extraBar = $extras
            ? '<div class="goldbar"><b>مميزات إضافية · Extras:</b> &nbsp; ' . implode(' &nbsp;•&nbsp; ', $extras) . '</div>'
            : '';

        $body = '<div class="pad"><div style="height:7mm;"></div>'
            . '<table width="100%" style="border-collapse:collapse;">' . $grid . '</table>'
            . '<div style="height:6mm;"></div>' . $facts
            . ($extraBar ? '<div style="height:6mm;"></div>' . $extraBar : '')
            . '</div>';
        return $this->band('06', 'تفاصيل الوحدة', 'Unit details', 'متاحة الآن · Available') . $body . $this->lifestyleBand('64mm') . '<pagebreak />';
    }

    protected function unitLayoutPage(Unit $unit, Project $project): string
    {
        $floorPlan = ProjectMedia::where('project_id', $project->id)->where('media_type', 'floor_plan')->value('image_path');
        $img = $this->imageTag(
            $this->firstImage([$unit->layout_image_url, $floorPlan, $project->master_plan_image_url, $project->image_url]),
            'max-width:100%;max-height:150mm;',
            true,
            'لم يتم رفع مخطط تفصيلي لهذه الوحدة بعد. / No detailed layout image uploaded for this unit yet.'
        );
        $desc = $unit->layout_description
            ? '<div class="card ar" style="margin-top:6mm;">' . htmlspecialchars($unit->layout_description) . '</div>'
            : '<div class="card ar muted" style="margin-top:6mm;">تصميم عصري بمساحات مفتوحة يوفّر أقصى استفادة من المساحة والإضاءة الطبيعية. / A modern open-plan design maximising space and natural light.</div>';
        $body = '<div class="pad"><div class="imgframe" style="margin-top:8mm;">' . $img . '</div>' . $desc . '</div>';
        return $this->band('07', 'تصميم ومخطط الوحدة', 'Unit layout & design') . $body . '<pagebreak />';
    }

    protected function pricingPage(Unit $unit, $plans): string
    {
        $perM = ($unit->area && (float) $unit->area > 0) ? round((float) $unit->price / (float) $unit->area) : null;

        $hero = '<div class="pricehero">'
            . '<div style="color:' . $this->gold . ';font-size:10pt;letter-spacing:2px;">سعر الوحدة الإجمالي · TOTAL UNIT PRICE</div>'
            . '<div style="font-size:34pt;font-weight:bold;color:#fff;margin:3mm 0;">' . $this->money($unit->price) . '</div>'
            . ($perM ? '<div style="color:#C9D3DE;font-size:10pt;">≈ ' . number_format($perM) . ' ج.م / م² · EGP per m²</div>' : '')
            . '</div>';

        $facts = $this->factsCard([
            ['سعر المتر / Price per m²', $perM ? number_format($perM) . ' ج.م' : null],
            ['الحد الأدنى للمقدم / Minimum down payment', $unit->min_down_payment ? $this->money($unit->min_down_payment) : null],
            ['المساحة / Area', $this->areaSqm($unit->area)],
            ['أنظمة السداد المتاحة / Payment plans', count($plans) ? count($plans) . ' نظام' : null],
        ], true);

        $cta = '<div class="goldbar" style="text-align:center;font-size:11pt;">جاهز للحجز؟ تواصل مع فريق المبيعات لتثبيت الوحدة اليوم · Ready to reserve? Contact sales today.</div>';

        $body = '<div class="pad"><div style="height:9mm;"></div>' . $hero
            . '<div style="height:7mm;"></div>' . $facts
            . '<div style="height:9mm;"></div>' . $cta . '</div>';
        return $this->band('08', 'السعر', 'Pricing') . $body . $this->lifestyleBand('78mm') . '<pagebreak />';
    }

    // ── Compound price-list ────────────────────────────────

    /** @return array<int,string> */
    protected function priceListPages(Project $project, $units): array
    {
        $sorted = $units->sortBy([['type', 'asc'], ['price', 'asc']])->values();
        $chunks = $sorted->chunk(20)->values();
        $pages = [];

        foreach ($chunks as $ci => $chunk) {
            $rows = '';
            foreach ($chunk as $u) {
                $perM = ($u->area && (float) $u->area > 0) ? round((float) $u->price / (float) $u->area) : null;
                $rows .= '<tr>'
                    . '<td style="font-weight:bold;color:' . $this->navy . ';">' . htmlspecialchars((string) $u->unit_number) . '</td>'
                    . '<td>' . htmlspecialchars((string) Str::title(str_replace('_', ' ', (string) $u->type))) . '</td>'
                    . '<td class="num">' . ((int) $u->area ?: '—') . '</td>'
                    . '<td class="num">' . ($u->bedrooms ?? '—') . '</td>'
                    . '<td>' . htmlspecialchars((string) (Str::title((string) $u->view_type) ?: '—')) . '</td>'
                    . '<td class="num" style="color:' . $this->muted . ';">' . ($perM ? number_format($perM) : '—') . '</td>'
                    . '<td class="num" style="font-weight:bold;color:' . $this->navy . ';">' . $this->money($u->price) . '</td>'
                    . '</tr>';
            }

            $intro = $ci === 0
                ? '<p class="lead ar" style="margin-top:7mm;">جميع الوحدات المتاحة حالياً في ' . htmlspecialchars($project->name) . ' — ' . $units->count() . ' وحدة، مرتّبة حسب النوع والسعر.</p>'
                : '<div class="contd">قائمة الأسعار — تابع / Price list (cont.) · ' . ($ci + 1) . '</div>';

            $table = '<table class="grid"><thead><tr>'
                . '<th>الوحدة<br><span class="th-en">Unit</span></th>'
                . '<th>النوع<br><span class="th-en">Type</span></th>'
                . '<th class="num">م²<br><span class="th-en">Area</span></th>'
                . '<th class="num">غرف<br><span class="th-en">Beds</span></th>'
                . '<th>الإطلالة<br><span class="th-en">View</span></th>'
                . '<th class="num">ج.م/م²<br><span class="th-en">/m²</span></th>'
                . '<th class="num">السعر<br><span class="th-en">Price</span></th>'
                . '</tr></thead><tbody>' . $rows . '</tbody></table>';

            $band = $ci === 0
                ? $this->band('06', 'قائمة أسعار الوحدات المتاحة', 'Available units — price list')
                : $this->band('06', 'قائمة الأسعار', 'Price list');
            $pages[] = $band . '<div class="pad">' . $intro . $table . '</div><pagebreak />';
        }
        return $pages;
    }

    // ── Payment plans ──────────────────────────────────────

    protected function paymentPlansIntroPage(?Unit $unit, $plans): string
    {
        $basis = $unit
            ? 'محسوبة على سعر الوحدة ' . htmlspecialchars($unit->unit_number) . ' (' . $this->money($unit->price) . ').'
            : 'النِسب أدناه تُطبَّق على سعر أي وحدة تختارها من قائمة الأسعار.';

        $rows = '';
        if ($plans && count($plans)) {
            foreach ($plans as $i => $p) {
                $netCol = $unit ? $this->money($this->calcPlan((float) $unit->price, $p)['net']) : '—';
                $rows .= '<tr>'
                    . '<td style="color:' . $this->gold . ';font-weight:bold;">' . str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) . '</td>'
                    . '<td dir="rtl" style="font-weight:bold;color:' . $this->navy . ';">' . htmlspecialchars((string) ($p->name_ar ?: $p->name)) . '</td>'
                    . '<td class="num">' . (int) $p->down_payment_pct . '%</td>'
                    . '<td class="num">' . (int) $p->installments . '</td>'
                    . '<td class="num">' . ((float) $p->discount_pct > 0 ? (int) $p->discount_pct . '%' : '—') . '</td>'
                    . '<td class="num" style="font-weight:bold;">' . $netCol . '</td>'
                    . '</tr>';
            }
        } else {
            $rows = '<tr><td colspan="6" class="muted ar">لا توجد أنظمة سداد مسجّلة بعد. / No payment plans registered yet.</td></tr>';
        }

        $body = '<div class="pad">'
            . '<p class="lead ar" style="margin-top:7mm;">اختر النظام الأنسب لك — التفاصيل الكاملة لكل نظام في الصفحات التالية. ' . $basis . '</p>'
            . '<table class="grid"><thead><tr>'
            . '<th>#</th><th>النظام / Plan</th><th class="num">مقدم / DP</th><th class="num">أقساط / Inst.</th><th class="num">خصم / Disc.</th><th class="num">' . ($unit ? 'الصافي / Net' : '—') . '</th>'
            . '</tr></thead><tbody>' . $rows . '</tbody></table>'
            . '</div>';
        return $this->band($unit ? '09' : '07', 'أنظمة السداد المتاحة', 'Available payment plans') . $body . $this->lifestyleBand('78mm') . '<pagebreak />';
    }

    protected function paymentPlanPage(?Unit $unit, ProjectPaymentPlan $plan, int $idx, int $total, $units = null): string
    {
        $nameAr = htmlspecialchars((string) ($plan->name_ar ?: $plan->name ?: ('نظام ' . $idx)));
        $nameEn = htmlspecialchars((string) ($plan->name ?: ('Plan ' . $idx)));

        if ($unit) {
            $c = $this->calcPlan((float) $unit->price, $plan);
            $tiles = $this->tileRow([
                [$this->money($c['down']), 'الدفعة المقدمة', (int) $plan->down_payment_pct . '% down'],
                [(string) (int) $plan->installments, 'عدد الأقساط', 'Installments'],
                [$c['per'] > 0 ? $this->money($c['per']) : '—', 'قيمة القسط', 'Per installment'],
                [$this->money($c['net']), 'الإجمالي', 'Total'],
            ]);
            $extra = $this->scheduleTable($c, (int) $plan->installments);
        } else {
            $min = (float) $units->min('price');
            $max = (float) $units->max('price');
            $cmin = $this->calcPlan($min, $plan);
            $cmax = $this->calcPlan($max, $plan);
            $tiles = $this->tileRow([
                [(int) $plan->down_payment_pct . '%', 'الدفعة المقدمة', 'Down payment'],
                [(string) (int) $plan->installments, 'عدد الأقساط', 'Installments'],
                [(float) $plan->discount_pct > 0 ? (int) $plan->discount_pct . '%' : '—', 'الخصم', 'Discount'],
            ]);
            $extra = '<table class="grid"><thead><tr><th>البند / Item</th><th class="num">أقل وحدة / Lowest</th><th class="num">أعلى وحدة / Highest</th></tr></thead><tbody>'
                . '<tr><td dir="rtl">السعر بعد الخصم / Net price</td><td class="num">' . $this->money($cmin['net']) . '</td><td class="num">' . $this->money($cmax['net']) . '</td></tr>'
                . '<tr><td dir="rtl">الدفعة المقدمة / Down payment</td><td class="num">' . $this->money($cmin['down']) . '</td><td class="num">' . $this->money($cmax['down']) . '</td></tr>'
                . '<tr><td dir="rtl">قيمة القسط / Per installment</td><td class="num">' . $this->money($cmin['per']) . '</td><td class="num">' . $this->money($cmax['per']) . '</td></tr>'
                . '</tbody></table>';
        }

        $descAr = $plan->description ? '<div class="card ar" style="margin-top:6mm;">' . htmlspecialchars($plan->description) . '</div>' : '';
        $body = '<div class="pad"><div style="height:8mm;"></div>' . $tiles
            . '<div style="height:6mm;"></div>' . $extra . $descAr
            . '<p class="note" style="margin-top:6mm;">جدول توضيحي — تُثبَّت مواعيد الأقساط في عقد الحجز الرسمي. / Illustrative; exact due dates are fixed in the reservation contract.</p>'
            . '</div>';
        return $this->band(str_pad((string) $idx, 2, '0', STR_PAD_LEFT) . '·' . $total, $nameAr, $nameEn) . $body . $this->lifestyleBand('72mm') . '<pagebreak />';
    }

    protected function scheduleTable(array $c, int $n): string
    {
        $s = '<table class="grid"><thead><tr><th>#</th><th>الدفعة / Payment</th><th class="num">القيمة / Amount</th><th class="num">المتبقّي / Balance</th></tr></thead><tbody>';
        $balance = $c['net'] - $c['down'];
        $s .= '<tr><td>—</td><td dir="rtl">الدفعة المقدمة / Down payment</td><td class="num">' . $this->money($c['down']) . '</td><td class="num">' . $this->money(max(0, $balance)) . '</td></tr>';
        $shown = min($n, 10);
        for ($k = 1; $k <= $shown; $k++) {
            $balance -= $c['per'];
            $s .= '<tr><td>' . $k . '</td><td dir="rtl">قسط ' . $k . ' / Installment ' . $k . '</td><td class="num">' . $this->money($c['per']) . '</td><td class="num">' . $this->money(max(0, $balance)) . '</td></tr>';
        }
        if ($n > $shown) {
            $rem = $n - $shown;
            $s .= '<tr><td>…</td><td dir="rtl" class="muted">+ ' . $rem . ' قسط إضافي / more</td><td class="num muted">' . $this->money($c['per']) . ' × ' . $rem . '</td><td class="num">—</td></tr>';
        }
        $s .= '<tr class="total"><td colspan="2">الإجمالي / Total contract value</td><td class="num">' . $this->money($c['net']) . '</td><td></td></tr>';
        $s .= '</tbody></table>';
        return $s;
    }

    // ── Closing pages ──────────────────────────────────────

    protected function termsPage(): string
    {
        $terms = [
            ['هذا العرض إرشادي ولا يُعدّ عقداً ملزماً؛ يخضع الحجز النهائي لتوقيع عقد رسمي واستيفاء إجراءات الـ KYC.', 'This offer is indicative and not a binding contract; final booking is subject to a signed contract and completed KYC.'],
            ['الأسعار وأنظمة السداد سارية بتاريخ العرض وقابلة للتغيير دون إشعار حسب توافر الوحدات.', 'Prices and payment plans are valid as of the offer date and may change without notice, subject to availability.'],
            ['يتم تأكيد حجز الوحدة فقط بعد سداد دفعة الحجز واعتمادها من الإدارة المالية.', 'A unit is confirmed only after the reservation payment is received and approved by finance.'],
            ['جميع المساحات تقريبية وقد تختلف اختلافاً طفيفاً عند التسليم الفعلي.', 'All areas are approximate and may vary slightly on final delivery.'],
            ['تخضع أي خصومات أو عروض ترويجية للشروط المعلنة ولمدة سريانها.', 'Discounts and promotions are subject to their published terms and validity.'],
        ];
        $rows = '';
        foreach ($terms as $i => $t) {
            $rows .= '<tr><td class="tnum">' . ($i + 1) . '</td><td><div class="ar" style="font-weight:bold;color:' . $this->ink . ';">' . htmlspecialchars($t[0]) . '</div><div class="en muted" style="font-size:8.5pt;">' . htmlspecialchars($t[1]) . '</div></td></tr>';
        }
        $body = '<div class="pad"><div style="height:8mm;"></div><table class="terms">' . $rows . '</table></div>';
        return $this->band('·', 'الشروط والأحكام', 'Terms & conditions') . $body . $this->lifestyleBand('92mm') . '<pagebreak />';
    }

    protected function contactPage(Project $project, ?string $unitNumber): string
    {
        $subjAr = $unitNumber
            ? 'مهتم بوحدة <b>' . htmlspecialchars($unitNumber) . '</b> في <b>' . htmlspecialchars($project->name) . '</b>؟'
            : 'مهتم بإحدى الوحدات المتاحة في <b>' . htmlspecialchars($project->name) . '</b>؟';

        $facts = $this->factsCard([
            ['خط المبيعات / Sales hotline', '16REDP'],
            ['البريد / Email', 'sales@redp.example'],
            ['المشروع / Project', $project->name],
            $unitNumber ? ['الوحدة / Unit', $unitNumber] : ['النطاق / Scope', 'كل الوحدات المتاحة'],
        ], true);

        $body = '<div class="pad"><div style="height:9mm;"></div>'
            . '<p class="lead ar">' . $subjAr . ' تواصل مع فريق المبيعات لحجز معاينة أو تثبيت الوحدة بنظام السداد المناسب لك. فريقنا جاهز لمساعدتك في كل خطوة.</p>'
            . '<p class="lead en">Contact our sales team to book a viewing or reserve under the plan that suits you.</p>'
            . '<div style="height:5mm;"></div>' . $facts
            . '<div style="height:11mm;"></div><div style="text-align:center;"><span class="cta">احجز وحدتك اليوم · Reserve your unit today</span></div>'
            . '</div>';
        return $this->band('·', 'تواصل معنا', 'Contact & next steps') . $body . $this->lifestyleBand('78mm') . '<pagebreak />';
    }

    protected function backCoverPage(Project $project): string
    {
        return '
        <div style="background:' . $this->navy . ';color:#fff;padding:48mm 18mm;text-align:center;height:297mm;">
            <div style="font-size:9pt;letter-spacing:5px;color:' . $this->gold . ';">R E D P</div>
            <div style="border-top:1px solid rgba(255,255,255,0.14);width:56mm;margin:9mm auto;"></div>
            <div style="font-size:28pt;font-weight:bold;margin-top:30mm;">' . htmlspecialchars($project->name) . '</div>
            <div dir="rtl" style="font-size:15pt;color:#E9EDF3;margin-top:6px;">شكراً لاهتمامك — نتطلّع لخدمتك</div>
            <div style="font-size:10pt;color:#93A1AD;">Thank you for your interest — we look forward to serving you</div>
            <div style="margin-top:52mm;font-size:8pt;color:#6E7C8B;">© ' . date('Y') . ' REDP — وثيقة سرية / Confidential document</div>
        </div>';
    }

    // ── Reusable building blocks ───────────────────────────

    /** Full-bleed navy section band. $badge shows a small pill on the right. */
    protected function band(string $no, string $ar, string $en, ?string $badge = null): string
    {
        $pill = $badge ? '<div style="margin-top:3mm;"><span class="pill">' . htmlspecialchars($badge) . '</span></div>' : '';
        return '<div class="band"><table width="100%"><tr>'
            . '<td style="vertical-align:bottom;">'
            . '<div class="band-no">' . htmlspecialchars($no) . '</div>'
            . '<div class="band-en">' . htmlspecialchars($en) . '</div>' . $pill
            . '</td>'
            . '<td style="vertical-align:bottom;text-align:right;"><div class="band-ar">' . htmlspecialchars($ar) . '</div></td>'
            . '</tr></table></div><div class="rulebar"></div>';
    }

    /** A row of equal stat tiles. @param array<int,array{0:string,1:string,2:string}> $tiles */
    protected function tileRow(array $tiles): string
    {
        $w = (int) floor(100 / max(1, count($tiles)));
        $cells = '';
        foreach ($tiles as $t) {
            $cells .= '<td width="' . $w . '%" style="padding:4px;">' . $this->specTile($t[0], $t[1], $t[2]) . '</td>';
        }
        return '<table width="100%" style="border-collapse:collapse;"><tr>' . $cells . '</tr></table>';
    }

    protected function specTile(string $value, string $ar, string $en): string
    {
        return '<div class="tile">'
            . '<div class="tile-n">' . htmlspecialchars((string) $value) . '</div>'
            . '<div class="tile-ar ar">' . htmlspecialchars($ar) . '</div>'
            . '<div class="tile-en">' . htmlspecialchars($en) . '</div>'
            . '</div>';
    }

    protected function amenityCard(string $ar, string $en, string $extra): string
    {
        return '<table width="100%" class="amenity"><tr>'
            . '<td style="vertical-align:middle;"><div class="am-ar ar">' . htmlspecialchars($ar) . '</div>'
            . '<div class="am-en">' . htmlspecialchars($en) . ($extra ? ' · ' . htmlspecialchars($extra) : '') . '</div></td>'
            . '<td width="30" style="vertical-align:middle;text-align:right;"><div class="am-dot"></div></td>'
            . '</tr></table>';
    }

    protected function featureRow(string $ar, string $en): string
    {
        return '<table width="100%" class="feature"><tr>'
            . '<td width="26" style="vertical-align:middle;"><div class="am-dot"></div></td>'
            . '<td style="vertical-align:middle;"><span class="ar" style="font-weight:bold;color:' . $this->ink . ';">' . htmlspecialchars($ar) . '</span> <span class="muted" style="font-size:8pt;">' . htmlspecialchars($en) . '</span></td>'
            . '</tr></table>';
    }

    /**
     * Card-wrapped facts list. Label strings are "arabic / english"; empty rows skipped.
     * @param array<int,array{0:string,1:mixed}> $rows
     */
    protected function factsCard(array $rows, bool $bare = false): string
    {
        $html = '<table class="facts">';
        $r = 0;
        foreach ($rows as $row) {
            [$label, $value] = $row;
            if ($value === null || $value === '' || $value === '—') {
                continue;
            }
            $parts = explode(' / ', (string) $label, 2);
            $ar = $parts[0];
            $en = $parts[1] ?? '';
            $alt = $r % 2 === 1 ? ' class="alt"' : '';
            $html .= '<tr' . $alt . '><td class="k"><span class="k-ar">' . htmlspecialchars($ar) . '</span>'
                . ($en ? ' <span class="k-en">' . htmlspecialchars($en) . '</span>' : '')
                . '</td><td class="v">' . htmlspecialchars((string) $value) . '</td></tr>';
            $r++;
        }
        $html .= '</table>';
        return $bare ? '<div class="card p0">' . $html . '</div>' : '<div class="card p0">' . $html . '</div>';
    }

    // ── CSS ────────────────────────────────────────────────

    protected function css(): string
    {
        return "
            body { font-family: dejavusans, sans-serif; color: {$this->body}; font-size: 10.5pt; line-height: 1.6; }
            .ar { direction: rtl; text-align: right; }
            .en { direction: ltr; text-align: left; }
            .muted { color: {$this->muted}; }
            .pad { padding: 0 16mm; }
            .lead { font-size: 10.5pt; color: {$this->body}; margin: 0 0 7px; }
            .lead.en { color: {$this->muted}; font-size: 9.5pt; }
            .note { font-size: 8pt; color: {$this->muted}; line-height: 1.5; }
            .subhead { color: {$this->navy}; font-size: 13pt; margin: 6mm 0 3mm; font-weight: bold; }

            .band { background: {$this->navy}; color: #fff; padding: 13mm 16mm 9mm; }
            .band-no { color: {$this->gold}; font-size: 9pt; letter-spacing: 4px; font-weight: bold; }
            .band-en { color: #9DAAB8; font-size: 10pt; letter-spacing: 2px; margin-top: 1mm; }
            .band-ar { color: #fff; font-size: 24pt; font-weight: bold; line-height: 1.05; }
            .rulebar { height: 3px; background: {$this->gold}; }

            .card { border: 1px solid {$this->line}; border-radius: 10px; padding: 14px 16px; background: {$this->cream}; }
            .card.p0 { padding: 4px 0; }

            table.facts { width: 100%; border-collapse: collapse; }
            table.facts td { padding: 8px 14px; font-size: 9.5pt; border-bottom: 1px solid {$this->line}; vertical-align: middle; }
            table.facts tr:last-child td { border-bottom: none; }
            table.facts td.k { color: {$this->body}; width: 56%; }
            table.facts td.k .k-ar { font-weight: bold; color: {$this->ink}; }
            table.facts td.k .k-en { color: {$this->muted}; font-size: 8pt; }
            table.facts td.v { font-weight: bold; text-align: right; color: {$this->navy}; }
            table.facts tr.alt td { background: #fff; }

            table.grid { width: 100%; border-collapse: collapse; margin-top: 6mm; font-size: 9.5pt; }
            table.grid th { background: {$this->navy}; color: #fff; padding: 8px 8px; text-align: left; font-size: 8.5pt; font-weight: bold; line-height: 1.2; }
            table.grid th.num, table.grid td.num { text-align: right; }
            table.grid th .th-en { color: #9DAAB8; font-weight: normal; font-size: 7pt; }
            table.grid td { padding: 7px 8px; border-bottom: 1px solid {$this->line}; }
            table.grid tbody tr:nth-child(even) td { background: {$this->cream}; }
            table.grid tr.total td { font-weight: bold; background: {$this->goldSoft}; border-top: 2px solid {$this->gold}; color: {$this->navy}; }

            .tile { border: 1px solid {$this->line}; border-radius: 10px; background: {$this->cream}; padding: 12px 6px; text-align: center; }
            .tile-n { font-size: 17pt; font-weight: bold; color: {$this->navy}; }
            .tile-ar { font-weight: bold; font-size: 8.5pt; color: {$this->ink}; margin-top: 1mm; }
            .tile-en { color: {$this->muted}; font-size: 7pt; }

            .amenity { border: 1px solid {$this->line}; border-radius: 9px; background: #fff; }
            .amenity td { padding: 11px 13px; }
            .am-ar { font-weight: bold; font-size: 10pt; color: {$this->navy}; }
            .am-en { color: {$this->muted}; font-size: 8pt; }
            .am-dot { width: 10px; height: 10px; border-radius: 6px; background: {$this->gold}; }
            .feature td { padding: 9px 6px; border-bottom: 1px solid {$this->line}; }

            .goldbar { background: {$this->goldSoft}; border-left: 3px solid {$this->gold}; border-radius: 6px; padding: 11px 14px; color: {$this->navy}; font-size: 9.5pt; }
            .pill { background: rgba(196,160,82,0.18); color: {$this->gold}; border: 1px solid {$this->gold}; border-radius: 20px; padding: 3px 12px; font-size: 8pt; font-weight: bold; }
            .cta { background: {$this->gold}; color: {$this->navy}; border-radius: 24px; padding: 11px 30px; font-size: 12pt; font-weight: bold; }
            .contd { color: {$this->navy}; font-size: 10pt; font-weight: bold; margin-top: 6mm; }

            .imgframe { border: 1px solid {$this->line}; border-radius: 10px; padding: 8px; background: #fff; text-align: center; }
            .imgframe img { max-width: 100%; }

            .pricehero { background: {$this->navy}; border-radius: 14px; padding: 26px; text-align: center; }

            table.terms { width: 100%; border-collapse: collapse; }
            table.terms td { padding: 9px 10px; border-bottom: 1px solid {$this->line}; vertical-align: top; }
            table.terms td.tnum { width: 30px; color: {$this->gold}; font-weight: bold; font-size: 12pt; }
        ";
    }

    // ── Helpers ────────────────────────────────────────────

    protected function calcPlan(float $price, ProjectPaymentPlan $plan): array
    {
        $discount = $price * (float) $plan->discount_pct / 100;
        $net = max(0, $price - $discount);
        $down = $net * (float) $plan->down_payment_pct / 100;
        $remaining = max(0, $net - $down);
        $count = (int) $plan->installments;
        $per = $count > 0 ? $remaining / $count : 0;
        return compact('net', 'discount', 'down', 'remaining', 'per');
    }

    protected function money($n): string
    {
        return number_format((float) $n, 0) . ' ج.م';
    }

    protected function area($value, $unit): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $map = ['feddan' => 'فدان', 'acre' => 'فدان', 'sqm' => 'م²', 'm2' => 'م²'];
        return number_format((float) $value, 2) . ' ' . ($map[$unit] ?? ($unit ?: 'م²'));
    }

    protected function areaSqm($value): ?string
    {
        if ($value === null || $value === '' || (float) $value == 0.0) {
            return null;
        }
        return number_format((float) $value, 0) . ' م²';
    }

    /** @param array<int,?string> $candidates */
    protected function firstImage(array $candidates): ?string
    {
        foreach ($candidates as $c) {
            if (!$c) {
                continue;
            }
            $path = $this->resolveLocalImage((string) $c);
            if ($path) {
                return $path;
            }
        }
        return null;
    }

    protected function resolveLocalImage(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        $rel = $value;
        if (Str::startsWith($rel, ['http://', 'https://'])) {
            $rel = (string) parse_url($rel, PHP_URL_PATH);
        }
        $rel = ltrim($rel, '/');
        $rel = preg_replace('#^storage/#', '', $rel);
        foreach ([Storage::disk('public')->path($rel), public_path($value), base_path($value)] as $abs) {
            if ($abs && is_file($abs)) {
                return $abs;
            }
        }
        return null;
    }

    /** Inline framed image, or a styled placeholder. */
    protected function imageTag(?string $absolutePath, string $imgStyle = '', bool $placeholder = true, string $placeholderText = ''): string
    {
        if ($absolutePath && is_file($absolutePath)) {
            $src = 'file://' . str_replace('\\', '/', $absolutePath);
            return '<img src="' . htmlspecialchars($src) . '" style="' . $imgStyle . '" />';
        }
        if (!$placeholder) {
            return '';
        }
        $txt = $placeholderText ?: 'الصورة غير متوفرة / Image not available';
        return '<div style="padding:44px 16px;color:' . $this->muted . ';text-align:center;font-size:9pt;background:' . $this->cream . ';border-radius:8px;">' . htmlspecialchars($txt) . '</div>';
    }

    /** Gather a de-duplicated pool of lifestyle photos for page-filling bands. */
    protected function buildBandPool(Project $project): void
    {
        $this->bandPool = [];
        $this->bandCursor = 0;

        $candidates = [$project->image_url];
        try {
            foreach (ProjectMedia::where('project_id', $project->id)
                ->whereIn('media_type', ['building', 'cover_gallery'])
                ->pluck('image_path') as $ip) {
                $candidates[] = $ip;
            }
        } catch (\Throwable $e) {
            // best effort
        }
        $candidates[] = $project->master_plan_image_url;

        $seen = [];
        foreach ($candidates as $c) {
            if (!$c) {
                continue;
            }
            $abs = $this->resolveLocalImage((string) $c);
            if ($abs && !in_array($abs, $seen, true)) {
                $seen[] = $abs;
                $this->bandPool[] = $abs;
            }
        }
    }

    /** Next lifestyle image from the pool (cycles), or null if none. */
    protected function nextBand(): ?string
    {
        if (empty($this->bandPool)) {
            return null;
        }
        $img = $this->bandPool[$this->bandCursor % count($this->bandPool)];
        $this->bandCursor++;
        return $img;
    }

    /** A full-bleed lifestyle image band to fill the bottom of a text-light page. */
    protected function lifestyleBand(string $height = '76mm'): string
    {
        $img = $this->nextBand();
        if (!$img) {
            return '';
        }
        return '<div style="height:5mm;"></div><div class="rulebar"></div>' . $this->bgCover($img, $height);
    }

    /** Full-width cover image that fills a fixed-height box (crops to fit), or a navy fallback. */
    protected function bgCover(?string $absolutePath, string $height): string
    {
        if ($absolutePath && is_file($absolutePath)) {
            $src = 'file://' . str_replace('\\', '/', $absolutePath);
            return '<div style="height:' . $height . ';background-image:url(\'' . htmlspecialchars($src) . '\');background-size:cover;background-position:center;"></div>';
        }
        return '<div style="height:' . $height . ';background:' . $this->navy2 . ';"></div>';
    }

    /** Full standalone HTML for browser previewing only (not the PDF). */
    public function previewHtml(Unit $unit): string
    {
        $unit->loadMissing('project');
        $project = $unit->project;
        $amenities = ProjectAmenity::where('project_id', $project->id)->get();
        $plans = ProjectPaymentPlan::where('project_id', $project->id)->get();
        $sections = $this->unitSections($unit, $project, $amenities, $plans);
        $body = implode('', $sections);
        return '<html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{width:210mm;margin:0 auto}' . $this->css() . '</style></head><body>' . $body . '</body></html>';
    }
}
