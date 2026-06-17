<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Building;
use App\Models\BuildingFloor;
use App\Models\ProjectAmenity;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MasterPlanController extends Controller
{
    // ══════════════════════════════════════════════════════════
    // 📐 MASTER PLAN OVERVIEW
    // ══════════════════════════════════════════════════════════

    /**
     * Get the full master plan for a project.
     */
    public function getMasterPlan($projectId)
    {
        $project = Project::with([
            'buildings.floors.units',
            'buildings.units',
            'amenities',
        ])->findOrFail($projectId);

        return response()->json([
            'success' => true,
            'data' => [
                'project' => $project,
                'summary' => $project->master_plan_summary,
            ]
        ]);
    }

    /**
     * Update land and project-level master plan data.
     */
    public function updateLandInfo(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'land_area' => 'nullable|numeric|min:0',
            'land_area_unit' => ['nullable', Rule::in(['sqm', 'feddan', 'acre'])],
            'building_ratio' => 'nullable|numeric|min:0|max:100',
            'max_height_allowed' => 'nullable|numeric|min:0',
            'max_floors_allowed' => 'nullable|integer|min:0',
            'total_green_area' => 'nullable|numeric|min:0',
            'total_roads_area' => 'nullable|numeric|min:0',
            'total_parking_spaces' => 'nullable|integer|min:0',
            'infrastructure_notes' => 'nullable|string',
            'master_plan_status' => ['nullable', Rule::in(['draft', 'review', 'approved'])],
            'project_type' => ['nullable', Rule::in(['residential', 'commercial', 'mixed_use', 'resort'])],
        ]);

        $project->update($validated);

        // Recalculate derived fields
        $this->recalculateProjectTotals($project);

        return response()->json([
            'success' => true,
            'message' => 'Land info updated successfully.',
            'data' => $project->fresh()->load('buildings', 'amenities')
        ]);
    }

    /**
     * Get master plan summary statistics.
     */
    public function getSummary($projectId)
    {
        $project = Project::with(['buildings.floors', 'buildings.units', 'amenities'])
            ->findOrFail($projectId);

        $summary = $project->master_plan_summary;

        // Add additional calculations
        $buildings = $project->buildings;

        // Unit type breakdown
        $unitsByType = $project->units->groupBy('type')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_area' => $group->sum('area'),
                'avg_price' => round($group->avg('price'), 2),
            ];
        });

        // Floor distribution
        $unitsByFloor = $project->units->groupBy('floor')->map->count()->sortKeys();

        // Building summary
        $buildingSummary = $buildings->map(function ($building) {
            return [
                'id' => $building->id,
                'name' => $building->name,
                'type' => $building->type,
                'total_floors' => $building->total_floors,
                'units_count' => $building->units->count(),
                'total_built_area' => $building->total_built_area,
                'parking_capacity' => $building->parking_capacity,
                'status' => $building->status,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'units_by_type' => $unitsByType,
                'units_by_floor' => $unitsByFloor,
                'buildings_summary' => $buildingSummary,
                'amenities' => $project->amenities,
                'land_info' => [
                    'land_area' => $project->land_area,
                    'land_area_unit' => $project->land_area_unit,
                    'building_ratio' => $project->building_ratio,
                    'max_height_allowed' => $project->max_height_allowed,
                    'max_floors_allowed' => $project->max_floors_allowed,
                    'total_green_area' => $project->total_green_area,
                    'total_roads_area' => $project->total_roads_area,
                    'total_parking_spaces' => $project->total_parking_spaces,
                    'master_plan_status' => $project->master_plan_status,
                    'project_type' => $project->project_type,
                ],
            ]
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🏗️ BUILDINGS CRUD
    // ══════════════════════════════════════════════════════════

    public function getBuildings($projectId)
    {
        $buildings = Building::where('project_id', $projectId)
            ->with(['floors.units', 'units'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $buildings
        ]);
    }

    public function createBuilding(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'type' => ['required', Rule::in([
                'apartment_building', 'villa', 'duplex_building',
                'townhouse', 'commercial', 'mixed_use'
            ])],
            'total_floors' => 'required|integer|min:1|max:100',
            'has_basement' => 'boolean',
            'basement_floors' => 'integer|min:0|max:10',
            'has_roof_floor' => 'boolean',
            'has_elevator' => 'boolean',
            'elevator_count' => 'integer|min:0',
            'staircase_count' => 'integer|min:1',
            'building_footprint_area' => 'nullable|numeric|min:0',
            'total_built_area' => 'nullable|numeric|min:0',
            'lobby_area' => 'nullable|numeric|min:0',
            'common_area_per_floor' => 'nullable|numeric|min:0',
            'parking_type' => ['nullable', Rule::in(['none', 'basement', 'ground', 'multi_level', 'outdoor'])],
            'parking_capacity' => 'integer|min:0',
            'status' => ['nullable', Rule::in(['planned', 'under_construction', 'completed'])],
            'notes' => 'nullable|string',
            'auto_generate_floors' => 'boolean', // If true, auto-create floor records
        ]);

        $maxSort = Building::where('project_id', $projectId)->max('sort_order') ?? 0;

        $building = Building::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'type' => $validated['type'],
            'total_floors' => $validated['total_floors'],
            'has_basement' => $validated['has_basement'] ?? false,
            'basement_floors' => $validated['basement_floors'] ?? 0,
            'has_roof_floor' => $validated['has_roof_floor'] ?? false,
            'has_elevator' => $validated['has_elevator'] ?? false,
            'elevator_count' => $validated['elevator_count'] ?? 0,
            'staircase_count' => $validated['staircase_count'] ?? 1,
            'building_footprint_area' => $validated['building_footprint_area'] ?? null,
            'total_built_area' => $validated['total_built_area'] ?? null,
            'lobby_area' => $validated['lobby_area'] ?? null,
            'common_area_per_floor' => $validated['common_area_per_floor'] ?? null,
            'parking_type' => $validated['parking_type'] ?? 'none',
            'parking_capacity' => $validated['parking_capacity'] ?? 0,
            'status' => $validated['status'] ?? 'planned',
            'sort_order' => $maxSort + 1,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Auto-generate floor records if requested
        if ($request->input('auto_generate_floors', true)) {
            $this->generateFloorsForBuilding($building);
        }

        // Recalculate project totals
        $this->recalculateProjectTotals($project);

        return response()->json([
            'success' => true,
            'message' => 'Building created successfully.',
            'data' => $building->load('floors.units')
        ], 201);
    }

    public function updateBuilding(Request $request, $projectId, $buildingId)
    {
        $building = Building::where('project_id', $projectId)->findOrFail($buildingId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'type' => ['required', Rule::in([
                'apartment_building', 'villa', 'duplex_building',
                'townhouse', 'commercial', 'mixed_use'
            ])],
            'total_floors' => 'required|integer|min:1|max:100',
            'has_basement' => 'boolean',
            'basement_floors' => 'integer|min:0|max:10',
            'has_roof_floor' => 'boolean',
            'has_elevator' => 'boolean',
            'elevator_count' => 'integer|min:0',
            'staircase_count' => 'integer|min:1',
            'building_footprint_area' => 'nullable|numeric|min:0',
            'total_built_area' => 'nullable|numeric|min:0',
            'lobby_area' => 'nullable|numeric|min:0',
            'common_area_per_floor' => 'nullable|numeric|min:0',
            'parking_type' => ['nullable', Rule::in(['none', 'basement', 'ground', 'multi_level', 'outdoor'])],
            'parking_capacity' => 'integer|min:0',
            'status' => ['nullable', Rule::in(['planned', 'under_construction', 'completed'])],
            'sort_order' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $building->update($validated);

        $this->recalculateProjectTotals($building->project);

        return response()->json([
            'success' => true,
            'message' => 'Building updated successfully.',
            'data' => $building->load('floors.units', 'units')
        ]);
    }

    public function deleteBuilding($projectId, $buildingId)
    {
        $building = Building::where('project_id', $projectId)->findOrFail($buildingId);
        $project = $building->project;

        // Detach units from this building (don't delete them)
        Unit::where('building_id', $buildingId)->update([
            'building_id' => null,
            'floor_id' => null,
        ]);

        $building->delete();

        $this->recalculateProjectTotals($project);

        return response()->json([
            'success' => true,
            'message' => 'Building deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🏢 BUILDING FLOORS CRUD
    // ══════════════════════════════════════════════════════════

    public function getFloors($buildingId)
    {
        $floors = BuildingFloor::where('building_id', $buildingId)
            ->with('units')
            ->orderBy('floor_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $floors
        ]);
    }

    public function createFloor(Request $request, $buildingId)
    {
        $building = Building::findOrFail($buildingId);

        $validated = $request->validate([
            'floor_number' => 'required|integer',
            'floor_label' => 'nullable|string|max:255',
            'floor_type' => ['nullable', Rule::in(['basement', 'ground', 'mezzanine', 'typical', 'roof', 'penthouse'])],
            'gross_area' => 'nullable|numeric|min:0',
            'common_area' => 'nullable|numeric|min:0',
            'net_usable_area' => 'nullable|numeric|min:0',
            'units_count' => 'integer|min:0',
            'ceiling_height' => 'nullable|numeric|min:2|max:10',
            'notes' => 'nullable|string',
        ]);

        // Check uniqueness
        $exists = BuildingFloor::where('building_id', $buildingId)
            ->where('floor_number', $validated['floor_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "Floor {$validated['floor_number']} already exists in this building."
            ], 422);
        }

        $floor = BuildingFloor::create([
            'id' => (string) Str::uuid(),
            'building_id' => $buildingId,
            'floor_number' => $validated['floor_number'],
            'floor_label' => $validated['floor_label'] ?? Building::generateFloorLabel($validated['floor_number']),
            'floor_type' => $validated['floor_type'] ?? BuildingFloor::detectFloorType(
                $validated['floor_number'], $building->total_floors, $building->has_roof_floor
            ),
            'gross_area' => $validated['gross_area'] ?? $building->building_footprint_area,
            'common_area' => $validated['common_area'] ?? $building->common_area_per_floor,
            'net_usable_area' => $validated['net_usable_area'] ?? null,
            'units_count' => $validated['units_count'] ?? 0,
            'ceiling_height' => $validated['ceiling_height'] ?? 2.80,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Floor created successfully.',
            'data' => $floor
        ], 201);
    }

    public function updateFloor(Request $request, $buildingId, $floorId)
    {
        $floor = BuildingFloor::where('building_id', $buildingId)->findOrFail($floorId);

        $validated = $request->validate([
            'floor_label' => 'nullable|string|max:255',
            'floor_type' => ['nullable', Rule::in(['basement', 'ground', 'mezzanine', 'typical', 'roof', 'penthouse'])],
            'gross_area' => 'nullable|numeric|min:0',
            'common_area' => 'nullable|numeric|min:0',
            'net_usable_area' => 'nullable|numeric|min:0',
            'units_count' => 'integer|min:0',
            'ceiling_height' => 'nullable|numeric|min:2|max:10',
            'notes' => 'nullable|string',
        ]);

        $floor->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Floor updated successfully.',
            'data' => $floor
        ]);
    }

    public function deleteFloor($buildingId, $floorId)
    {
        $floor = BuildingFloor::where('building_id', $buildingId)->findOrFail($floorId);

        // Detach units from this floor
        Unit::where('floor_id', $floorId)->update(['floor_id' => null]);

        $floor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Floor deleted successfully.'
        ]);
    }

    /**
     * Auto-generate units for a specific floor.
     */
    public function generateUnitsForFloor(Request $request, $buildingId, $floorId)
    {
        $building = Building::findOrFail($buildingId);
        $floor = BuildingFloor::where('building_id', $buildingId)->findOrFail($floorId);

        $validated = $request->validate([
            'units_count' => 'required|integer|min:1|max:50',
            'unit_type' => ['required', Rule::in(['apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'])],
            'area' => 'required|numeric|min:10',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'living_rooms' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0',
            'finishing_type' => ['nullable', Rule::in(['core_shell', 'semi_finished', 'fully_finished', 'super_lux', 'ultra_super_lux'])],
            'view_type' => 'nullable|string|max:100',
            'unit_number_prefix' => 'nullable|string|max:20', // e.g. "A" for units A-101, A-102...
        ]);

        $prefix = $validated['unit_number_prefix'] ?? '';
        $floorNum = $floor->floor_number;
        $createdUnits = [];

        for ($i = 1; $i <= $validated['units_count']; $i++) {
            $unitNumber = $prefix ? "{$prefix}-{$floorNum}{$i}" : "{$floorNum}" . str_pad($i, 2, '0', STR_PAD_LEFT);

            $unit = Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $building->project_id,
                'building_id' => $building->id,
                'floor_id' => $floor->id,
                'unit_number' => $unitNumber,
                'floor' => $floorNum,
                'type' => $validated['unit_type'],
                'area' => $validated['area'],
                'bedrooms' => $validated['bedrooms'] ?? null,
                'bathrooms' => $validated['bathrooms'] ?? null,
                'living_rooms' => $validated['living_rooms'] ?? null,
                'price' => $validated['price'],
                'finishing_type' => $validated['finishing_type'] ?? null,
                'view_type' => $validated['view_type'] ?? null,
                'building' => $building->name,
                'status' => 'available',
                'phase' => 'Phase 1',
            ]);

            $createdUnits[] = $unit;
        }

        // Update floor units_count
        $floor->update(['units_count' => $floor->units()->count()]);

        // Update project total_units
        $project = Project::find($building->project_id);
        if ($project) {
            $project->update(['total_units' => $project->units()->count()]);
        }

        return response()->json([
            'success' => true,
            'message' => count($createdUnits) . ' units generated successfully.',
            'data' => $createdUnits
        ], 201);
    }

    /**
     * Create a single unit manually for a specific floor.
     */
    public function createSingleUnit(Request $request, $buildingId, $floorId)
    {
        $building = Building::findOrFail($buildingId);
        $floor = BuildingFloor::where('building_id', $buildingId)->findOrFail($floorId);

        $validated = $request->validate([
            'unit_number' => 'required|string|max:50',
            'type' => ['required', Rule::in(['apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'])],
            'price' => 'required|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'reserved', 'sold', 'blocked', 'coming_soon', 'frozen', 'hidden'])],
            'area' => 'required|numeric|min:0',
            'net_area' => 'nullable|numeric|min:0',
            'finishing_type' => ['nullable', Rule::in(['core_shell', 'semi_finished', 'fully_finished', 'super_lux', 'ultra_super_lux'])],
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'living_rooms' => 'nullable|integer|min:0',
            'kitchen_count' => 'nullable|integer|min:0',
            'balcony_count' => 'nullable|integer|min:0',
            'balcony_area' => 'nullable|numeric|min:0',
            'has_maid_room' => 'boolean',
            'has_storage' => 'boolean',
            'has_private_garden' => 'boolean',
            'has_private_parking' => 'boolean',
            'view_type' => 'nullable|string|max:100',
            'orientation' => 'nullable|string|max:100',
            'layout_description' => 'nullable|string',
            'phase' => 'nullable|string|max:100',
        ]);

        // Check if unit number already exists in this building
        $exists = Unit::where('building_id', $buildingId)
            ->where('unit_number', $validated['unit_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "Unit number {$validated['unit_number']} already exists in this building."
            ], 422);
        }

        $unit = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $building->project_id,
            'building_id' => $building->id,
            'floor_id' => $floor->id,
            'unit_number' => $validated['unit_number'],
            'floor' => $floor->floor_number,
            'type' => $validated['type'],
            'area' => $validated['area'],
            'net_area' => $validated['net_area'] ?? null,
            'finishing_type' => $validated['finishing_type'] ?? null,
            'bedrooms' => $validated['bedrooms'] ?? null,
            'bathrooms' => $validated['bathrooms'] ?? null,
            'living_rooms' => $validated['living_rooms'] ?? null,
            'kitchen_count' => $validated['kitchen_count'] ?? 1,
            'balcony_count' => $validated['balcony_count'] ?? 0,
            'balcony_area' => $validated['balcony_area'] ?? null,
            'has_maid_room' => $validated['has_maid_room'] ?? false,
            'has_storage' => $validated['has_storage'] ?? false,
            'has_private_garden' => $validated['has_private_garden'] ?? false,
            'has_private_parking' => $validated['has_private_parking'] ?? false,
            'view_type' => $validated['view_type'] ?? null,
            'orientation' => $validated['orientation'] ?? null,
            'price' => $validated['price'],
            'status' => $validated['status'],
            'building' => $building->name,
            'layout_description' => $validated['layout_description'] ?? null,
            'phase' => $validated['phase'] ?? 'Phase 1',
        ]);

        // Update floor units_count
        $floor->update(['units_count' => $floor->units()->count()]);

        // Update project total_units
        $project = Project::find($building->project_id);
        if ($project) {
            $this->recalculateProjectTotals($project);
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully.',
            'data' => $unit
        ], 201);
    }

    /**
     * Update a single unit's detailed parameters.
     */
    public function updateSingleUnit(Request $request, $unitId)
    {
        $unit = Unit::findOrFail($unitId);

        $validated = $request->validate([
            'unit_number' => 'required|string|max:50',
            'type' => ['required', Rule::in(['apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'])],
            'price' => 'required|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'reserved', 'sold', 'blocked', 'coming_soon', 'frozen', 'hidden'])],
            'area' => 'required|numeric|min:0',
            'net_area' => 'nullable|numeric|min:0',
            'finishing_type' => ['nullable', Rule::in(['core_shell', 'semi_finished', 'fully_finished', 'super_lux', 'ultra_super_lux'])],
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'living_rooms' => 'nullable|integer|min:0',
            'kitchen_count' => 'nullable|integer|min:0',
            'balcony_count' => 'nullable|integer|min:0',
            'balcony_area' => 'nullable|numeric|min:0',
            'has_maid_room' => 'boolean',
            'has_storage' => 'boolean',
            'has_private_garden' => 'boolean',
            'has_private_parking' => 'boolean',
            'view_type' => 'nullable|string|max:100',
            'orientation' => 'nullable|string|max:100',
            'layout_description' => 'nullable|string',
            'phase' => 'nullable|string|max:100',
        ]);

        // Check uniqueness (if name changed)
        if ($validated['unit_number'] !== $unit->unit_number) {
            $exists = Unit::where('building_id', $unit->building_id)
                ->where('unit_number', $validated['unit_number'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => "Unit number {$validated['unit_number']} already exists in this building."
                ], 422);
            }
        }

        $unit->update([
            'unit_number' => $validated['unit_number'],
            'type' => $validated['type'],
            'area' => $validated['area'],
            'net_area' => $validated['net_area'] ?? null,
            'finishing_type' => $validated['finishing_type'] ?? null,
            'bedrooms' => $validated['bedrooms'] ?? null,
            'bathrooms' => $validated['bathrooms'] ?? null,
            'living_rooms' => $validated['living_rooms'] ?? null,
            'kitchen_count' => $validated['kitchen_count'] ?? 1,
            'balcony_count' => $validated['balcony_count'] ?? 0,
            'balcony_area' => $validated['balcony_area'] ?? null,
            'has_maid_room' => $validated['has_maid_room'] ?? false,
            'has_storage' => $validated['has_storage'] ?? false,
            'has_private_garden' => $validated['has_private_garden'] ?? false,
            'has_private_parking' => $validated['has_private_parking'] ?? false,
            'view_type' => $validated['view_type'] ?? null,
            'orientation' => $validated['orientation'] ?? null,
            'price' => $validated['price'],
            'status' => $validated['status'],
            'layout_description' => $validated['layout_description'] ?? null,
            'phase' => $validated['phase'] ?? 'Phase 1',
        ]);

        // Update project totals
        $project = Project::find($unit->project_id);
        if ($project) {
            $this->recalculateProjectTotals($project);
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully.',
            'data' => $unit
        ]);
    }

    /**
     * Delete a single unit from a floor.
     */
    public function deleteSingleUnit($unitId)
    {
        $unit = Unit::findOrFail($unitId);
        $floorId = $unit->floor_id;
        $projectId = $unit->project_id;

        $unit->delete();

        // Update floor units_count
        if ($floorId) {
            $floor = BuildingFloor::find($floorId);
            if ($floor) {
                $floor->update(['units_count' => $floor->units()->count()]);
            }
        }

        // Recalculate project totals
        if ($projectId) {
            $project = Project::find($projectId);
            if ($project) {
                $this->recalculateProjectTotals($project);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🌳 PROJECT AMENITIES CRUD
    // ══════════════════════════════════════════════════════════

    public function getAmenities($projectId)
    {
        $amenities = ProjectAmenity::where('project_id', $projectId)
            ->orderBy('type')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $amenities,
            'type_labels' => ProjectAmenity::typeLabels(),
        ]);
    }

    public function createAmenity(Request $request, $projectId)
    {
        Project::findOrFail($projectId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'type' => ['required', Rule::in(array_keys(ProjectAmenity::typeLabels()))],
            'area' => 'nullable|numeric|min:0',
            'quantity' => 'integer|min:1',
            'description' => 'nullable|string',
        ]);

        $amenity = ProjectAmenity::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'type' => $validated['type'],
            'area' => $validated['area'] ?? null,
            'quantity' => $validated['quantity'] ?? 1,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Amenity added successfully.',
            'data' => $amenity
        ], 201);
    }

    public function updateAmenity(Request $request, $projectId, $amenityId)
    {
        $amenity = ProjectAmenity::where('project_id', $projectId)->findOrFail($amenityId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'type' => ['required', Rule::in(array_keys(ProjectAmenity::typeLabels()))],
            'area' => 'nullable|numeric|min:0',
            'quantity' => 'integer|min:1',
            'description' => 'nullable|string',
        ]);

        $amenity->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Amenity updated successfully.',
            'data' => $amenity
        ]);
    }

    public function deleteAmenity($projectId, $amenityId)
    {
        $amenity = ProjectAmenity::where('project_id', $projectId)->findOrFail($amenityId);
        $amenity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Amenity deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🔧 HELPERS
    // ══════════════════════════════════════════════════════════

    /**
     * Auto-generate floor records for a building.
     */
    private function generateFloorsForBuilding(Building $building): void
    {
        // Generate basement floors
        if ($building->has_basement) {
            $basementCount = $building->basement_floors ?: 1;
            for ($i = 1; $i <= $basementCount; $i++) {
                BuildingFloor::create([
                    'id' => (string) Str::uuid(),
                    'building_id' => $building->id,
                    'floor_number' => -$i,
                    'floor_label' => Building::generateFloorLabel(-$i),
                    'floor_type' => 'basement',
                    'gross_area' => $building->building_footprint_area,
                    'ceiling_height' => 3.00,
                ]);
            }
        }

        // Generate ground + upper floors
        for ($i = 0; $i < $building->total_floors; $i++) {
            $floorType = $i === 0 ? 'ground' : 'typical';

            BuildingFloor::create([
                'id' => (string) Str::uuid(),
                'building_id' => $building->id,
                'floor_number' => $i,
                'floor_label' => Building::generateFloorLabel($i),
                'floor_type' => $floorType,
                'gross_area' => $building->building_footprint_area,
                'common_area' => $building->common_area_per_floor,
                'ceiling_height' => $i === 0 ? 3.20 : 2.80,
            ]);
        }

        // Generate roof floor
        if ($building->has_roof_floor) {
            BuildingFloor::create([
                'id' => (string) Str::uuid(),
                'building_id' => $building->id,
                'floor_number' => $building->total_floors,
                'floor_label' => 'السطح',
                'floor_type' => 'roof',
                'gross_area' => $building->building_footprint_area,
                'ceiling_height' => 0,
            ]);
        }
    }

    /**
     * Recalculate project totals from its buildings.
     */
    private function recalculateProjectTotals(Project $project): void
    {
        $buildings = $project->buildings;
        $project->update([
            'total_buildings_count' => $buildings->count(),
            'total_built_area' => $buildings->sum('total_built_area'),
            'total_units' => $project->units()->whereNotNull('building_id')->count(),
            'density_per_feddan' => $this->calculateDensity($project),
        ]);
    }

    /**
     * Calculate residential density per feddan.
     */
    private function calculateDensity(Project $project): ?float
    {
        if (!$project->land_area || $project->land_area <= 0) {
            return null;
        }

        $landAreaSqm = $project->land_area;
        if ($project->land_area_unit === 'feddan') {
            $landAreaSqm = $project->land_area * 4200;
        } elseif ($project->land_area_unit === 'acre') {
            $landAreaSqm = $project->land_area * 4046.86;
        }

        $feddanCount = $landAreaSqm / 4200;
        if ($feddanCount <= 0) return null;

        $totalUnits = $project->units()->whereNotNull('building_id')->count();
        return round($totalUnits / $feddanCount, 2);
    }
}
