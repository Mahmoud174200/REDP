<?php

use Illuminate\Support\Str;

// Boot Laravel to use Eloquent models easily
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $projectId = '623f1780-4ed7-4db4-a558-2e65e5238431';
    
    // 1. Fetch and Update the Project
    $project = \App\Models\Project::find($projectId);
    if (!$project) {
        die("Error: Project Creekview with ID $projectId not found.\n");
    }
    
    echo "Updating project details for Creekview to reflect 100+ buildings master plan...\n";
    $project->update([
        'total_units' => 380,
        'total_buildings_count' => 105,
        'land_area' => 180000.00, // Large compound for 100+ buildings
        'land_area_unit' => 'sqm',
        'building_ratio' => 22.00,
        'max_height_allowed' => 20.00,
        'max_floors_allowed' => 5,
        'total_built_area' => 58000.00,
        'total_green_area' => 82000.00,
        'total_roads_area' => 40000.00,
        'total_parking_spaces' => 650,
        'infrastructure_notes' => 'Concentric dual lagoon water routing, automated centralized surveillance, fiber-to-the-villa (FTTV) gigabit networks, integrated smart solar pathways, smart building HVAC routing, and automatic irrigation recycling systems.',
        'density_per_feddan' => 8.86,
        'master_plan_status' => 'approved',
        'delivery_date' => '2028-12-31',
        'project_type' => 'residential',
    ]);

    // 2. Clean up existing child elements of this project to avoid duplicates/stray records
    echo "Cleaning up existing child tables for Creekview...\n";
    
    // Delete existing units
    \App\Models\Unit::where('project_id', $projectId)->delete();
    
    // Delete existing building floors of this project's buildings
    $buildingIds = \App\Models\Building::where('project_id', $projectId)->pluck('id')->toArray();
    if (!empty($buildingIds)) {
        \App\Models\BuildingFloor::whereIn('building_id', $buildingIds)->delete();
    }
    
    // Delete existing buildings
    \App\Models\Building::where('project_id', $projectId)->delete();
    
    // Delete existing project media
    \App\Models\ProjectMedia::where('project_id', $projectId)->delete();
    
    // Delete existing project payment plans
    \App\Models\ProjectPaymentPlan::where('project_id', $projectId)->delete();
    
    // Delete existing amenities
    \App\Models\ProjectAmenity::where('project_id', $projectId)->delete();

    // 3. Prepare Media Directories and Files
    echo "Copying media assets...\n";
    $sourceBldg = __DIR__ . '/storage/app/public/projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/buildings/ZTpvnvndsc34WBRptkcbcCXKcymi5AqXWC4jwxPG.jpg';
    $sourceFloor = __DIR__ . '/storage/app/public/projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/floors/S3OatiwrfXvEIAwp55GmPFoD0bWQwLBbfMHLuNGR.jpg';
    
    $destBldgDir = __DIR__ . "/storage/app/public/projects/$projectId/buildings";
    $destFloorDir = __DIR__ . "/storage/app/public/projects/$projectId/floors";
    
    if (!is_dir($destBldgDir)) {
        mkdir($destBldgDir, 0777, true);
    }
    if (!is_dir($destFloorDir)) {
        mkdir($destFloorDir, 0777, true);
    }
    
    // Copy placeholder files if sources exist
    $hasBldgSrc = file_exists($sourceBldg);
    $hasFloorSrc = file_exists($sourceFloor);

    // 4. Create Buildings and Units in database
    // We will structure 105 buildings across 4 zones:
    // - Zone 1: West Townhouses (Linear parallel rows on left) - 40 buildings
    // - Zone 2: Creek Residences (Curved blocks along canal) - 30 buildings
    // - Zone 3: Lagoon Circle Zone (Concentric circular rings on right) - 30 buildings
    // - Zone 4: Clubhouse & Commercial Hub (Top-right blue-roofed pavilions) - 5 buildings

    $now = now();
    echo "Seeding 105 buildings and units. This will take a few seconds...\n";

    // ─── ZONE 1: West Townhouses (40 Buildings, standalone villa style) ───
    echo "Seeding West Townhouses (40 buildings)...\n";
    for ($i = 1; $i <= 40; $i++) {
        $buildingId = (string) Str::uuid();
        $bName = sprintf('West Townhouse W-%02d', $i);
        $bNameAr = sprintf('تاون هاوس غربي W-%02d', $i);
        
        $building = \App\Models\Building::create([
            'id' => $buildingId,
            'project_id' => $projectId,
            'name' => $bName,
            'name_ar' => $bNameAr,
            'type' => 'townhouse',
            'total_floors' => 2,
            'has_basement' => false,
            'basement_floors' => 0,
            'has_roof_floor' => true,
            'has_elevator' => false,
            'elevator_count' => 0,
            'staircase_count' => 1,
            'building_footprint_area' => 180.00,
            'total_built_area' => 360.00,
            'lobby_area' => 0.00,
            'common_area_per_floor' => 0.00,
            'parking_type' => 'ground',
            'parking_capacity' => 2,
            'status' => ($i % 3 === 0) ? 'completed' : 'under_construction',
            'sort_order' => 100 + $i,
            'notes' => 'Linear row townhouse located in the peaceful West Zone.',
        ]);

        // Copy building media
        $bldgImgPath = "projects/$projectId/buildings/w_townhouse_{$i}.jpg";
        if ($hasBldgSrc) {
            copy($sourceBldg, __DIR__ . "/storage/app/public/$bldgImgPath");
        }
        \App\Models\ProjectMedia::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'media_type' => 'building',
            'reference_key' => $bName,
            'image_path' => $bldgImgPath,
            'caption' => "External view of $bName",
        ]);

        // Seed Floors (Ground & First)
        for ($f = 0; $f <= 1; $f++) {
            $floorId = (string) Str::uuid();
            $floorType = $f === 0 ? 'ground' : 'typical';
            $floor = \App\Models\BuildingFloor::create([
                'id' => $floorId,
                'building_id' => $buildingId,
                'floor_number' => $f,
                'floor_label' => \App\Models\Building::generateFloorLabel($f),
                'floor_type' => $floorType,
                'gross_area' => 180.00,
                'ceiling_height' => 3.00,
            ]);

            // Copy floor media
            $floorImgPath = "projects/$projectId/floors/w_townhouse_{$i}_f{$f}.jpg";
            if ($hasFloorSrc) {
                copy($sourceFloor, __DIR__ . "/storage/app/public/$floorImgPath");
            }
            \App\Models\ProjectMedia::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'media_type' => 'floor_plan',
                'reference_key' => "{$bName}|{$f}",
                'image_path' => $floorImgPath,
                'caption' => "Floor plan of $bName - Floor $f",
            ]);

            // Create 1 Unit per floor (A Townhouse is split into 2 levels or units)
            $unitNumber = sprintf('W-%02d-%d', $i, $f + 1);
            $status = ($i % 5 === 0) ? 'reserved' : (($i % 7 === 0) ? 'sold' : 'available');
            
            \App\Models\Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'building_id' => $buildingId,
                'floor_id' => $floorId,
                'unit_number' => $unitNumber,
                'floor' => $f,
                'type' => 'villa',
                'area' => 180.00,
                'net_area' => 165.00,
                'finishing_type' => 'super_lux',
                'bedrooms' => 3,
                'bathrooms' => 3,
                'living_rooms' => 1,
                'kitchen_count' => 1,
                'balcony_count' => 1,
                'balcony_area' => 8.00,
                'has_maid_room' => true,
                'has_storage' => true,
                'has_private_garden' => ($f === 0),
                'has_private_parking' => true,
                'view_type' => 'garden',
                'orientation' => 'south',
                'building' => $bName,
                'price' => 7500000.00 + ($f * 500000),
                'status' => $status,
                'phase' => 'Phase 1',
            ]);
            $floor->update(['units_count' => 1]);
        }
    }

    // ─── ZONE 2: Creek Residences (30 Buildings, waterfront apartments) ───
    echo "Seeding Creek Residences (30 buildings)...\n";
    for ($i = 1; $i <= 30; $i++) {
        $buildingId = (string) Str::uuid();
        $bName = sprintf('Creek Residence C-%02d', $i);
        $bNameAr = sprintf('عمارة القنال C-%02d', $i);
        
        $building = \App\Models\Building::create([
            'id' => $buildingId,
            'project_id' => $projectId,
            'name' => $bName,
            'name_ar' => $bNameAr,
            'type' => 'apartment_building',
            'total_floors' => 5, // Ground + 4 typical
            'has_basement' => true,
            'basement_floors' => 1,
            'has_roof_floor' => true,
            'has_elevator' => true,
            'elevator_count' => 1,
            'staircase_count' => 2,
            'building_footprint_area' => 800.00,
            'total_built_area' => 4000.00,
            'lobby_area' => 60.00,
            'common_area_per_floor' => 120.00,
            'parking_type' => 'basement',
            'parking_capacity' => 20,
            'status' => 'under_construction',
            'sort_order' => 200 + $i,
            'notes' => 'Waterfront apartment block lining the central creek corridor.',
        ]);

        // Copy building media
        $bldgImgPath = "projects/$projectId/buildings/creek_bldg_{$i}.jpg";
        if ($hasBldgSrc) {
            copy($sourceBldg, __DIR__ . "/storage/app/public/$bldgImgPath");
        }
        \App\Models\ProjectMedia::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'media_type' => 'building',
            'reference_key' => $bName,
            'image_path' => $bldgImgPath,
            'caption' => "External view of $bName",
        ]);

        // Seed Floors (Ground + 4 Typical)
        for ($f = 0; $f <= 4; $f++) {
            $floorId = (string) Str::uuid();
            $floorType = $f === 0 ? 'ground' : (($f === 4) ? 'penthouse' : 'typical');
            $floor = \App\Models\BuildingFloor::create([
                'id' => $floorId,
                'building_id' => $buildingId,
                'floor_number' => $f,
                'floor_label' => \App\Models\Building::generateFloorLabel($f),
                'floor_type' => $floorType,
                'gross_area' => 800.00,
                'ceiling_height' => $f === 0 ? 3.20 : 2.80,
            ]);

            // Copy floor media (only seed for 1st floor to save time/space, or simple placeholder)
            $floorImgPath = "projects/$projectId/floors/creek_bldg_{$i}_f{$f}.jpg";
            if ($hasFloorSrc) {
                copy($sourceFloor, __DIR__ . "/storage/app/public/$floorImgPath");
            }
            \App\Models\ProjectMedia::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'media_type' => 'floor_plan',
                'reference_key' => "{$bName}|{$f}",
                'image_path' => $floorImgPath,
                'caption' => "Floor plan of $bName - Floor $f",
            ]);

            // Create 2 Units per floor
            for ($u = 1; $u <= 2; $u++) {
                $unitNumber = sprintf('C%02d-%d0%d', $i, $f, $u);
                $status = ($i % 6 === 0) ? 'sold' : (($i % 9 === 0) ? 'reserved' : 'available');
                $uType = ($floorType === 'penthouse') ? 'penthouse' : 'apartment';
                
                \App\Models\Unit::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $projectId,
                    'building_id' => $buildingId,
                    'floor_id' => $floorId,
                    'unit_number' => $unitNumber,
                    'floor' => $f,
                    'type' => $uType,
                    'area' => ($uType === 'penthouse') ? 220.00 : 130.00 + ($u * 15),
                    'net_area' => ($uType === 'penthouse') ? 200.00 : 115.00 + ($u * 15),
                    'finishing_type' => 'fully_finished',
                    'bedrooms' => ($uType === 'penthouse') ? 4 : 3,
                    'bathrooms' => 2,
                    'living_rooms' => 1,
                    'kitchen_count' => 1,
                    'balcony_count' => 2,
                    'balcony_area' => 10.00,
                    'has_maid_room' => ($uType === 'penthouse'),
                    'has_storage' => true,
                    'has_private_garden' => ($f === 0),
                    'has_private_parking' => true,
                    'view_type' => 'creek',
                    'orientation' => 'north_east',
                    'building' => $bName,
                    'price' => ($uType === 'penthouse') ? 8200000.00 : 3800000.00 + ($f * 200000) + ($u * 100000),
                    'status' => $status,
                    'phase' => 'Phase 1',
                ]);
            }
            $floor->update(['units_count' => 2]);
        }
    }

    // ─── ZONE 3: Lagoon Circle Zone (30 Buildings, duplex villas surrounding central lake) ───
    echo "Seeding Lagoon Circle Zone (30 buildings)...\n";
    for ($i = 1; $i <= 30; $i++) {
        $buildingId = (string) Str::uuid();
        $bName = sprintf('Lagoon Pavilion L-%02d', $i);
        $bNameAr = sprintf('جناح البحيرة L-%02d', $i);
        
        $building = \App\Models\Building::create([
            'id' => $buildingId,
            'project_id' => $projectId,
            'name' => $bName,
            'name_ar' => $bNameAr,
            'type' => 'duplex_building',
            'total_floors' => 2, // Ground + 1st
            'has_basement' => false,
            'basement_floors' => 0,
            'has_roof_floor' => true,
            'has_elevator' => false,
            'elevator_count' => 0,
            'staircase_count' => 1,
            'building_footprint_area' => 400.00,
            'total_built_area' => 800.00,
            'lobby_area' => 20.00,
            'common_area_per_floor' => 40.00,
            'parking_type' => 'outdoor',
            'parking_capacity' => 4,
            'status' => 'planned',
            'sort_order' => 300 + $i,
            'notes' => 'Concentric duplex pavilion overlooking the East Lagoon lake.',
        ]);

        // Copy building media
        $bldgImgPath = "projects/$projectId/buildings/lagoon_bldg_{$i}.jpg";
        if ($hasBldgSrc) {
            copy($sourceBldg, __DIR__ . "/storage/app/public/$bldgImgPath");
        }
        \App\Models\ProjectMedia::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'media_type' => 'building',
            'reference_key' => $bName,
            'image_path' => $bldgImgPath,
            'caption' => "External view of $bName",
        ]);

        // Seed Floors (Ground & First)
        for ($f = 0; $f <= 1; $f++) {
            $floorId = (string) Str::uuid();
            $floorType = $f === 0 ? 'ground' : 'typical';
            $floor = \App\Models\BuildingFloor::create([
                'id' => $floorId,
                'building_id' => $buildingId,
                'floor_number' => $f,
                'floor_label' => \App\Models\Building::generateFloorLabel($f),
                'floor_type' => $floorType,
                'gross_area' => 400.00,
                'ceiling_height' => 3.10,
            ]);

            // Copy floor media
            $floorImgPath = "projects/$projectId/floors/lagoon_bldg_{$i}_f{$f}.jpg";
            if ($hasFloorSrc) {
                copy($sourceFloor, __DIR__ . "/storage/app/public/$floorImgPath");
            }
            \App\Models\ProjectMedia::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'media_type' => 'floor_plan',
                'reference_key' => "{$bName}|{$f}",
                'image_path' => $floorImgPath,
                'caption' => "Floor plan of $bName - Floor $f",
            ]);

            // Create 1 Duplex unit per building (unit spreads across floors or simple 1 duplex per floor)
            // Let's create 1 duplex unit per floor (ground duplex T-01, upper duplex T-02)
            $unitNumber = sprintf('L-%02d-%d', $i, $f + 1);
            $status = ($i % 4 === 0) ? 'sold' : 'available';
            
            \App\Models\Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'building_id' => $buildingId,
                'floor_id' => $floorId,
                'unit_number' => $unitNumber,
                'floor' => $f,
                'type' => 'duplex',
                'area' => 200.00,
                'net_area' => 185.00,
                'finishing_type' => 'ultra_super_lux',
                'bedrooms' => 3,
                'bathrooms' => 3,
                'living_rooms' => 1,
                'kitchen_count' => 1,
                'balcony_count' => 2,
                'balcony_area' => 15.00,
                'has_maid_room' => true,
                'has_storage' => true,
                'has_private_garden' => ($f === 0),
                'has_private_parking' => true,
                'view_type' => 'lagoon',
                'orientation' => 'north_west',
                'building' => $bName,
                'price' => 6900000.00 + ($f * 600000),
                'status' => $status,
                'phase' => 'Phase 1',
            ]);
            $floor->update(['units_count' => 1]);
        }
    }

    // ─── ZONE 4: Clubhouse & Commercial Hub (5 Buildings, top-right retail & spa) ───
    echo "Seeding Clubhouse & Commercial Pavilions (5 buildings)...\n";
    for ($i = 1; $i <= 5; $i++) {
        $buildingId = (string) Str::uuid();
        $bName = sprintf('Commercial Pavilion P-%02d', $i);
        $bNameAr = sprintf('مجمع الخدمات P-%02d', $i);
        
        $building = \App\Models\Building::create([
            'id' => $buildingId,
            'project_id' => $projectId,
            'name' => $bName,
            'name_ar' => $bNameAr,
            'type' => 'commercial',
            'total_floors' => 2,
            'has_basement' => false,
            'basement_floors' => 0,
            'has_roof_floor' => false,
            'has_elevator' => true,
            'elevator_count' => 1,
            'staircase_count' => 2,
            'building_footprint_area' => 1000.00,
            'total_built_area' => 2000.00,
            'lobby_area' => 80.00,
            'common_area_per_floor' => 150.00,
            'parking_type' => 'outdoor',
            'parking_capacity' => 25,
            'status' => 'completed',
            'sort_order' => 400 + $i,
            'notes' => 'Commercial retail and wellness center situated in the top-right entry gates.',
        ]);

        // Copy building media
        $bldgImgPath = "projects/$projectId/buildings/commercial_pav_{$i}.jpg";
        if ($hasBldgSrc) {
            copy($sourceBldg, __DIR__ . "/storage/app/public/$bldgImgPath");
        }
        \App\Models\ProjectMedia::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'media_type' => 'building',
            'reference_key' => $bName,
            'image_path' => $bldgImgPath,
            'caption' => "External view of $bName",
        ]);

        // Seed Floors (Ground & First)
        for ($f = 0; $f <= 1; $f++) {
            $floorId = (string) Str::uuid();
            $floorType = $f === 0 ? 'ground' : 'typical';
            $floor = \App\Models\BuildingFloor::create([
                'id' => $floorId,
                'building_id' => $buildingId,
                'floor_number' => $f,
                'floor_label' => \App\Models\Building::generateFloorLabel($f),
                'floor_type' => $floorType,
                'gross_area' => 1000.00,
                'ceiling_height' => 3.40,
            ]);

            // Copy floor media
            $floorImgPath = "projects/$projectId/floors/commercial_pav_{$i}_f{$f}.jpg";
            if ($hasFloorSrc) {
                copy($sourceFloor, __DIR__ . "/storage/app/public/$floorImgPath");
            }
            \App\Models\ProjectMedia::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'media_type' => 'floor_plan',
                'reference_key' => "{$bName}|{$f}",
                'image_path' => $floorImgPath,
                'caption' => "Floor plan of $bName - Floor $f",
            ]);

            // Create 1 Commercial space per floor (Ground Shop, First Office)
            $unitNumber = sprintf('P-%02d-%d', $i, $f + 1);
            
            \App\Models\Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $projectId,
                'building_id' => $buildingId,
                'floor_id' => $floorId,
                'unit_number' => $unitNumber,
                'floor' => $f,
                'type' => 'commercial',
                'area' => 150.00,
                'net_area' => 140.00,
                'finishing_type' => 'core_shell',
                'bedrooms' => null,
                'bathrooms' => 1,
                'living_rooms' => null,
                'kitchen_count' => 1,
                'balcony_count' => 0,
                'balcony_area' => null,
                'has_maid_room' => false,
                'has_storage' => true,
                'has_private_garden' => false,
                'has_private_parking' => true,
                'view_type' => 'street',
                'orientation' => 'east',
                'building' => $bName,
                'price' => 6000000.00 + ($f * 1000000),
                'status' => 'available',
                'phase' => 'Phase 1',
            ]);
            $floor->update(['units_count' => 1]);
        }
    }

    // 5. Seed standard project payment plan templates for Creekview
    echo "Creating project payment plans...\n";
    $paymentPlans = [
        [
            'name' => 'Cash Payment Plan',
            'name_ar' => 'خطة الدفع الكاش',
            'down_payment_pct' => 100.00,
            'installments' => 0,
            'discount_pct' => 12.00,
            'description' => 'Full cash payment with an attractive 12% discount',
            'settings' => [
                'finalPaymentMethod' => 'cash',
                'cashGracePeriod' => 14,
            ]
        ],
        [
            'name' => '5-Year Installment Plan',
            'name_ar' => 'خطة تقسيط 5 سنوات',
            'down_payment_pct' => 15.00,
            'installments' => 60,
            'discount_pct' => 0.00,
            'description' => '15% down payment and equal installments over 5 years (60 monthly payments)',
            'settings' => [
                'finalPaymentMethod' => 'installment',
                'installmentType' => 'direct',
                'interestType' => 'reducing',
                'installmentTerm' => 5,
                'installmentInterest' => 0,
                'installmentStartMonth' => 1,
            ]
        ],
        [
            'name' => '8-Year Extended Plan',
            'name_ar' => 'خطة تقسيط ممتدة 8 سنوات',
            'down_payment_pct' => 10.00,
            'installments' => 96,
            'discount_pct' => 0.00,
            'description' => '10% down payment with equal installments over 8 years (96 monthly payments)',
            'settings' => [
                'finalPaymentMethod' => 'installment',
                'installmentType' => 'direct',
                'interestType' => 'reducing',
                'installmentTerm' => 8,
                'installmentInterest' => 0,
                'installmentStartMonth' => 1,
            ]
        ],
    ];
    
    foreach ($paymentPlans as $plan) {
        \App\Models\ProjectPaymentPlan::create(array_merge($plan, [
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
        ]));
    }

    // 6. Add Amenities matching the Master Plan features
    echo "Creating project amenities matching Master Plan landmarks...\n";
    $amenities = [
        [
            'name' => 'Central Concentric Lagoon Pool',
            'name_ar' => 'بحيرة لاغون المركزية',
            'type' => 'swimming_pool',
            'area' => 2200.00,
            'quantity' => 1,
            'description' => 'A large circular crystal-clear central lagoon and sun deck in the middle of the circular Lagoon Zone.',
        ],
        [
            'name' => 'Creek Walk Promenade & Parks',
            'name_ar' => 'ممشى القنال والحدائق المائية',
            'type' => 'walking_track',
            'area' => 4500.00,
            'quantity' => 1,
            'description' => 'Waterfront boardwalk featuring pedestrian pathways, seating decks, and green parks lining the central creek.',
        ],
        [
            'name' => 'Clubhouse & Dining Pavilion',
            'name_ar' => 'الكلوب هاوس ومجمع المطاعم',
            'type' => 'clubhouse',
            'area' => 1800.00,
            'quantity' => 1,
            'description' => 'The premium blue-roofed clubhouse pavilion in the top-right entry zone containing fitness, spa, and community spaces.',
        ],
        [
            'name' => 'West Kids Play Garden',
            'name_ar' => 'حديقة ألعاب الأطفال الغربية',
            'type' => 'kids_area',
            'area' => 950.00,
            'quantity' => 1,
            'description' => 'Lush green play park located within the quiet West Townhouses strip.',
        ],
    ];
    
    foreach ($amenities as $am) {
        \App\Models\ProjectAmenity::create(array_merge($am, [
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
        ]));
    }

    // 7. Recalculate totals
    echo "Recalculating project totals...\n";
    $buildings = $project->buildings;
    $project->update([
        'total_buildings_count' => $buildings->count(),
        'total_built_area' => $buildings->sum('total_built_area'),
        'total_units' => $project->units()->whereNotNull('building_id')->count(),
    ]);

    echo "Creekview project dummy data seeded successfully with 105 buildings!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
