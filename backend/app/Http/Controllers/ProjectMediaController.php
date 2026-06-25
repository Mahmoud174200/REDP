<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProjectMediaController extends Controller
{
    /**
     * Upload project cover image (landing page).
     */
    public function uploadProjectImage(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240', // 10MB max
        ]);

        $project = Project::findOrFail($projectId);

        $path = $request->file('image')->store('projects/' . $projectId, 'public');

        $project->update(['image_url' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Project image uploaded successfully.',
            'data' => [
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Upload project master plan image.
     */
    public function uploadMasterPlanImage(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:20480', // 20MB max for high-res
        ]);

        $project = Project::findOrFail($projectId);

        $path = $request->file('image')->store('projects/' . $projectId . '/master_plan', 'public');

        // Clear existing SVG when a new raster image is uploaded (will be re-vectorized)
        $project->update([
            'master_plan_image_url' => $path,
            'master_plan_svg_url' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project master plan image uploaded successfully.',
            'data' => [
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Upload vectorized SVG version of the master plan.
     */
    public function uploadMasterPlanSvg(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'svg' => 'required|file|max:51200', // 50MB max for SVG
        ]);

        $project = Project::findOrFail($projectId);

        $file = $request->file('svg');
        $fileName = 'master_plan_vector_' . time() . '.svg';
        $path = $file->storeAs('projects/' . $projectId . '/master_plan', $fileName, 'public');

        $project->update(['master_plan_svg_url' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Master plan SVG uploaded successfully.',
            'data' => [
                'svg_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Set up the number of units/apartments on a floor.
     * Auto-creates new units or deletes excess available units.
     */
    public function setupUnitsForFloor(Request $request, string $projectId, string $buildingName, int $floorNum): JsonResponse
    {
        $request->validate([
            'count' => 'required|integer|min:0|max:100',
        ]);

        $project = Project::findOrFail($projectId);
        $count = (int) $request->input('count');

        // Fetch current units for this building and floor
        $existingUnits = Unit::where('project_id', $projectId)
            ->where('building', $buildingName)
            ->where('floor', $floorNum)
            ->orderBy('unit_number', 'asc')
            ->get();

        $currentCount = $existingUnits->count();

        if ($count > $currentCount) {
            // Create missing units
            $toCreate = $count - $currentCount;
            $createdCount = 0;
            
            // Find the highest suffix currently used or default to 0
            $highestSuffix = 0;
            foreach ($existingUnits as $unit) {
                // If unit number is like '305', suffix is 5.
                // Let's parse the last 2 digits
                $numStr = preg_replace('/[^0-9]/', '', $unit->unit_number);
                if (strlen($numStr) >= 2) {
                    $suffix = (int) substr($numStr, -2);
                    if ($suffix > $highestSuffix) {
                        $highestSuffix = $suffix;
                    }
                }
            }

            for ($i = 1; $i <= $toCreate; $i++) {
                $suffix = $highestSuffix + $i;
                $unitNumber = sprintf('%d%02d', $floorNum, $suffix);

                Unit::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $projectId,
                    'unit_number' => $unitNumber,
                    'floor' => $floorNum,
                    'building' => $buildingName,
                    'type' => 'apartment',
                    'price' => 1000000.00, // Default baseline price
                    'status' => 'available',
                ]);
                $createdCount++;
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully created {$createdCount} new units on floor {$floorNum}.",
            ]);
        } elseif ($count < $currentCount) {
            // Prune excess units, starting from highest unit number, but only if they are available
            $toRemove = $currentCount - $count;
            $removedCount = 0;
            $skippedCount = 0;

            // Fetch in descending order to delete from the end
            $unitsToPrune = Unit::where('project_id', $projectId)
                ->where('building', $buildingName)
                ->where('floor', $floorNum)
                ->orderBy('unit_number', 'desc')
                ->get();

            foreach ($unitsToPrune as $unit) {
                if ($removedCount >= $toRemove) {
                    break;
                }

                if ($unit->status === 'available') {
                    // Check if unit has layout image, delete it from disk
                    if ($unit->layout_image_url) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($unit->layout_image_url);
                    }
                    if ($unit->model_3d_url && !str_starts_with($unit->model_3d_url, 'http')) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($unit->model_3d_url);
                    }
                    $unit->delete();
                    $removedCount++;
                } else {
                    $skippedCount++;
                }
            }

            if ($removedCount < $toRemove) {
                return response()->json([
                    'success' => true,
                    'message' => "Pruned {$removedCount} units. Skipped {$skippedCount} units because they are reserved/sold and cannot be deleted.",
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully pruned {$removedCount} excess units on floor {$floorNum}.",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "No changes made. Floor {$floorNum} already has {$currentCount} units.",
        ]);
    }

    /**
     * Upload building image.
     */
    public function uploadBuildingImage(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
            'building_name' => 'required|string|max:255',
        ]);

        Project::findOrFail($projectId);

        $path = $request->file('image')->store('projects/' . $projectId . '/buildings', 'public');

        // Upsert: replace existing building image or create new
        $media = ProjectMedia::updateOrCreate(
            [
                'project_id' => $projectId,
                'media_type' => 'building',
                'reference_key' => $request->building_name,
            ],
            [
                'id' => (string) Str::uuid(),
                'image_path' => $path,
                'caption' => $request->caption ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Building image uploaded successfully.',
            'data' => [
                'id' => $media->id,
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Upload floor plan image.
     */
    public function uploadFloorPlanImage(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
            'building_name' => 'required|string|max:255',
            'floor_number' => 'required|integer',
        ]);

        Project::findOrFail($projectId);

        $path = $request->file('image')->store('projects/' . $projectId . '/floors', 'public');

        $refKey = $request->building_name . '|' . $request->floor_number;

        $media = ProjectMedia::updateOrCreate(
            [
                'project_id' => $projectId,
                'media_type' => 'floor_plan',
                'reference_key' => $refKey,
            ],
            [
                'id' => (string) Str::uuid(),
                'image_path' => $path,
                'caption' => $request->caption ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Floor plan image uploaded successfully.',
            'data' => [
                'id' => $media->id,
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Upload unit layout image.
     */
    public function uploadUnitImage(Request $request, string $unitId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        $unit = Unit::findOrFail($unitId);

        $path = $request->file('image')->store('projects/' . $unit->project_id . '/units', 'public');

        $unit->update(['layout_image_url' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Unit layout image uploaded successfully.',
            'data' => [
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Save the interactive floor-plan hotspot region for a single unit.
     * Coords are percentages (0-100) relative to the floor plan image.
     */
    public function saveUnitHotspot(Request $request, string $unitId): JsonResponse
    {
        $fields = $request->validate([
            'x' => 'nullable|numeric|min:0|max:100',
            'y' => 'nullable|numeric|min:0|max:100',
            'w' => 'nullable|numeric|min:0|max:100',
            'h' => 'nullable|numeric|min:0|max:100',
            'points' => 'nullable|array|min:3|max:40',
            'points.*.x' => 'required_with:points|numeric|min:0|max:100',
            'points.*.y' => 'required_with:points|numeric|min:0|max:100',
        ]);

        $unit = Unit::findOrFail($unitId);

        if (!empty($fields['points'])) {
            // Polygon hotspot — store the points plus a bounding box (for centroid/fallback).
            $xs = array_map(fn($p) => (float) $p['x'], $fields['points']);
            $ys = array_map(fn($p) => (float) $p['y'], $fields['points']);
            $minX = min($xs); $minY = min($ys);
            $hotspot = [
                'x' => round($minX, 2),
                'y' => round($minY, 2),
                'w' => round(max($xs) - $minX, 2),
                'h' => round(max($ys) - $minY, 2),
                'points' => array_map(fn($p) => [
                    'x' => round((float) $p['x'], 2),
                    'y' => round((float) $p['y'], 2),
                ], $fields['points']),
            ];
        } else {
            if (!isset($fields['x'], $fields['y'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Provide either polygon points or x/y coordinates.',
                ], 422);
            }
            $hotspot = [
                'x' => round((float) $fields['x'], 2),
                'y' => round((float) $fields['y'], 2),
                'w' => round((float) ($fields['w'] ?? 12), 2),
                'h' => round((float) ($fields['h'] ?? 12), 2),
            ];
        }

        $unit->update(['floor_plan_hotspot' => $hotspot]);

        return response()->json([
            'success' => true,
            'message' => 'Unit hotspot saved.',
            'data' => ['hotspot' => $unit->floor_plan_hotspot],
        ]);
    }

    /**
     * Clear the floor-plan hotspot for a single unit.
     */
    public function clearUnitHotspot(Request $request, string $unitId): JsonResponse
    {
        $unit = Unit::findOrFail($unitId);
        $unit->update(['floor_plan_hotspot' => null]);

        return response()->json(['success' => true, 'message' => 'Unit hotspot cleared.']);
    }

    /**
     * Get all media for a project (public endpoint for the interactive selection page).
     */
    public function getProjectMedia(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $media = ProjectMedia::where('project_id', $projectId)->get();

        $buildingImages = [];
        $floorPlanImages = [];
        $coverGallery = [];

        foreach ($media as $m) {
            $item = [
                'id' => $m->id,
                'reference_key' => $m->reference_key,
                'image_url' => $m->image_path ? asset('storage/' . $m->image_path) : null,
                'caption' => $m->caption,
            ];

            if ($m->media_type === 'building') {
                $buildingImages[$m->reference_key] = $item;
            } elseif ($m->media_type === 'floor_plan') {
                $floorPlanImages[$m->reference_key] = $item;
            } elseif ($m->media_type === 'cover_gallery') {
                $coverGallery[] = $item;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'project_image' => $project->master_plan_image_url ? (str_starts_with($project->master_plan_image_url, 'http') ? $project->master_plan_image_url : asset('storage/' . $project->master_plan_image_url)) : null,
                'project_image_svg' => $project->master_plan_svg_url ? (str_starts_with($project->master_plan_svg_url, 'http') ? $project->master_plan_svg_url : asset('storage/' . $project->master_plan_svg_url)) : null,
                'cover_image' => $project->image_url ? (str_starts_with($project->image_url, 'http') ? $project->image_url : asset('storage/' . $project->image_url)) : null,
                'cover_gallery' => $coverGallery,
                'building_images' => $buildingImages,
                'floor_plan_images' => $floorPlanImages,
            ],
        ]);
    }

    /**
     * Upload an image to the project cover gallery.
     */
    public function uploadCoverGalleryImage(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240', // 10MB max
        ]);

        $project = Project::findOrFail($projectId);

        $path = $request->file('image')->store('projects/' . $projectId . '/cover_gallery', 'public');

        $media = ProjectMedia::create([
            'id' => (string) Str::uuid(),
            'project_id' => $projectId,
            'media_type' => 'cover_gallery',
            'reference_key' => basename($path),
            'image_path' => $path,
            'caption' => $request->input('caption', null),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cover gallery image uploaded successfully.',
            'data' => [
                'id' => $media->id,
                'image_url' => asset('storage/' . $path),
                'path' => $path,
            ],
        ]);
    }

    /**
     * Delete an image from the project cover gallery.
     */
    public function deleteCoverGalleryImage(string $projectId, string $mediaId): JsonResponse
    {
        $media = ProjectMedia::where('project_id', $projectId)
            ->where('id', $mediaId)
            ->where('media_type', 'cover_gallery')
            ->firstOrFail();

        // Delete from storage disk
        if ($media->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($media->image_path);
        }

        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cover gallery image deleted successfully.',
        ]);
    }

    /**
     * Setup building layout structure: name, floors count, units count per floor.
     */
    public function setupBuilding(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'building_name' => 'required|string|max:255',
            'floors_count' => 'required|integer|min:1|max:50',
            'units_per_floor' => 'required|integer|min:1|max:20',
        ]);

        $project = Project::findOrFail($projectId);
        $buildingName = $request->input('building_name');
        $floorsCount = (int) $request->input('floors_count');
        $unitsPerFloor = (int) $request->input('units_per_floor');

        $createdCount = 0;
        for ($floor = 1; $floor <= $floorsCount; $floor++) {
            $existingCount = Unit::where('project_id', $projectId)
                ->where('building', $buildingName)
                ->where('floor', $floor)
                ->count();

            if ($existingCount >= $unitsPerFloor) {
                if ($existingCount > $unitsPerFloor) {
                    $excess = $existingCount - $unitsPerFloor;
                    $unitsToPrune = Unit::where('project_id', $projectId)
                        ->where('building', $buildingName)
                        ->where('floor', $floor)
                        ->orderBy('unit_number', 'desc')
                        ->get();

                    $pruned = 0;
                    foreach ($unitsToPrune as $unit) {
                        if ($pruned >= $excess) break;
                        if ($unit->status === 'available') {
                            if ($unit->layout_image_url) {
                                \Illuminate\Support\Facades\Storage::disk('public')->delete($unit->layout_image_url);
                            }
                            if ($unit->model_3d_url && !str_starts_with($unit->model_3d_url, 'http')) {
                                \Illuminate\Support\Facades\Storage::disk('public')->delete($unit->model_3d_url);
                            }
                            $unit->delete();
                            $pruned++;
                        }
                    }
                }
                continue;
            }

            $toCreate = $unitsPerFloor - $existingCount;
            for ($i = 1; $i <= $toCreate; $i++) {
                $suffix = $existingCount + $i;
                $unitNumber = sprintf('%d%02d', $floor, $suffix);

                Unit::create([
                    'id' => (string) Str::uuid(),
                    'project_id' => $projectId,
                    'unit_number' => $unitNumber,
                    'floor' => $floor,
                    'building' => $buildingName,
                    'type' => 'apartment',
                    'price' => 1000000.00,
                    'status' => 'available',
                ]);
                $createdCount++;
            }
        }

        // Ensure ProjectMedia record exists so it registers in dashboard
        ProjectMedia::firstOrCreate(
            [
                'project_id' => $projectId,
                'media_type' => 'building',
                'reference_key' => $buildingName,
            ],
            [
                'id' => (string) Str::uuid(),
                'image_path' => '', // Uploaded later
                'caption' => $buildingName,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Successfully configured building '{$buildingName}' with {$floorsCount} floors and {$unitsPerFloor} apartments per floor.",
        ]);
    }
}
