<?php

namespace App\Jobs;

use App\Models\ProjectMedia;
use App\Services\TripoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateBuilding3DJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ProjectMedia $media,
        public bool $preprocessWithChatgpt = false
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TripoService $tripoService, \App\Services\GeminiService $geminiService): void
    {
        $media = $this->media;

        Log::info('tripo.job.generate.started', [
            'media_id' => $media->id,
            'project_id' => $media->project_id,
            'building' => $media->reference_key,
            'image_path' => $media->image_path,
            'preprocess' => $this->preprocessWithChatgpt,
        ]);

        try {
            // Validate the image exists
            if (!$media->image_path || !\Illuminate\Support\Facades\Storage::disk('public')->exists($media->image_path)) {
                throw new \RuntimeException("Building image not found: {$media->image_path}");
            }

            // Set status to processing
            $media->update([
                'model_3d_status' => 'processing',
                'tripo_error_msg' => $this->preprocessWithChatgpt ? 'Preprocessing layout with Gemini...' : null,
            ]);

            $imagePath = $media->image_path;
            if ($this->preprocessWithChatgpt) {
                $imagePath = $geminiService->preprocessFloorPlan($imagePath);
            }

            // Step 1: Upload image to Tripo
            $uploadResult = $tripoService->uploadImage($imagePath);
            $imageToken = $uploadResult['image_token'] ?? null;

            if (!$imageToken) {
                throw new \RuntimeException("No image_token returned from Tripo upload");
            }

            // Step 2: Create image_to_model task
            $taskResult = $tripoService->createTask($imageToken);
            $taskId = $taskResult['task_id'] ?? null;

            if (!$taskId) {
                throw new \RuntimeException("No task_id returned from Tripo task creation");
            }

            // Step 3: Save task_id for polling
            $media->update([
                'tripo_task_id' => $taskId,
                'model_3d_status' => 'processing',
            ]);

            // Step 4: Dispatch the status polling job with a delay
            $pollDelay = config('tripo.poll_interval', 60);
            CheckTripoStatusJob::dispatch($media, 1)->delay(now()->addSeconds($pollDelay));

            Log::info('tripo.job.generate.dispatched_poll', [
                'media_id' => $media->id,
                'task_id' => $taskId,
                'poll_delay' => $pollDelay,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.job.generate.failed', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $media->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('tripo.job.generate.fatal', [
            'media_id' => $this->media->id,
            'error' => $exception->getMessage(),
        ]);

        $this->media->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => 'Job failed after max retries: ' . $exception->getMessage(),
        ]);
    }
}
