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

class CheckUnitTripoStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;

    public function __construct(
        public Unit $unit,
        public int $attempt = 1
    ) {}

    public function handle(TripoService $tripoService): void
    {
        $unit = $this->unit;
        $taskId = $unit->tripo_task_id;

        if (!$taskId) {
            Log::warning('tripo.unit_job.poll.no_task_id', ['unit_id' => $unit->id]);
            $unit->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => 'No task ID found for polling.',
            ]);
            return;
        }

        $maxPolls = config('tripo.max_polls', 30);

        Log::info('tripo.unit_job.poll.checking', [
            'unit_id' => $unit->id,
            'task_id' => $taskId,
            'attempt' => $this->attempt,
            'max_polls' => $maxPolls,
        ]);

        try {
            $result = $tripoService->checkTaskStatus($taskId);
            $status = $result['status'];

            if ($status === 'completed') {
                $this->handleCompleted($tripoService, $unit, $result);
                return;
            }

            if ($status === 'failed') {
                $this->handleFailed($unit, $result);
                return;
            }

            if ($this->attempt >= $maxPolls) {
                Log::warning('tripo.unit_job.poll.max_reached', [
                    'unit_id' => $unit->id,
                    'task_id' => $taskId,
                    'attempts' => $this->attempt,
                ]);
                $unit->update([
                    'model_3d_status' => 'failed',
                    'tripo_error_msg' => "Generation timed out after {$this->attempt} polling attempts ({$this->attempt} minutes).",
                ]);
                return;
            }

            $pollDelay = config('tripo.poll_interval', 60);
            self::dispatch($unit, $this->attempt + 1)->delay(now()->addSeconds($pollDelay));

            Log::info('tripo.unit_job.poll.requeued', [
                'unit_id' => $unit->id,
                'task_id' => $taskId,
                'next_attempt' => $this->attempt + 1,
                'delay' => $pollDelay,
                'progress' => $result['progress'] ?? 0,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.unit_job.poll.error', [
                'unit_id' => $unit->id,
                'task_id' => $taskId,
                'error' => $e->getMessage(),
            ]);

            if ($this->attempt < $maxPolls) {
                $pollDelay = config('tripo.poll_interval', 60);
                self::dispatch($unit, $this->attempt + 1)->delay(now()->addSeconds($pollDelay));
            } else {
                $unit->update([
                    'model_3d_status' => 'failed',
                    'tripo_error_msg' => 'Polling failed: ' . $e->getMessage(),
                ]);
            }
        }
    }

    protected function handleCompleted(TripoService $tripoService, Unit $unit, array $result): void
    {
        $modelUrl = $result['model_url'];

        if (!$modelUrl) {
            Log::error('tripo.unit_job.poll.no_model_url', [
                'unit_id' => $unit->id,
                'result' => $result,
            ]);
            $unit->update([
                'model_3d_status' => 'failed',
                'tripo_error_msg' => 'Generation completed but no model URL returned.',
            ]);
            return;
        }

        Log::info('tripo.unit_job.poll.downloading', [
            'unit_id' => $unit->id,
            'model_url' => $modelUrl,
        ]);

        try {
            $localPath = "3d-models/units/{$unit->id}.glb";
            $tripoService->downloadModel($modelUrl, $localPath);

            $unit->update([
                'model_3d_status' => 'completed',
                'model_3d_url' => $localPath,
                'tripo_error_msg' => null,
                'model_generated_at' => now(),
            ]);

            Log::info('tripo.unit_job.poll.completed', [
                'unit_id' => $unit->id,
                'local_path' => $localPath,
            ]);

        } catch (\Throwable $e) {
            Log::error('tripo.unit_job.poll.download_failed', [
                'unit_id' => $unit->id,
                'error' => $e->getMessage(),
            ]);

            $unit->update([
                'model_3d_status' => 'completed',
                'model_3d_url' => $modelUrl,
                'tripo_error_msg' => 'Downloaded from remote URL (local download failed: ' . $e->getMessage() . ')',
                'model_generated_at' => now(),
            ]);
        }
    }

    protected function handleFailed(Unit $unit, array $result): void
    {
        $errorMsg = $result['error'] ?? 'Unknown generation error';

        Log::error('tripo.unit_job.poll.generation_failed', [
            'unit_id' => $unit->id,
            'error' => $errorMsg,
        ]);

        $unit->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => $errorMsg,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('tripo.unit_job.poll.fatal', [
            'unit_id' => $this->unit->id,
            'error' => $exception->getMessage(),
        ]);

        $this->unit->update([
            'model_3d_status' => 'failed',
            'tripo_error_msg' => 'Polling job failed: ' . $exception->getMessage(),
        ]);
    }
}
