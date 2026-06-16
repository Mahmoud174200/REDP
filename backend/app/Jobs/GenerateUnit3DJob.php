<?php

namespace App\Jobs;

use App\Models\Unit;
use App\Services\TripoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateUnit3DJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        public Unit $unit,
        public bool $preprocessWithChatgpt = false
    ) {}

    public function handle(TripoService $tripoService, \App\Services\GeminiService $geminiService): void
    {
        $unit = $this->unit;

        Log::info('tripo.unit_job.generate.started', [
            'unit_id' => $unit->id,
            'project_id' => $unit->project_id,
            'unit_number' => $unit->unit_number,
            'image_path' => $unit->layout_image_url,
            'preprocess' => $this->preprocessWithChatgpt,
        ]);

        try {
            if (!$unit->layout_image_url || !\Illuminate\Support\Facades\Storage::disk('public')->exists($unit->layout_image_url)) {
                throw new \RuntimeException("Unit layout image not found: {$unit->layout_image_url}");
            }

            $unit->update([
                'model_3d_status' => 'processing',
                'tripo_error_msg' => $this->preprocessWithChatgpt ? 'Preprocessing layout with Gemini...' : null,
            ]);

            $imagePath = $unit->layout_image_url;
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
            $unit->update([
                'tripo_task_id' => $taskId,
                'model_3d_status' => 'processing',
            ]);

            // Step 4: Dispatch polling job
            $pollDelay = config('tripo.poll_interval', 60);
            CheckUnitTripoStatusJob::dispatch($unit, 1)->delay(now()->addSeconds($pollDelay));

            Log::info('tripo.unit_job.generate.dispatched_poll', [
                'unit_id' => $unit->id,
                'task_id' => $taskId,
                'poll_delay' => $pollDelay,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.unit_job.generate.failed', [
                'unit_id' => $unit->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $unit->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => $e->getMessage(),
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('tripo.unit_job.generate.fatal', [
            'unit_id' => $this->unit->id,
            'error' => $exception->getMessage(),
        ]);

        $this->unit->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => 'Job failed after max retries: ' . $exception->getMessage(),
        ]);
    }
}
