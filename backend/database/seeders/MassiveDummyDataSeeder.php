<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Building;
use App\Models\BuildingFloor;
use App\Models\BuildingHotspot;
use App\Models\ProjectAmenity;
use App\Models\ProjectMedia;
use App\Models\Campaign;
use App\Models\Broker;
use App\Models\Lead;
use App\Models\Interaction;
use App\Models\Contract;
use App\Models\PaymentPlan;
use App\Models\Payment;
use App\Models\CollectionsQueue;
use App\Models\ReschedulingRequest;
use App\Models\Commission;
use App\Models\CommissionCalculation;
use App\Models\CommissionRule;
use App\Models\Vendor;
use App\Models\MaintenanceTicket;
use App\Models\DefectsSnag;
use Illuminate\Support\Str;

class MassiveDummyDataSeeder extends Seeder
{
    // ═══════════════════════════════════════════════════════════════
    // Image URL Pools (Unsplash — stable, high-resolution)
    // ═══════════════════════════════════════════════════════════════
    private array $compoundCovers = [
        'projects/generated/patio_cover.png',                                      // Patio: Generated cover
        'projects/generated/uptown_cover.png',                                     // Uptown: Generated cover
        'projects/generated/aliva_cover.png',                                      // Aliva: Generated cover
        'projects/generated/seaview_cover.png',                                    // Sea View: Beach lagoon resort (coastal)
        'projects/generated/downtown_cover.png',                                   // Downtown: Skyscrapers hub
        'projects/generated/goldengates_cover.png',                                // Golden Gates: Generated cover
    ];

    private array $masterPlanImages = [
        'projects/generated/patio_masterplan.jpg',                                 // Patio: Generated masterplan
        'projects/generated/uptown_masterplan.jpg',                                // Uptown: Generated masterplan
        'projects/generated/aliva_masterplan.jpg',                                 // Aliva: Generated masterplan
        'projects/generated/seaview_masterplan.jpg',                               // Sea View: Beach lagoon masterplan
        'projects/generated/downtown_masterplan.png',                              // Downtown: Office park masterplan
        'projects/generated/goldengates_masterplan.jpg',                           // Golden Gates: Generated masterplan
    ];

    private array $buildingExteriors = [
        'projects/generated/block_a1_exterior.png',
    ];

    private array $unitInteriors = [
        'projects/generated/patio_gallery_1.png',
        'projects/generated/patio_gallery_2.png',
        'projects/generated/patio_gallery_3.png',
    ];

    private array $unitLayouts = [
        'projects/generated/apartment_finish_1.png',
        'projects/generated/apartment_finish_2.png',
        'projects/generated/apartment_finish_3.png',
    ];

    private array $viewTypes = ['garden', 'pool', 'street', 'sea', 'landmark'];
    private array $unitTypes = ['apartment', 'villa', 'duplex', 'penthouse', 'office', 'commercial'];
    private array $orientations = ['north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west'];
    private array $finishings = ['core_shell', 'semi_finished', 'fully_finished', 'super_lux', 'ultra_super_lux'];

