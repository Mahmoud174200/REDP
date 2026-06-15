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
     * Upload project master plan image.
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
     * Get all media for a project (public endpoint for the interactive selection page).
     */
    public function getProjectMedia(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $media = ProjectMedia::where('project_id', $projectId)->get();

        $buildingImages = [];
        $floorPlanImages = [];

        foreach ($media as $m) {
            $item = [
                'id' => $m->id,
                'reference_key' => $m->reference_key,
                'image_url' => asset('storage/' . $m->image_path),
                'caption' => $m->caption,
            ];

            if ($m->media_type === 'building') {
                $buildingImages[$m->reference_key] = $item;
            } elseif ($m->media_type === 'floor_plan') {
                $floorPlanImages[$m->reference_key] = $item;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'project_image' => $project->image_url ? asset('storage/' . $project->image_url) : null,
                'building_images' => $buildingImages,
                'floor_plan_images' => $floorPlanImages,
            ],
        ]);
    }
}
