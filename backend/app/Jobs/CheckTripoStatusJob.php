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

class CheckTripoStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 180;

    /**
     * Create a new job instance.
     *
     * @param ProjectMedia $media The building media record being polled
     * @param int $attempt Current polling attempt number
     */
    public function __construct(
        public ProjectMedia $media,
        public int $attempt = 1
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TripoService $tripoService): void
    {
        $media = $this->media;
        $taskId = $media->tripo_task_id;

        if (!$taskId) {
            Log::warning('tripo.job.poll.no_task_id', ['media_id' => $media->id]);
            $media->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => 'No task ID found for polling.',
            ]);
            return;
        }

        $maxPolls = config('tripo.max_polls', 30);

        Log::info('tripo.job.poll.checking', [
            'media_id' => $media->id,
            'task_id' => $taskId,
            'attempt' => $this->attempt,
            'max_polls' => $maxPolls,
        ]);

        try {
            $result = $tripoService->checkTaskStatus($taskId);
            $status = $result['status'];

            if ($status === 'completed') {
                $this->handleCompleted($tripoService, $media, $result);
                return;
            }

            if ($status === 'failed') {
                $this->handleFailed($media, $result);
                return;
            }

            // Still processing — re-dispatch if under max attempts
            if ($this->attempt >= $maxPolls) {
                Log::warning('tripo.job.poll.max_reached', [
                    'media_id' => $media->id,
                    'task_id' => $taskId,
                    'attempts' => $this->attempt,
                ]);
                $media->update([
                    'model_3d_status' => 'failed',
                    'tripo_error_msg' => "Generation timed out after {$this->attempt} polling attempts ({$this->attempt} minutes).",
                ]);
                return;
            }

            // Re-dispatch with incremented attempt counter
            $pollDelay = config('tripo.poll_interval', 60);
            self::dispatch($media, $this->attempt + 1)->delay(now()->addSeconds($pollDelay));

            Log::info('tripo.job.poll.requeued', [
                'media_id' => $media->id,
                'task_id' => $taskId,
                'next_attempt' => $this->attempt + 1,
                'delay' => $pollDelay,
                'progress' => $result['progress'] ?? 0,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.job.poll.error', [
                'media_id' => $media->id,
                'task_id' => $taskId,
                'error' => $e->getMessage(),
            ]);

            // Retry a few times before giving up
            if ($this->attempt < $maxPolls) {
                $pollDelay = config('tripo.poll_interval', 60);
                self::dispatch($media, $this->attempt + 1)->delay(now()->addSeconds($pollDelay));
            } else {
                $media->update([
                    'model_3d_status' => 'failed',
                    'tripo_error_msg' => 'Polling failed: ' . $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Handle a completed task — download and store the 3D model.
     */
    protected function handleCompleted(TripoService $tripoService, ProjectMedia $media, array $result): void
    {
        $modelUrl = $result['model_url'];

        if (!$modelUrl) {
            Log::error('tripo.job.poll.no_model_url', [
                'media_id' => $media->id,
                'result' => $result,
            ]);
            $media->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => 'Generation completed but no model URL returned.',
            ]);
            return;
        }

        Log::info('tripo.job.poll.downloading', [
            'media_id' => $media->id,
            'model_url' => $modelUrl,
        ]);

        try {
            // Download to local storage
            $localPath = "3d-models/{$media->project_id}/{$media->id}.glb";
            $tripoService->downloadModel($modelUrl, $localPath);

            $media->update([
                'model_3d_status' => 'completed',
                'model_3d_url' => $localPath,
                'tripo_error_msg' => null,
                'model_generated_at' => now(),
            ]);

            Log::info('tripo.job.poll.completed', [
                'media_id' => $media->id,
                'local_path' => $localPath,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.job.poll.download_failed', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);

            // Store the remote URL as fallback
            $media->update([
                'model_3d_status' => 'completed',
                'model_3d_url' => $modelUrl, // Use remote URL directly
                'tripo_error_msg' => 'Downloaded from remote URL (local download failed: ' . $e->getMessage() . ')',
                'model_generated_at' => now(),
            ]);
        }
    }

    /**
     * Handle a failed task.
     */
    protected function handleFailed(ProjectMedia $media, array $result): void
    {
        $errorMsg = $result['error'] ?? 'Unknown generation error';

        Log::error('tripo.job.poll.generation_failed', [
            'media_id' => $media->id,
            'error' => $errorMsg,
        ]);

        $media->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => $errorMsg,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('tripo.job.poll.fatal', [
            'media_id' => $this->media->id,
            'error' => $exception->getMessage(),
        ]);

        $this->media->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => 'Polling job failed: ' . $exception->getMessage(),
        ]);
    }
}