    public function run(): void
    {
        $this->command->info('🏗️  Starting Massive Dummy Data Seeder...');

        // ══════════════════════════════════════════════════════════
        // Fetch references from DatabaseSeeder
        // ══════════════════════════════════════════════════════════
        $admin = User::where('email', 'admin@redp.com')->first();
        $salesAgent = User::where('email', 'sales_agent@redp.com')->first();
        $financeOfficer = User::where('email', 'finance_officer@redp.com')->first();
        $teleSalesUser = User::where('email', 'tele_sales@redp.com')->first();
        $teleSalesManager = User::where('email', 'tele_sales_manager@redp.com')->first();
        $brokerUser = User::where('email', 'broker@redp.com')->first();
        $companySalesAgent = User::where('email', 'company_sales_agent@redp.com')->first();
        $companySalesLeader = User::where('email', 'company_sales_leader@redp.com')->first();
        $holdingCompany = \App\Models\Company::where('name', 'REDP Holding')->first();

        $brokerRemax = Broker::where('email', 'broker@redp.com')->first();
        $brokerColdwell = Broker::where('email', 'coldwell@redp.com')->first();
        $freelanceBroker = Broker::where('email', 'freelance_broker@redp.com')->first();

        $existingCampaignFB = Campaign::where('utm_campaign', 'luxury_penthouses_2026')->first();
        $existingCampaignGG = Campaign::where('utm_campaign', 'admin_capital_commercial')->first();

        // ══════════════════════════════════════════════════════════
        // 1. UPDATE EXISTING PROJECTS WITH IMAGES
        // ══════════════════════════════════════════════════════════
        $this->command->info('📸  Adding images to existing projects...');

        $patio = Project::where('name', 'Patio Luxury Compound')->first();
        $uptown = Project::where('name', 'Uptown Residence')->first();

        if ($patio) {
            $patio->update([
                'image_url' => $this->compoundCovers[0],
                'master_plan_image_url' => $this->masterPlanImages[0],
                'land_area' => 120.00,
                'land_area_unit' => 'feddan',
                'building_ratio' => 22.00,
                'max_floors_allowed' => 8,
                'total_green_area' => 200000.00,
                'total_roads_area' => 45000.00,
                'total_parking_spaces' => 800,
                'master_plan_status' => 'approved',
                'project_type' => 'residential',
            ]);
        }
        if ($uptown) {
            $uptown->update([
                'image_url' => $this->compoundCovers[1],
                'master_plan_image_url' => $this->masterPlanImages[1],
                'land_area' => 85.00,
                'land_area_unit' => 'feddan',
                'building_ratio' => 18.00,
                'max_floors_allowed' => 6,
                'total_green_area' => 150000.00,
                'total_roads_area' => 30000.00,
                'total_parking_spaces' => 500,
                'master_plan_status' => 'approved',
                'project_type' => 'residential',
            ]);
        }

        // ══════════════════════════════════════════════════════════
        // 2. CREATE 4 NEW PROJECTS
        // ══════════════════════════════════════════════════════════
        $this->command->info('🏘️  Creating 4 new projects...');

        $newProjectsData = [
            ['Aliva Heights', 'Mostakbal City, Egypt', 200, 'active', '2028-03-15', 2, 'residential'],
            ['Sea View Resort', 'North Coast, Egypt', 150, 'construction', '2029-01-20', 3, 'resort'],
            ['Downtown Business Hub', 'New Administrative Capital, Egypt', 120, 'planning', '2029-06-30', 4, 'commercial'],
            ['Golden Gates', 'Sheikh Zayed, Egypt', 250, 'active', '2027-09-30', 5, 'residential'],
        ];

        $allProjects = [$patio, $uptown];
        foreach ($newProjectsData as $idx => $pd) {
            $proj = Project::create([
                'id' => (string) Str::uuid(),
                'name' => $pd[0],
                'location' => $pd[1],
                'total_units' => $pd[2],
                'status' => $pd[3],
                'delivery_date' => $pd[4],
                'image_url' => $this->compoundCovers[$pd[5]],
                'master_plan_image_url' => $this->masterPlanImages[$pd[5]],
                'land_area' => rand(50, 200),
                'land_area_unit' => 'feddan',
                'building_ratio' => rand(15, 30),
                'max_floors_allowed' => rand(6, 15),
                'total_green_area' => rand(50000, 300000),
                'total_roads_area' => rand(20000, 80000),
                'total_parking_spaces' => rand(200, 1200),
                'master_plan_status' => 'approved',
                'project_type' => $pd[6],
            ]);
            $allProjects[] = $proj;

            // Payment Plan Templates for new projects
            foreach ([
                ['Cash Payment', 'كاش', 100, 0, 10],
                ['5-Year Plan', 'خطة 5 سنوات', 20, 60, 0],
                ['7-Year Plan', 'خطة 7 سنوات', 15, 84, 0],
                ['10-Year Plan', 'خطة 10 سنوات', 10, 120, 0],
            ] as $plan) {
                \App\Models\ProjectPaymentPlan::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $proj->id,
                    'name' => $plan[0],
                    'name_ar' => $plan[1],
                    'down_payment_pct' => $plan[2],
                    'installments' => $plan[3],
                    'discount_pct' => $plan[4],
                ]);
            }
        }

        // ══════════════════════════════════════════════════════════
        // 3. CREATE 25+ BUILDINGS FOR ALL 6 PROJECTS
        // ══════════════════════════════════════════════════════════
        $this->command->info('🏢  Creating 25+ buildings...');

        // [name, type, total_floors, has_basement, basement_floors, has_roof_floor, has_elevator, elevator_count, footprint_area, parking_type, parking_cap, status]
        $buildingsConfig = [
            0 => [ // Patio
                ['Block A1', 'apartment_building', 7, true, 1, true, true, 2, 600, 'basement', 40, 'completed'],
                ['Block A2', 'apartment_building', 7, true, 1, true, true, 2, 580, 'basement', 38, 'completed'],
                ['Block B1', 'apartment_building', 5, false, 0, false, true, 1, 450, 'outdoor', 20, 'under_construction'],
                ['Block B2', 'apartment_building', 5, false, 0, false, true, 1, 450, 'outdoor', 20, 'under_construction'],
                ['Patio Townhouses', 'townhouse', 3, false, 0, false, false, 0, 250, 'ground', 10, 'completed'],
            ],
            1 => [ // Uptown
                ['Tower 1', 'apartment_building', 10, true, 2, true, true, 3, 800, 'basement', 60, 'planned'],
                ['Tower 2', 'apartment_building', 10, true, 2, true, true, 3, 800, 'basement', 60, 'planned'],
                ['Uptown Villas', 'villa', 2, false, 0, false, false, 0, 350, 'ground', 2, 'planned'],
                ['Garden Residences', 'mixed_use', 6, true, 1, true, true, 2, 700, 'basement', 45, 'planned'],
            ],
            2 => [ // Aliva Heights
                ['Aliva Tower A', 'apartment_building', 8, true, 1, true, true, 3, 750, 'basement', 50, 'completed'],
                ['Aliva Tower B', 'apartment_building', 8, true, 1, true, true, 3, 750, 'basement', 50, 'under_construction'],
                ['Aliva Tower C', 'apartment_building', 6, true, 1, false, true, 2, 550, 'basement', 35, 'under_construction'],
                ['Hillside Villas', 'villa', 2, false, 0, false, false, 0, 400, 'ground', 2, 'completed'],
            ],
            3 => [ // Sea View Resort
                ['Marina Tower', 'apartment_building', 12, true, 2, true, true, 4, 900, 'multi_level', 80, 'under_construction'],
                ['Beach Villas', 'villa', 2, false, 0, false, false, 0, 500, 'ground', 3, 'under_construction'],
                ['Lagoon Residence', 'apartment_building', 6, true, 1, true, true, 2, 600, 'basement', 40, 'planned'],
                ['Coral Block', 'duplex_building', 4, false, 0, false, true, 1, 480, 'outdoor', 25, 'planned'],
            ],
            4 => [ // Downtown Business Hub
                ['Office Tower A', 'commercial', 15, true, 3, true, true, 6, 1200, 'multi_level', 200, 'planned'],
                ['Office Tower B', 'commercial', 12, true, 2, true, true, 4, 1000, 'multi_level', 150, 'planned'],
                ['Commercial Center', 'mixed_use', 4, true, 1, false, true, 2, 2000, 'basement', 100, 'planned'],
                ['Retail Plaza', 'commercial', 3, false, 0, false, true, 1, 1500, 'outdoor', 80, 'planned'],
            ],
            5 => [ // Golden Gates
                ['Gate Tower 1', 'apartment_building', 9, true, 1, true, true, 3, 700, 'basement', 55, 'completed'],
                ['Gate Tower 2', 'apartment_building', 9, true, 1, true, true, 3, 700, 'basement', 55, 'completed'],
                ['Gate Tower 3', 'apartment_building', 7, true, 1, true, true, 2, 600, 'basement', 40, 'under_construction'],
                ['Premium Villa Zone', 'villa', 2, false, 0, false, false, 0, 450, 'ground', 3, 'completed'],
                ['Gate Residences', 'townhouse', 3, false, 0, false, false, 0, 300, 'ground', 12, 'completed'],
            ],
        ];

        $allBuildings = []; // projectIdx => [Building]
        $allFloors = [];    // buildingId => [BuildingFloor]

        foreach ($buildingsConfig as $projIdx => $buildings) {
            $project = $allProjects[$projIdx];
            $allBuildings[$projIdx] = [];

            foreach ($buildings as $sortOrder => $b) {
                $building = Building::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $project->id,
                    'name' => $b[0],
                    'name_ar' => $b[0],
                    'type' => $b[1],
                    'total_floors' => $b[2],
                    'has_basement' => $b[3],
                    'basement_floors' => $b[4],
                    'has_roof_floor' => $b[5],
                    'has_elevator' => $b[6],
                    'elevator_count' => $b[7],
                    'staircase_count' => max(1, intdiv($b[7], 2) + 1),
                    'building_footprint_area' => $b[8],
                    'total_built_area' => $b[8] * $b[2],
                    'lobby_area' => $b[8] * 0.15,
                    'common_area_per_floor' => $b[8] * 0.12,
                    'parking_type' => $b[9],
                    'parking_capacity' => $b[10],
                    'status' => $b[11],
                    'sort_order' => $sortOrder + 1,
                ]);

                $allBuildings[$projIdx][] = $building;
                $allFloors[$building->id] = [];

                // Auto-generate floors
                // Basements
                if ($building->has_basement) {
                    for ($bf = 1; $bf <= $building->basement_floors; $bf++) {
                        $floor = BuildingFloor::create([
                            'id' => (string) Str::uuid(),
                            'building_id' => $building->id,
                            'floor_number' => -$bf,
                            'floor_label' => "بدروم {$bf}",
                            'floor_type' => 'basement',
                            'gross_area' => $building->building_footprint_area,
                            'ceiling_height' => 3.00,
                        ]);
                        $allFloors[$building->id][] = $floor;
                    }
                }

                // Ground + Upper floors
                for ($f = 0; $f < $building->total_floors; $f++) {
                    $floorType = $f === 0 ? 'ground' : 'typical';
                    $floor = BuildingFloor::create([
                        'id' => (string) Str::uuid(),
                        'building_id' => $building->id,
                        'floor_number' => $f,
                        'floor_label' => $f === 0 ? 'الأرضي' : "الدور {$f}",
                        'floor_type' => $floorType,
                        'gross_area' => $building->building_footprint_area,
                        'common_area' => $building->common_area_per_floor,
                        'ceiling_height' => $f === 0 ? 3.20 : 2.80,
                    ]);
                    $allFloors[$building->id][] = $floor;
                }

                // Roof
                if ($building->has_roof_floor) {
                    $floor = BuildingFloor::create([
                        'id' => (string) Str::uuid(),
                        'building_id' => $building->id,
                        'floor_number' => $building->total_floors,
                        'floor_label' => 'السطح',
                        'floor_type' => 'roof',
                        'gross_area' => $building->building_footprint_area,
                        'ceiling_height' => 0,
                    ]);
                    $allFloors[$building->id][] = $floor;
                }
            }
        }

        $this->command->info('   ✅ Created ' . Building::count() . ' buildings with ' . BuildingFloor::count() . ' floors');

        // ══════════════════════════════════════════════════════════
        // 4. CREATE 300+ UNITS
        // ══════════════════════════════════════════════════════════
        $this->command->info('🏠  Creating 300+ units...');

        $createdUnits = [];
        $unitCounter = 0;

        foreach ($allBuildings as $projIdx => $buildings) {
            $project = $allProjects[$projIdx];

            foreach ($buildings as $building) {
                // Determine units per floor based on building type
                $unitsPerFloor = match($building->type) {
                    'apartment_building' => rand(3, 4),
                    'villa' => 1,
                    'duplex_building' => 2,
                    'townhouse' => rand(2, 3),
                    'commercial' => rand(2, 4),
                    'mixed_use' => rand(3, 4),
                    default => 3,
                };

                $unitType = match($building->type) {
                    'apartment_building' => 'apartment',
                    'villa' => 'villa',
                    'duplex_building' => 'duplex',
                    'townhouse' => 'apartment',
                    'commercial' => 'office',
                    'mixed_use' => 'apartment',
                    default => 'apartment',
                };

                $floors = collect($allFloors[$building->id] ?? [])
                    ->filter(fn($f) => $f->floor_type !== 'basement' && $f->floor_type !== 'roof');

                foreach ($floors as $floor) {
                    for ($u = 1; $u <= $unitsPerFloor; $u++) {
                        $floorNum = $floor->floor_number;
                        $unitNumber = sprintf('%s-%d%02d', substr($building->name, 0, 3), $floorNum, $u);
                        $area = match($unitType) {
                            'villa' => rand(280, 500),
                            'duplex' => rand(180, 280),
                            'penthouse' => rand(220, 380),
                            'office' => rand(60, 200),
                            'commercial' => rand(40, 150),
                            default => rand(80, 200),
                        };
                        $pricePerSqm = match($unitType) {
                            'villa' => rand(25000, 40000),
                            'duplex' => rand(22000, 35000),
                            'penthouse' => rand(30000, 50000),
                            'office' => rand(20000, 45000),
                            'commercial' => rand(30000, 60000),
                            default => rand(18000, 32000),
                        };

                        // Some units are penthouse on top floors
                        $actualType = $unitType;
                        if ($unitType === 'apartment' && $floorNum >= $building->total_floors - 1 && rand(1, 3) === 1) {
                            $actualType = 'penthouse';
                        }

                        // Vary status: 70% available, 15% reserved, 10% sold, 5% other
                        $statusRoll = rand(1, 100);
                        $status = 'available';
                        if ($statusRoll > 95) $status = 'coming_soon';
                        elseif ($statusRoll > 85) $status = 'sold';
                        elseif ($statusRoll > 70) $status = 'reserved';

                        $unit = Unit::create([
                            'id' => (string) Str::uuid(),
                            'project_id' => $project->id,
                            'building_id' => $building->id,
                            'floor_id' => $floor->id,
                            'unit_number' => $unitNumber,
                            'floor' => $floorNum,
                            'type' => ucfirst($actualType),
                            'area' => $area,
                            'net_area' => round($area * 0.88, 2),
                            'finishing_type' => $this->finishings[array_rand($this->finishings)],
                            'bedrooms' => match($actualType) {
                                'villa' => rand(4, 6), 'duplex' => rand(3, 4), 'penthouse' => rand(3, 5),
                                'office', 'commercial' => 0, default => rand(1, 3),
                            },
                            'bathrooms' => match($actualType) {
                                'villa' => rand(3, 5), 'duplex' => rand(2, 3), 'penthouse' => rand(2, 4),
                                'office', 'commercial' => 1, default => rand(1, 2),
                            },
                            'living_rooms' => in_array($actualType, ['office', 'commercial']) ? 0 : rand(1, 3),
                            'kitchen_count' => in_array($actualType, ['office', 'commercial']) ? 0 : 1,
                            'balcony_count' => rand(0, 2),
                            'view_type' => $this->viewTypes[array_rand($this->viewTypes)],
                            'orientation' => $this->orientations[array_rand($this->orientations)],
                            'building' => $building->name,
                            'layout_description' => $this->generateLayoutDesc($actualType, $area),
                            'layout_image_url' => $this->unitLayouts[array_rand($this->unitLayouts)],
                            'price' => $area * $pricePerSqm,
                            'min_down_payment' => round($area * $pricePerSqm * 0.1, 2),
                            'status' => $status,
                            'handover_date' => $project->delivery_date,
                            'phase' => 'Phase 1',
                        ]);
                        $createdUnits[] = $unit;
                        $unitCounter++;
                    }

                    // Update floor units_count
                    $floor->update(['units_count' => $unitsPerFloor]);
                }
            }
        }

        // Link existing seeder units to buildings if they match by name
        $this->linkExistingUnitsToBuildings();

        $this->command->info("   ✅ Created {$unitCounter} new units (total: " . Unit::count() . ')');

        // ══════════════════════════════════════════════════════════
        // 5. CREATE MORE CAMPAIGNS
        // ══════════════════════════════════════════════════════════
        $this->command->info('📢  Creating campaigns...');

        $campaignsData = [
            ['Aliva Heights Social Boost', 'facebook', 'facebook_reels', 'video', 'aliva_heights_reels_2026', 65000, 420, 350],
            ['Sea View TikTok Ads', 'tiktok', 'tiktok_ads', 'cpc', 'seaview_tiktok_2026', 35000, 280, 290],
            ['Golden Gates Google Video', 'google', 'google_video', 'cpv', 'golden_gates_gvid_2026', 85000, 610, 410],
            ['Downtown Referral Program', 'referral', 'referral_program', 'cpc', 'downtown_referral_2026', 120000, 180, 520],
            ['Eid Al-Adha Mega Sale', 'facebook', 'facebook_ads', 'cpc', 'eid_mega_sale_2026', 95000, 750, 380],
            ['Summer Compound Offer', 'google', 'google_display', 'cpm', 'summer_compound_2026', 55000, 340, 300],
        ];

        $allCampaigns = [$existingCampaignFB, $existingCampaignGG];
        foreach ($campaignsData as $cd) {
            $camp = Campaign::create([
                'name' => $cd[0], 'source' => $cd[1], 'utm_source' => $cd[2],
                'utm_medium' => $cd[3], 'utm_campaign' => $cd[4],
                'budget' => $cd[5], 'leads_count' => $cd[6], 'roi_percentage' => $cd[7],
            ]);
            $allCampaigns[] = $camp;
        }

        // ══════════════════════════════════════════════════════════
        // 6. CREATE 40+ CLIENT ACCOUNTS
        // ══════════════════════════════════════════════════════════
        $this->command->info('👥  Creating 40+ client accounts...');

        $clientNames = [
            ['Youssef', 'Mansour', 'youssef.mansour@gmail.com', '+201011111101'],
            ['Rania', 'Fawzy', 'rania.fawzy@gmail.com', '+201011111102'],
            ['Khaled', 'Aly', 'khaled.aly@gmail.com', '+201011111103'],
            ['Nada', 'Hossam', 'nada.hossam@gmail.com', '+201011111104'],
            ['Amr', 'Salah', 'amr.salah@gmail.com', '+201011111105'],
            ['Fatma', 'Galal', 'fatma.galal@gmail.com', '+201011111106'],
            ['Waleed', 'Ashraf', 'waleed.ashraf@gmail.com', '+201011111107'],
            ['Aya', 'Nour', 'aya.nour@gmail.com', '+201011111108'],
            ['Tamer', 'Hosny', 'tamer.hosny.re@gmail.com', '+201011111109'],
            ['Layla', 'Sayed', 'layla.sayed@gmail.com', '+201011111110'],
            ['Mohamed', 'Ragab', 'mohamed.ragab@gmail.com', '+201011111111'],
            ['Dina', 'Kamel', 'dina.kamel@gmail.com', '+201011111112'],
            ['Ahmed', 'Lotfy', 'ahmed.lotfy@gmail.com', '+201011111113'],
            ['Mariam', 'Wael', 'mariam.wael@gmail.com', '+201011111114'],
            ['Hassan', 'Ibrahim', 'hassan.ibrahim@gmail.com', '+201011111115'],
            ['Sahar', 'Mohsen', 'sahar.mohsen@gmail.com', '+201011111116'],
            ['Kareem', 'Nabil', 'kareem.nabil@gmail.com', '+201011111117'],
            ['Hana', 'Fathi', 'hana.fathi@gmail.com', '+201011111118'],
            ['Bassem', 'Younis', 'bassem.younis@gmail.com', '+201011111119'],
            ['Nesma', 'Adel', 'nesma.adel@gmail.com', '+201011111120'],
            ['Ayman', 'Hamdy', 'ayman.hamdy@gmail.com', '+201011111121'],
            ['Somaya', 'Tawfik', 'somaya.tawfik@gmail.com', '+201011111122'],
            ['Mahmoud', 'Gamal', 'mahmoud.gamal@gmail.com', '+201011111123'],
            ['Noura', 'Sherif', 'noura.sherif@gmail.com', '+201011111124'],
            ['Hazem', 'Barakat', 'hazem.barakat@gmail.com', '+201011111125'],
            ['Yasmin', 'Magdy', 'yasmin.magdy@gmail.com', '+201011111126'],
            ['Shady', 'Helal', 'shady.helal@gmail.com', '+201011111127'],
            ['Iman', 'Osman', 'iman.osman@gmail.com', '+201011111128'],
            ['Tarek', 'Rizk', 'tarek.rizk@gmail.com', '+201011111129'],
            ['Reem', 'Badr', 'reem.badr@gmail.com', '+201011111130'],
            ['Wael', 'Farouk', 'wael.farouk@gmail.com', '+201011111131'],
            ['Nermeen', 'Essam', 'nermeen.essam@gmail.com', '+201011111132'],
            ['Samy', 'Fouad', 'samy.fouad@gmail.com', '+201011111133'],
            ['Ghada', 'Salem', 'ghada.salem@gmail.com', '+201011111134'],
            ['Ehab', 'Zaki', 'ehab.zaki@gmail.com', '+201011111135'],
            ['Mai', 'Abdallah', 'mai.abdallah@gmail.com', '+201011111136'],
            ['Ossama', 'Hamid', 'ossama.hamid@gmail.com', '+201011111137'],
            ['Heba', 'Lotfy', 'heba.lotfy@gmail.com', '+201011111138'],
        ];

        $allClients = [];
        // Include existing 2 clients
        $existingClient1 = User::where('email', 'client@redp.com')->first();
        $existingClient2 = User::where('email', 'client2@redp.com')->first();
        if ($existingClient1) $allClients[] = $existingClient1;
        if ($existingClient2) $allClients[] = $existingClient2;

        foreach ($clientNames as $cn) {
            $client = User::create([
                'id' => (string) Str::uuid(),
                'name' => $cn[0] . ' ' . $cn[1],
                'email' => $cn[2],
                'password' => bcrypt('password'),
                'phone' => $cn[3],
                'role' => 'client',
                'status' => 'active',
            ]);
            $allClients[] = $client;
        }

        $this->command->info('   ✅ Created ' . count($clientNames) . ' new clients (total: ' . count($allClients) . ')');

        // ══════════════════════════════════════════════════════════
        // 7. CREATE 50+ LEADS
        // ══════════════════════════════════════════════════════════
        $this->command->info('📋  Creating 50+ additional leads...');

        $leadStatuses = ['new', 'contacted', 'interested', 'visit_scheduled', 'negotiation', 'reserved'];
        $leadSources = ['facebook', 'google', 'tiktok', 'direct', 'broker', 'referral'];
        $kycStatuses = ['none', 'pending', 'verified'];
        $salesAgents = [$salesAgent, $companySalesAgent, $companySalesLeader];

        for ($i = 0; $i < 50; $i++) {
            $status = $leadStatuses[array_rand($leadStatuses)];
            $source = $leadSources[array_rand($leadSources)];
            $kyc = $kycStatuses[array_rand($kycStatuses)];

            Lead::create([
                'first_name' => $clientNames[$i % count($clientNames)][0],
                'last_name' => 'Lead-' . ($i + 30),
                'email' => 'lead_extra_' . ($i + 30) . '@gmail.com',
                'phone' => '+20150' . str_pad((string)($i + 100), 7, '0', STR_PAD_LEFT),
                'national_id' => '29' . rand(0, 9) . '0' . rand(1, 9) . rand(10, 28) . rand(1000000, 9999999),
                'status' => $status,
                'lead_score' => rand(30, 99),
                'assigned_sales_agent_id' => $salesAgents[array_rand($salesAgents)]->id,
                'tele_sales_agent_id' => rand(0, 1) ? $teleSalesUser->id : $teleSalesManager->id,
                'kyc_status' => $kyc,
                'facial_match_score' => $kyc === 'verified' ? rand(85, 99) . '.' . rand(10, 99) : null,
                'source' => $source,
                'campaign_id' => in_array($source, ['facebook', 'google', 'instagram']) ? $allCampaigns[array_rand($allCampaigns)]->id : null,
                'broker_id' => $source === 'broker' ? $brokerRemax->id : null,
            ]);
        }

        $this->command->info('   ✅ Total leads: ' . Lead::count());

        // ══════════════════════════════════════════════════════════
        // 8. CREATE 50+ CONTRACTS WITH PAYMENTS (600+)
        // ══════════════════════════════════════════════════════════
        $this->command->info('📝  Creating 50+ contracts with 600+ payments...');

        // Fetch available units for contracts (only sold/reserved ones make sense)
        $soldReservedUnits = Unit::whereIn('status', ['sold', 'reserved'])->get();
        // Also pick some available units and mark them as sold
        $additionalUnits = Unit::where('status', 'available')
            ->inRandomOrder()
            ->limit(50)
            ->get();

        $contractableUnits = $soldReservedUnits->merge($additionalUnits)->take(52);

        // Mark them as sold
        foreach ($contractableUnits as $cu) {
            if ($cu->status === 'available') {
                $cu->update(['status' => 'sold']);
            }
        }

        $contractNumber = 5; // Start from 5 since existing seeder has 1-4
        $totalPaymentsCreated = 0;

        $gateways = ['cash', 'bank_transfer', 'stripe', 'fawry'];

        foreach ($contractableUnits as $idx => $unit) {
            $client = $allClients[$idx % count($allClients)];
            $contractNumber++;

            // Decide contract type
            $roll = rand(1, 100);
            if ($roll <= 25) {
                // ── CASH SALE (25%) ──
                $contract = Contract::create([
                    'id' => (string) Str::uuid(),
                    'contract_number' => sprintf('REDP-CTR-2026-%04d', $contractNumber),
                    'unit_id' => $unit->id,
                    'client_id' => $client->id,
                    'total_amount' => $unit->price,
                    'paid_amount' => $unit->price,
                    'type' => 'sale',
                    'status' => 'completed',
                    'signed_at' => now()->subMonths(rand(1, 8)),
                    'notes' => 'Cash sale — fully paid.',
                ]);

                $plan = PaymentPlan::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'total_installments' => 1,
                    'unpaid_installments' => 0,
                    'monthly_amount' => $unit->price,
                    'status' => 'completed',
                    'start_date' => $contract->signed_at,
                ]);

                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $plan->id,
                    'amount' => $unit->price,
                    'paid_amount' => $unit->price,
                    'status' => 'paid',
                    'due_date' => $contract->signed_at,
                    'paid_at' => $contract->signed_at,
                    'installment_number' => 0,
                    'gateway' => 'bank_transfer',
                    'transaction_reference' => 'TXN-' . Str::random(10),
                ]);
                $totalPaymentsCreated++;

            } elseif ($roll <= 65) {
                // ── 12-MONTH INSTALLMENT (40%) ──
                $totalInstallments = 12;
                $downPaymentPct = 0.20;
                $signedAt = now()->subMonths(rand(3, 10));
                $downPayment = round($unit->price * $downPaymentPct, 2);
                $remaining = $unit->price - $downPayment;
                $monthlyAmount = round($remaining / $totalInstallments, 2);

                // Determine how many are paid
                $monthsSinceSigned = max(1, (int) now()->diffInMonths($signedAt));
                $paidCount = min($totalInstallments, max(1, $monthsSinceSigned - rand(0, 2)));
                $unpaidCount = $totalInstallments - $paidCount;

                // Some have partial payments
                $hasPartialPayment = rand(1, 5) === 1;

                $totalPaid = $downPayment + ($monthlyAmount * ($hasPartialPayment ? $paidCount - 1 : $paidCount));
                if ($hasPartialPayment) $totalPaid += round($monthlyAmount * 0.4, 2);

                $contractStatus = $unpaidCount === 0 ? 'completed' : 'active';

                $contract = Contract::create([
                    'id' => (string) Str::uuid(),
                    'contract_number' => sprintf('REDP-CTR-2026-%04d', $contractNumber),
                    'unit_id' => $unit->id,
                    'client_id' => $client->id,
                    'total_amount' => $unit->price,
                    'paid_amount' => $totalPaid,
                    'type' => 'installment',
                    'status' => $contractStatus,
                    'signed_at' => $signedAt,
                    'notes' => '12-month installment plan with 20% down payment.',
                ]);

                $plan = PaymentPlan::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'total_installments' => $totalInstallments,
                    'unpaid_installments' => $unpaidCount,
                    'monthly_amount' => $monthlyAmount,
                    'status' => $contractStatus === 'completed' ? 'completed' : 'active',
                    'start_date' => $signedAt,
                    'penalty_rate' => 2.00,
                    'penalty_enabled' => true,
                    'grace_period_days' => 7,
                ]);

                // Down payment
                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $plan->id,
                    'amount' => $downPayment,
                    'paid_amount' => $downPayment,
                    'status' => 'paid',
                    'due_date' => $signedAt,
                    'paid_at' => $signedAt->copy()->addDays(rand(0, 3)),
                    'installment_number' => 0,
                    'gateway' => $gateways[array_rand($gateways)],
                    'transaction_reference' => 'TXN-' . Str::random(10),
                ]);
                $totalPaymentsCreated++;

                // Installments
                for ($inst = 1; $inst <= $totalInstallments; $inst++) {
                    $dueDate = $signedAt->copy()->addMonths($inst);
                    $isPaid = $inst <= $paidCount;
                    $isPartial = $hasPartialPayment && $inst === $paidCount;

                    if ($isPartial) {
                        Payment::create([
                            'id' => (string) Str::uuid(),
                            'contract_id' => $contract->id,
                            'payment_plan_id' => $plan->id,
                            'amount' => $monthlyAmount,
                            'paid_amount' => round($monthlyAmount * 0.4, 2),
                            'status' => 'pending',
                            'due_date' => $dueDate,
                            'paid_at' => null,
                            'installment_number' => $inst,
                            'gateway' => null,
                            'transaction_reference' => null,
                        ]);
                    } else {
                        Payment::create([
                            'id' => (string) Str::uuid(),
                            'contract_id' => $contract->id,
                            'payment_plan_id' => $plan->id,
                            'amount' => $monthlyAmount,
                            'paid_amount' => $isPaid ? $monthlyAmount : 0,
                            'status' => $isPaid ? 'paid' : 'pending',
                            'due_date' => $dueDate,
                            'paid_at' => $isPaid ? $dueDate->copy()->addDays(rand(0, 5)) : null,
                            'installment_number' => $inst,
                            'gateway' => $isPaid ? $gateways[array_rand($gateways)] : null,
                            'transaction_reference' => $isPaid ? 'TXN-' . Str::random(10) : null,
                        ]);
                    }
                    $totalPaymentsCreated++;
                }

                // Add overdue contracts to Collections Queue
                $overduePayments = Payment::where('contract_id', $contract->id)
                    ->where('status', 'pending')
                    ->where('due_date', '<', now())
                    ->get();

                if ($overduePayments->count() > 0) {
                    $totalOverdue = $overduePayments->sum('amount');
                    $oldestDue = $overduePayments->min('due_date');
                    $daysPast = max(1, (int) now()->diffInDays($oldestDue));
                    $bucket = $daysPast > 90 ? '90_days' : ($daysPast > 60 ? '60_days' : '30_days');

                    CollectionsQueue::create([
                        'id' => (string) Str::uuid(),
                        'contract_id' => $contract->id,
                        'client_id' => $client->id,
                        'aging_bucket' => $bucket,
                        'outstanding_amount' => $totalOverdue,
                        'promise_to_pay_date' => rand(0, 1) ? now()->addDays(rand(5, 20)) : null,
                        'status' => rand(0, 1) ? 'promised' : 'active',
                        'notes' => 'Auto-generated overdue entry. Customer contacted.',
                    ]);
                }

            } else {
                // ── 24-MONTH INSTALLMENT (35%) ──
                $totalInstallments = 24;
                $downPaymentPct = 0.15;
                $signedAt = now()->subMonths(rand(2, 14));
                $downPayment = round($unit->price * $downPaymentPct, 2);
                $remaining = $unit->price - $downPayment;
                $monthlyAmount = round($remaining / $totalInstallments, 2);

                $monthsSinceSigned = max(1, (int) now()->diffInMonths($signedAt));
                $paidCount = min($totalInstallments, max(1, $monthsSinceSigned - rand(0, 3)));
                $unpaidCount = $totalInstallments - $paidCount;

                $totalPaid = $downPayment + ($monthlyAmount * $paidCount);
                $contractStatus = $unpaidCount === 0 ? 'completed' : 'active';

                $contract = Contract::create([
                    'id' => (string) Str::uuid(),
                    'contract_number' => sprintf('REDP-CTR-2026-%04d', $contractNumber),
                    'unit_id' => $unit->id,
                    'client_id' => $client->id,
                    'total_amount' => $unit->price,
                    'paid_amount' => $totalPaid,
                    'type' => 'installment',
                    'status' => $contractStatus,
                    'signed_at' => $signedAt,
                    'notes' => '24-month installment plan with 15% down payment.',
                ]);

                $plan = PaymentPlan::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'total_installments' => $totalInstallments,
                    'unpaid_installments' => $unpaidCount,
                    'monthly_amount' => $monthlyAmount,
                    'status' => $contractStatus === 'completed' ? 'completed' : 'active',
                    'start_date' => $signedAt,
                    'penalty_rate' => 1.50,
                    'penalty_enabled' => true,
                    'grace_period_days' => 10,
                ]);

                // Down payment
                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $plan->id,
                    'amount' => $downPayment,
                    'paid_amount' => $downPayment,
                    'status' => 'paid',
                    'due_date' => $signedAt,
                    'paid_at' => $signedAt->copy()->addDays(rand(0, 2)),
                    'installment_number' => 0,
                    'gateway' => $gateways[array_rand($gateways)],
                    'transaction_reference' => 'TXN-' . Str::random(10),
                ]);
                $totalPaymentsCreated++;

                for ($inst = 1; $inst <= $totalInstallments; $inst++) {
                    $dueDate = $signedAt->copy()->addMonths($inst);
                    $isPaid = $inst <= $paidCount;

                    Payment::create([
                        'id' => (string) Str::uuid(),
                        'contract_id' => $contract->id,
                        'payment_plan_id' => $plan->id,
                        'amount' => $monthlyAmount,
                        'paid_amount' => $isPaid ? $monthlyAmount : 0,
                        'status' => $isPaid ? 'paid' : 'pending',
                        'due_date' => $dueDate,
                        'paid_at' => $isPaid ? $dueDate->copy()->addDays(rand(0, 5)) : null,
                        'installment_number' => $inst,
                        'gateway' => $isPaid ? $gateways[array_rand($gateways)] : null,
                        'transaction_reference' => $isPaid ? 'TXN-' . Str::random(10) : null,
                    ]);
                    $totalPaymentsCreated++;
                }

                // Overdue collection entries for 24-month plans
                $overduePayments = Payment::where('contract_id', $contract->id)
                    ->where('status', 'pending')
                    ->where('due_date', '<', now())
                    ->get();

                if ($overduePayments->count() > 0) {
                    $totalOverdue = $overduePayments->sum('amount');
                    $oldestDue = $overduePayments->min('due_date');
                    $daysPast = max(1, (int) now()->diffInDays($oldestDue));
                    $bucket = $daysPast > 90 ? '90_days' : ($daysPast > 60 ? '60_days' : '30_days');

                    CollectionsQueue::create([
                        'id' => (string) Str::uuid(),
                        'contract_id' => $contract->id,
                        'client_id' => $client->id,
                        'aging_bucket' => $bucket,
                        'outstanding_amount' => $totalOverdue,
                        'promise_to_pay_date' => rand(0, 1) ? now()->addDays(rand(5, 30)) : null,
                        'status' => ['active', 'promised', 'active'][rand(0, 2)],
                        'notes' => 'Overdue installments. Follow-up required.',
                    ]);
                }

                // Some get rescheduling requests
                if (rand(1, 4) === 1 && $contractStatus === 'active') {
                    ReschedulingRequest::create([
                        'id' => (string) Str::uuid(),
                        'contract_id' => $contract->id,
                        'reason' => ['Cash flow constraints.', 'Medical emergency.', 'Investment restructuring.', 'Job relocation.'][rand(0, 3)],
                        'current_installments' => $totalInstallments,
                        'proposed_installments_count' => $totalInstallments + rand(6, 24),
                        'proposed_monthly_amount' => round($monthlyAmount * 0.7, 2),
                        'status' => ['pending', 'approved', 'approved', 'rejected'][rand(0, 3)],
                    ]);
                }
            }
        }

        $this->command->info("   ✅ Created contracts: " . Contract::count() . ", payments: {$totalPaymentsCreated} (total: " . Payment::count() . ')');

        // ══════════════════════════════════════════════════════════
        // 9. COMMISSION CALCULATIONS
        // ══════════════════════════════════════════════════════════
        $this->command->info('💰  Creating commission calculations...');

        $rule = CommissionRule::first();
        $brokerRule = CommissionRule::where('tier_type', 'tier_2')->first();
        $csRule = CommissionRule::where('tier_type', 'tier_3')->first();

        if ($rule && $holdingCompany) {
            $paidContracts = Contract::where('status', 'completed')->orWhere('status', 'active')->limit(30)->get();
            foreach ($paidContracts as $pContract) {
                $payment = Payment::where('contract_id', $pContract->id)->where('status', 'paid')->first();
                if (!$payment) continue;

                // Commission for TeleSales
                if ($teleSalesUser) {
                    CommissionCalculation::create([
                        'id' => (string) Str::uuid(),
                        'company_id' => $holdingCompany->id,
                        'payment_id' => $payment->id,
                        'contract_id' => $pContract->id,
                        'rule_id' => $rule->id,
                        'user_id' => $teleSalesUser->id,
                        'deal_amount' => $pContract->total_amount,
                        'calculated_percentage' => 0.50,
                        'calculated_amount' => $pContract->total_amount * 0.005,
                        'status' => ['pending', 'approved', 'paid'][rand(0, 2)],
                    ]);
                }

                // Commission for Broker on some contracts
                if ($brokerRule && $brokerUser && rand(1, 3) === 1) {
                    CommissionCalculation::create([
                        'id' => (string) Str::uuid(),
                        'company_id' => $holdingCompany->id,
                        'payment_id' => $payment->id,
                        'contract_id' => $pContract->id,
                        'rule_id' => $brokerRule->id,
                        'user_id' => $brokerUser->id,
                        'deal_amount' => $pContract->total_amount,
                        'calculated_percentage' => 2.50,
                        'calculated_amount' => $pContract->total_amount * 0.025,
                        'status' => ['approved', 'paid'][rand(0, 1)],
                    ]);
                }

                // Commission for Company Sales on some contracts
                if ($csRule && $companySalesAgent && rand(1, 2) === 1) {
                    CommissionCalculation::create([
                        'id' => (string) Str::uuid(),
                        'company_id' => $holdingCompany->id,
                        'payment_id' => $payment->id,
                        'contract_id' => $pContract->id,
                        'rule_id' => $csRule->id,
                        'user_id' => $companySalesAgent->id,
                        'deal_amount' => $pContract->total_amount,
                        'calculated_percentage' => 1.50,
                        'calculated_amount' => $pContract->total_amount * 0.015,
                        'status' => ['pending', 'approved'][rand(0, 1)],
                    ]);
                }
            }
        }

        $this->command->info('   ✅ Commission calculations: ' . CommissionCalculation::count());

        // ══════════════════════════════════════════════════════════
        // 10. BUILDING HOTSPOTS (Interactive Map Pins)
        // ══════════════════════════════════════════════════════════
        $this->command->info('📍  Creating interactive map hotspots...');

        foreach ($allBuildings as $projIdx => $buildings) {
            $project = $allProjects[$projIdx];
            $pinPositions = $this->generatePinPositions(count($buildings));

            foreach ($buildings as $bIdx => $building) {
                $pos = $pinPositions[$bIdx];
                BuildingHotspot::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $project->id,
                    'building_id' => $building->id,
                    'x_percent' => $pos['x'],
                    'y_percent' => $pos['y'],
                    'label' => $building->name,
                    'pin_color' => '#003DA6',
                    'polygon_points' => $this->generatePolygonAround($pos['x'], $pos['y']),
                ]);
            }
        }

        $this->command->info('   ✅ Hotspots created: ' . BuildingHotspot::count());

        // ══════════════════════════════════════════════════════════
        // 11. PROJECT MEDIA (Building & Floor Plan images)
        // ══════════════════════════════════════════════════════════
        $this->command->info('🖼️  Creating project media records...');

        foreach ($allBuildings as $projIdx => $buildings) {
            $project = $allProjects[$projIdx];

            // Project cover media
            ProjectMedia::firstOrCreate(
                ['project_id' => $project->id, 'media_type' => 'project_image', 'reference_key' => 'cover'],
                ['id' => (string) Str::uuid(), 'image_path' => $project->image_url, 'caption' => $project->name . ' Cover']
            );

            // Project cover gallery media (3 images per project for slideshow)
            for ($g = 0; $g < 3; $g++) {
                $galImg = $this->unitInteriors[($projIdx * 3 + $g) % count($this->unitInteriors)];
                ProjectMedia::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $project->id,
                    'media_type' => 'cover_gallery',
                    'reference_key' => 'gallery_' . $g,
                    'image_path' => $galImg,
                    'caption' => $project->name . ' Gallery Image ' . ($g + 1),
                ]);
            }

            foreach ($buildings as $bIdx => $building) {
                // Building exterior image
                $bImg = $this->buildingExteriors[$bIdx % count($this->buildingExteriors)];
                ProjectMedia::firstOrCreate(
                    ['project_id' => $project->id, 'media_type' => 'building', 'reference_key' => $building->name],
                    ['id' => (string) Str::uuid(), 'image_path' => $bImg, 'caption' => $building->name]
                );

                // Floor plans for typical and ground floors
                $floors = $allFloors[$building->id] ?? [];
                foreach ($floors as $fIdx => $floor) {
                    if ($floor->floor_type === 'basement') continue;
                    $refKey = $building->name . '|' . $floor->floor_number;
                    $fImg = $this->unitInteriors[$fIdx % count($this->unitInteriors)];
                    ProjectMedia::firstOrCreate(
                        ['project_id' => $project->id, 'media_type' => 'floor_plan', 'reference_key' => $refKey],
                        ['id' => (string) Str::uuid(), 'image_path' => $fImg, 'caption' => "Floor Plan - " . $building->name . " Floor " . $floor->floor_number]
                    );
                }
            }
        }

        $this->command->info('   ✅ Project media: ' . ProjectMedia::count());

        // ══════════════════════════════════════════════════════════
        // 12. AMENITIES FOR ALL PROJECTS
        // ══════════════════════════════════════════════════════════
        $this->command->info('🌳  Creating project amenities...');

        $amenityTypes = [
            ['Swimming Pool', 'حمام سباحة', 'swimming_pool', 500],
            ['Fitness Center', 'نادي رياضي', 'gym', 300],
            ['Central Garden', 'حديقة مركزية', 'garden', 2000],
            ['Kids Playground', 'ملعب أطفال', 'playground', 400],
            ['Mosque', 'مسجد', 'mosque', 350],
            ['Commercial Strip', 'منطقة تجارية', 'commercial_area', 1500],
            ['Clubhouse', 'كلوب هاوس', 'clubhouse', 800],
            ['Walking Track', 'مسار مشي', 'walking_track', 3000],
            ['Sports Court', 'ملعب رياضي', 'sports_court', 600],
            ['Guard House', 'بوابة حراسة', 'guard_house', 50],
        ];

        foreach ($allProjects as $project) {
            $count = rand(5, 8);
            $selected = array_rand($amenityTypes, $count);
            foreach ((array) $selected as $si) {
                $a = $amenityTypes[$si];
                ProjectAmenity::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $project->id,
                    'name' => $a[0],
                    'name_ar' => $a[1],
                    'type' => $a[2],
                    'area' => $a[3] + rand(-100, 200),
                    'quantity' => $a[2] === 'guard_house' ? rand(2, 4) : 1,
                ]);
            }
        }

        $this->command->info('   ✅ Amenities: ' . ProjectAmenity::count());

        // ══════════════════════════════════════════════════════════
        // 13. ADDITIONAL VENDORS & MAINTENANCE TICKETS
        // ══════════════════════════════════════════════════════════
        $this->command->info('🔧  Creating vendors & maintenance tickets...');

        $vendorData = [
            ['Cairo HVAC Solutions', 'HVAC', 4.7, '+201055566677'],
            ['Nile Painting Co.', 'Painting', 4.3, '+201055566688'],
            ['Delta Glass & Aluminum', 'Glass & Facades', 4.6, '+201055566699'],
            ['Smart Home Egypt', 'Smart Systems', 4.9, '+201055566700'],
            ['Green Landscape Co.', 'Landscaping', 4.4, '+201055566711'],
        ];

        foreach ($vendorData as $v) {
            Vendor::create([
                'id' => (string) Str::uuid(),
                'name' => $v[0], 'service_type' => $v[1], 'rating' => $v[2], 'contact_number' => $v[3],
            ]);
        }

        // Maintenance tickets for sold/reserved units
        $ticketCategories = ['Plumbing', 'Electrical', 'HVAC', 'Painting', 'Structural'];
        $ticketPriorities = ['low', 'medium', 'high', 'critical'];
        $ticketStatuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];

        $soldUnits = Unit::whereIn('status', ['sold', 'reserved'])->limit(20)->get();
        foreach ($soldUnits as $su) {
            $ownerContract = Contract::where('unit_id', $su->id)->first();
            if (!$ownerContract) continue;

            MaintenanceTicket::create([
                'id' => (string) Str::uuid(),
                'client_id' => $ownerContract->client_id,
                'unit_id' => $su->id,
                'category' => $ticketCategories[array_rand($ticketCategories)],
                'title' => 'Maintenance issue in ' . $su->unit_number,
                'description' => 'Reported maintenance issue requiring attention.',
                'status' => $ticketStatuses[array_rand($ticketStatuses)],
                'priority' => $ticketPriorities[array_rand($ticketPriorities)],
            ]);
        }

        // Defects/Snags
        foreach ($soldUnits->take(10) as $su) {
            DefectsSnag::create([
                'id' => (string) Str::uuid(),
                'unit_id' => $su->id,
                'description' => 'QC snag found during inspection: ' . ['paint scratch', 'tile crack', 'outlet issue', 'door alignment', 'waterproofing check'][rand(0, 4)],
                'severity' => ['low', 'medium', 'high'][rand(0, 2)],
                'status' => ['pending', 'resolved', 'pending'][rand(0, 2)],
            ]);
        }

        $this->command->info('   ✅ Vendors: ' . Vendor::count() . ', Tickets: ' . MaintenanceTicket::count() . ', Snags: ' . DefectsSnag::count());

        // ══════════════════════════════════════════════════════════
        // 14. UPDATE PROJECT TOTALS
        // ══════════════════════════════════════════════════════════
        foreach ($allProjects as $project) {
            $project->update([
                'total_units' => Unit::where('project_id', $project->id)->count(),
                'total_buildings_count' => Building::where('project_id', $project->id)->count(),
            ]);
        }

        // ══════════════════════════════════════════════════════════
        // SUMMARY
        // ══════════════════════════════════════════════════════════
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('🎉  MASSIVE DUMMY DATA SEEDING COMPLETE!');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('   Projects:     ' . Project::count());
        $this->command->info('   Buildings:    ' . Building::count());
        $this->command->info('   Floors:       ' . BuildingFloor::count());
        $this->command->info('   Units:        ' . Unit::count());
        $this->command->info('   Clients:      ' . User::where('role', 'client')->count());
        $this->command->info('   Leads:        ' . Lead::count());
        $this->command->info('   Contracts:    ' . Contract::count());
        $this->command->info('   Payments:     ' . Payment::count());
        $this->command->info('   Collections:  ' . CollectionsQueue::count());
        $this->command->info('   Hotspots:     ' . BuildingHotspot::count());
        $this->command->info('   Commissions:  ' . CommissionCalculation::count());
        $this->command->info('═══════════════════════════════════════════');
    }

    // ══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ══════════════════════════════════════════════════════════

    private function linkExistingUnitsToBuildings(): void
    {
        // Find existing units that have a building name but no building_id
        $orphanUnits = Unit::whereNull('building_id')->whereNotNull('building')->get();

        foreach ($orphanUnits as $unit) {
            $building = Building::where('project_id', $unit->project_id)
                ->where('name', $unit->building)
                ->first();

            if ($building) {
                $floor = BuildingFloor::where('building_id', $building->id)
                    ->where('floor_number', $unit->floor ?? 0)
                    ->first();

                $unit->update([
                    'building_id' => $building->id,
                    'floor_id' => $floor?->id,
                    'phase' => 'Phase 1',
                    'layout_image_url' => $unit->layout_image_url ?: $this->unitLayouts[array_rand($this->unitLayouts)],
                ]);
            }
        }
    }

    private function generatePinPositions(int $count): array
    {
        $positions = [];
        $gridCols = (int) ceil(sqrt($count));
        $gridRows = (int) ceil($count / $gridCols);

        $idx = 0;
        for ($r = 0; $r < $gridRows && $idx < $count; $r++) {
            for ($c = 0; $c < $gridCols && $idx < $count; $c++) {
                $positions[] = [
                    'x' => round(15 + ($c * 70 / max(1, $gridCols - 1)) + rand(-3, 3), 2),
                    'y' => round(20 + ($r * 55 / max(1, $gridRows - 1)) + rand(-3, 3), 2),
                ];
                $idx++;
            }
        }
        return $positions;
    }

    private function generatePolygonAround(float $x, float $y): array
    {
        $w = rand(6, 10);
        $h = rand(5, 8);
        return [
            ['x' => round($x - $w/2, 2), 'y' => round($y - $h/2, 2)],
            ['x' => round($x + $w/2, 2), 'y' => round($y - $h/2, 2)],
            ['x' => round($x + $w/2, 2), 'y' => round($y + $h/2, 2)],
            ['x' => round($x - $w/2, 2), 'y' => round($y + $h/2, 2)],
        ];
    }

    private function generateLayoutDesc(string $type, float $area): string
    {
        return match($type) {
            'villa' => "فيلا مستقلة {$area}م²: الأرضي (ريسبشن واسع، مطبخ كبير، غرفة مربية بحمام، حمام ضيوف)، الأول (غرف نوم منهم جناح رئيسي، ليفينج)، روف بالكامل",
            'duplex' => "دوبلكس {$area}م²: الدور السفلي (ريسبشن، مطبخ، حمام ضيوف)، العلوي (غرف نوم، ماستر، حمامات)",
            'penthouse' => "بنتهاوس {$area}م²: ريسبشن 3 قطع، مطبخ، غرف نوم (منهم ماستر)، تراس واسع بإطلالة بانورامية",
            'office' => "مكتب {$area}م²: مساحة مفتوحة، غرف اجتماعات، كيتشينيت، حمامات",
            'commercial' => "وحدة تجارية {$area}م²: واجهة زجاجية، مساحة عرض، مخزن خلفي",
            default => "شقة {$area}م²: ريسبشن، مطبخ، غرف نوم، حمامات، تراس بإطلالة مميزة",
        };
    }
}
