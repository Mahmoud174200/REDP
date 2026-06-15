<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateBuilding3DJob;
use App\Jobs\GenerateUnit3DJob;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class Tripo3DController extends Controller
{
    /**
     * Generate a 3D model for a specific building in a project.
     *
     * POST /v1/admin/projects/{projectId}/generate-3d
     * Body: { "building_name": "Block A" }
     */
    public function generate(Request $request, string $projectId): JsonResponse
    {
        $request->validate([
            'building_name' => 'required|string|max:255',
        ]);

        $project = Project::findOrFail($projectId);
        $buildingName = $request->input('building_name');

        if ($buildingName === 'master_plan') {
            return response()->json([
                'success' => false,
                'message' => '3D model generation is not supported for Master Plan. It is displayed as a static image.',
            ], 422);
        } else {
            // Find the building media record
            $media = ProjectMedia::where('project_id', $projectId)
                ->where('media_type', 'building')
                ->where('reference_key', $buildingName)
                ->first();
        }

        if (!$media) {
            return response()->json([
                'success' => false,
                'message' => "No image found for '{$buildingName}'. Please upload an image first.",
            ], 422);
        }

        // Validate image exists on disk
        if (!Storage::disk('public')->exists($media->image_path)) {
            return response()->json([
                'success' => false,
                'message' => "Building image file is missing from storage. Please re-upload the image.",
            ], 422);
        }

        // Check if already processing
        if ($media->model_3d_status === 'processing') {
            return response()->json([
                'success' => false,
                'message' => "3D model generation is already in progress for '{$buildingName}'.",
            ], 409);
        }

        // Check API key is configured
        if (empty(config('tripo.api_key'))) {
            return response()->json([
                'success' => false,
                'message' => 'Tripo AI API key is not configured. Please set TRIPO_API_KEY in .env.',
            ], 500);
        }

        // Reset status and dispatch job
        $media->update([
            'model_3d_status' => 'pending',
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        GenerateBuilding3DJob::dispatch($media);

        Log::info('tripo.controller.generate.dispatched', [
            'project_id' => $projectId,
            'building' => $buildingName,
            'media_id' => $media->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "3D model generation started for '{$buildingName}'. This may take a few minutes.",
            'data' => [
                'media_id' => $media->id,
                'building_name' => $buildingName,
                'status' => 'pending',
            ],
        ]);
    }

    /**
     * Get 3D generation status for all buildings in a project.
     *
     * GET /v1/admin/projects/{projectId}/3d-status
     */
    public function status(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $buildings = ProjectMedia::where('project_id', $projectId)
            ->whereIn('media_type', ['building', 'master_plan'])
            ->get()
            ->map(function (ProjectMedia $media) {
                return [
                    'media_id' => $media->id,
                    'media_type' => $media->media_type,
                    'building_name' => $media->reference_key,
                    'has_image' => !empty($media->image_path),
                    'image_url' => $media->image_path ? asset('storage/' . $media->image_path) : null,
                    'model_3d_status' => $media->model_3d_status,
                    'model_3d_url' => $this->getModelUrl($media),
                    'tripo_task_id' => $media->tripo_task_id,
                    'tripo_error_msg' => $media->tripo_error_msg,
                    'model_generated_at' => $media->model_generated_at,
                ];
            });

        // Master Plan is static only

        return response()->json([
            'success' => true,
            'data' => $buildings,
        ]);
    }

    /**
     * Delete a 3D model for a building.
     *
     * DELETE /v1/admin/3d-models/{mediaId}
     */
    public function deleteModel(string $mediaId): JsonResponse
    {
        $media = ProjectMedia::findOrFail($mediaId);

        // Delete the .glb file from storage if it's a local path
        if ($media->model_3d_url && !$this->isExternalUrl($media->model_3d_url)) {
            Storage::disk('public')->delete($media->model_3d_url);
        }

        $media->update([
            'model_3d_status' => null,
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        Log::info('tripo.controller.model.deleted', [
            'media_id' => $mediaId,
            'building' => $media->reference_key,
        ]);

        return response()->json([
            'success' => true,
            'message' => "3D model deleted for '{$media->reference_key}'.",
        ]);
    }

    /**
     * Regenerate a 3D model for a building.
     *
     * POST /v1/admin/3d-models/{mediaId}/regenerate
     */
    public function regenerate(string $mediaId): JsonResponse
    {
        $media = ProjectMedia::findOrFail($mediaId);

        if (!in_array($media->media_type, ['building', 'master_plan'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only building or master plan media can have 3D models.',
            ], 422);
        }

        if ($media->model_3d_status === 'processing') {
            return response()->json([
                'success' => false,
                'message' => '3D model generation is already in progress.',
            ], 409);
        }

        if (empty(config('tripo.api_key'))) {
            return response()->json([
                'success' => false,
                'message' => 'Tripo AI API key is not configured.',
            ], 500);
        }

        // Delete old model file if exists
        if ($media->model_3d_url && !$this->isExternalUrl($media->model_3d_url)) {
            Storage::disk('public')->delete($media->model_3d_url);
        }

        // Reset and dispatch
        $media->update([
            'model_3d_status' => 'pending',
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        GenerateBuilding3DJob::dispatch($media);

        Log::info('tripo.controller.model.regenerating', [
            'media_id' => $mediaId,
            'building' => $media->reference_key,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Regenerating 3D model for '{$media->reference_key}'.",
            'data' => [
                'media_id' => $media->id,
                'status' => 'pending',
            ],
        ]);
    }

    /**
     * Public endpoint: Get 3D models for a project's buildings.
     *
     * GET /v1/public/projects/{projectId}/3d-models
     */
    public function publicModels(string $projectId): JsonResponse
    {
        Project::findOrFail($projectId);

        $models = ProjectMedia::where('project_id', $projectId)
            ->whereIn('media_type', ['building', 'master_plan'])
            ->whereNotNull('model_3d_status')
            ->get()
            ->map(function (ProjectMedia $media) {
                return [
                    'media_id' => $media->id,
                    'media_type' => $media->media_type,
                    'building_name' => $media->reference_key,
                    'status' => $media->model_3d_status,
                    'model_url' => $this->getModelUrl($media),
                    'generated_at' => $media->model_generated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $models,
        ]);
    }

    /**
     * Serve a 3D model file directly with appropriate CORS headers.
     *
     * GET /v1/public/3d-models/{mediaId}/file
     */
    public function serveModelFile(string $mediaId)
    {
        $media = ProjectMedia::findOrFail($mediaId);

        if ($media->model_3d_status !== 'completed' || !$media->model_3d_url) {
            abort(404, '3D model file not found or not completed.');
        }

        if ($this->isExternalUrl($media->model_3d_url)) {
            return redirect()->away($media->model_3d_url);
        }

        if (!Storage::disk('public')->exists($media->model_3d_url)) {
            abort(404, '3D model file does not exist on disk.');
        }

        $fileContent = Storage::disk('public')->get($media->model_3d_url);
        
        return response($fileContent, 200)
            ->header('Content-Type', 'model/gltf-binary')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    }

    /**
     * Helper to resolve the model URL (routes it via the controller to append CORS headers).
     */
    protected function getModelUrl(ProjectMedia $media): ?string
    {
        if ($media->model_3d_status !== 'completed' || !$media->model_3d_url) {
            return null;
        }

        if ($this->isExternalUrl($media->model_3d_url)) {
            return $media->model_3d_url;
        }

        return url("/api/v1/public/3d-models/{$media->id}/file");
    }

    /**
     * Check if a URL is external (starts with http).
     */
    protected function isExternalUrl(string $url): bool
    {
        return str_starts_with($url, 'http://') || str_starts_with($url, 'https://');
    }
    /**
     * Copy 3D model columns from another building.
     *
     * POST /v1/admin/3d-models/{mediaId}/copy-from
     * Body: { "copy_from_media_id": "UUID" }
     */
    public function copyModel(Request $request, string $mediaId): JsonResponse
    {
        $request->validate([
            'copy_from_media_id' => 'required|uuid|exists:project_media,id',
        ]);

        $targetMedia = ProjectMedia::findOrFail($mediaId);
        $sourceMedia = ProjectMedia::findOrFail($request->input('copy_from_media_id'));

        $targetMedia->update([
            'image_path' => $sourceMedia->image_path,
            'model_3d_status' => $sourceMedia->model_3d_status,
            'model_3d_url' => $sourceMedia->model_3d_url,
            'tripo_task_id' => $sourceMedia->tripo_task_id,
            'tripo_error_msg' => $sourceMedia->tripo_error_msg,
            'model_generated_at' => $sourceMedia->model_generated_at,
        ]);

        Log::info('tripo.controller.model.copied', [
            'target_media_id' => $mediaId,
            'source_media_id' => $sourceMedia->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully copied 3D model from '{$sourceMedia->reference_key}' to '{$targetMedia->reference_key}'.",
        ]);
    }

    /**
     * Generate 3D model for a unit.
     */
    public function generateUnit3D(Request $request, string $unitId): JsonResponse
    {
        $unit = Unit::findOrFail($unitId);

        if (!$unit->layout_image_url) {
            return response()->json([
                'success' => false,
                'message' => "No layout image found for unit {$unit->unit_number}. Please upload a layout image first.",
            ], 422);
        }

        if (!Storage::disk('public')->exists($unit->layout_image_url)) {
            return response()->json([
                'success' => false,
                'message' => "Unit layout image file is missing from storage. Please re-upload.",
            ], 422);
        }

        if ($unit->model_3d_status === 'processing') {
            return response()->json([
                'success' => false,
                'message' => "3D model generation is already in progress for unit {$unit->unit_number}.",
            ], 409);
        }

        if (empty(config('tripo.api_key'))) {
            return response()->json([
                'success' => false,
                'message' => 'Tripo AI API key is not configured.',
            ], 500);
        }

        $unit->update([
            'model_3d_status' => 'pending',
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        GenerateUnit3DJob::dispatch($unit);

        return response()->json([
            'success' => true,
            'message' => "3D model generation started for unit {$unit->unit_number}.",
        ]);
    }

    /**
     * Regenerate 3D model for a unit.
     */
    public function regenerateUnit3D(string $unitId): JsonResponse
    {
        $unit = Unit::findOrFail($unitId);

        if (!$unit->layout_image_url) {
            return response()->json([
                'success' => false,
                'message' => "No layout image found for unit {$unit->unit_number}.",
            ], 422);
        }

        if ($unit->model_3d_status === 'processing') {
            return response()->json([
                'success' => false,
                'message' => "3D model generation is already in progress.",
            ], 409);
        }

        if (empty(config('tripo.api_key'))) {
            return response()->json([
                'success' => false,
                'message' => 'Tripo AI API key is not configured.',
            ], 500);
        }

        // Delete old model file if not shared
        if ($unit->model_3d_url && !$this->isExternalUrl($unit->model_3d_url)) {
            $isShared = Unit::where('model_3d_url', $unit->model_3d_url)
                ->where('id', '!=', $unit->id)
                ->exists();
            if (!$isShared) {
                Storage::disk('public')->delete($unit->model_3d_url);
            }
        }

        $unit->update([
            'model_3d_status' => 'pending',
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        GenerateUnit3DJob::dispatch($unit);

        return response()->json([
            'success' => true,
            'message' => "Regenerating 3D model for unit {$unit->unit_number}.",
        ]);
    }

    /**
     * Delete unit 3D model.
     */
    public function deleteUnit3D(string $unitId): JsonResponse
    {
        $unit = Unit::findOrFail($unitId);

        if ($unit->model_3d_url && !$this->isExternalUrl($unit->model_3d_url)) {
            $isShared = Unit::where('model_3d_url', $unit->model_3d_url)
                ->where('id', '!=', $unit->id)
                ->exists();
            if (!$isShared) {
                Storage::disk('public')->delete($unit->model_3d_url);
            }
        }

        $unit->update([
            'model_3d_status' => null,
            'model_3d_url' => null,
            'tripo_task_id' => null,
            'tripo_error_msg' => null,
            'model_generated_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "3D model deleted for unit {$unit->unit_number}.",
        ]);
    }

    /**
     * Copy 3D model columns from another unit.
     */
    public function copyUnit3D(Request $request, string $unitId): JsonResponse
    {
        $request->validate([
            'copy_from_unit_id' => 'required|uuid|exists:units,id',
        ]);

        $targetUnit = Unit::findOrFail($unitId);
        $sourceUnit = Unit::findOrFail($request->input('copy_from_unit_id'));

        $targetUnit->update([
            'layout_image_url' => $sourceUnit->layout_image_url,
            'model_3d_status' => $sourceUnit->model_3d_status,
            'model_3d_url' => $sourceUnit->model_3d_url,
            'tripo_task_id' => $sourceUnit->tripo_task_id,
            'tripo_error_msg' => $sourceUnit->tripo_error_msg,
            'model_generated_at' => $sourceUnit->model_generated_at,
        ]);

        Log::info('tripo.controller.unit_model.copied', [
            'target_unit_id' => $unitId,
            'source_unit_id' => $sourceUnit->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully copied 3D model from unit {$sourceUnit->unit_number} to unit {$targetUnit->unit_number}.",
        ]);
    }

    /**
     * Serve a unit's 3D model file directly with appropriate CORS headers.
     *
     * GET /v1/public/units/{unitId}/3d-model/file
     */
    public function serveUnitModelFile(string $unitId)
    {
        $unit = Unit::findOrFail($unitId);

        if ($unit->model_3d_status !== 'completed' || !$unit->model_3d_url) {
            abort(404, '3D model file not found or not completed.');
        }

        if ($this->isExternalUrl($unit->model_3d_url)) {
            return redirect()->away($unit->model_3d_url);
        }

        if (!Storage::disk('public')->exists($unit->model_3d_url)) {
            abort(404, '3D model file does not exist on disk.');
        }

        $fileContent = Storage::disk('public')->get($unit->model_3d_url);
        
        return response($fileContent, 200)
            ->header('Content-Type', 'model/gltf-binary')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    }
}
