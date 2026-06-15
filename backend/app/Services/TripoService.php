<?php

namespace App\Services;

use App\Models\ProjectMedia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TripoService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('tripo.base_url'), '/');
        $this->apiKey = config('tripo.api_key');
        $this->timeout = config('tripo.timeout', 120);
    }

    /**
     * Get authorized HTTP client for Tripo API.
     */
    protected function client()
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->timeout($this->timeout);
    }

    /**
     * Upload an image file to Tripo and get back a file token.
     *
     * Tripo uses an STS-based upload flow:
     * 1. Request temporary upload credentials
     * 2. Upload the file using those credentials
     * 3. Receive a file_token to use in task creation
     *
     * Alternative: Use the simpler direct upload endpoint.
     */
    public function uploadImage(string $imagePath): array
    {
        $fullPath = Storage::disk('public')->path($imagePath);

        if (!file_exists($fullPath)) {
            Log::error('tripo.upload.file_not_found', ['path' => $fullPath]);
            throw new \RuntimeException("Image file not found: {$imagePath}");
        }

        $mimeType = mime_content_type($fullPath);
        $extension = pathinfo($fullPath, PATHINFO_EXTENSION);

        Log::info('tripo.upload.starting', [
            'path' => $imagePath,
            'size' => filesize($fullPath),
            'mime' => $mimeType,
        ]);

        try {
            $response = $this->client()
                ->attach('file', file_get_contents($fullPath), basename($fullPath), [
                    'Content-Type' => $mimeType,
                ])
                ->post("{$this->baseUrl}/upload");

            if ($response->failed()) {
                Log::error('tripo.upload.api_error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $errorMsg = $this->getErrorMessage($response, "Tripo upload failed: HTTP {$response->status()}");
                throw new \RuntimeException($errorMsg);
            }

            $data = $response->json();

            if (($data['code'] ?? -1) !== 0) {
                Log::error('tripo.upload.response_error', ['response' => $data]);
                throw new \RuntimeException("Tripo upload error: " . ($data['message'] ?? 'Unknown error'));
            }

            Log::info('tripo.upload.success', [
                'image_token' => $data['data']['image_token'] ?? 'unknown',
            ]);

            return $data['data'];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('tripo.upload.timeout', ['error' => $e->getMessage()]);
            throw new \RuntimeException("Tripo API connection timeout during upload");
        }
    }

    /**
     * Create an image-to-model task on Tripo.
     *
     * @param string $imageToken The token received from uploadImage()
     * @return array Task data including task_id
     */
    public function createTask(string $imageToken): array
    {
        Log::info('tripo.task.creating', ['image_token' => $imageToken]);

        try {
            $response = $this->client()->post("{$this->baseUrl}/task", [
                'type' => 'image_to_model',
                'model_version' => config('tripo.model_version', 'v2.5-20250123'),
                'file' => [
                    'type' => 'image',
                    'file_token' => $imageToken,
                ],
            ]);

            if ($response->failed()) {
                Log::error('tripo.task.api_error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $errorMsg = $this->getErrorMessage($response, "Tripo task creation failed: HTTP {$response->status()}");
                throw new \RuntimeException($errorMsg);
            }

            $data = $response->json();

            if (($data['code'] ?? -1) !== 0) {
                Log::error('tripo.task.response_error', ['response' => $data]);
                throw new \RuntimeException("Tripo task error: " . ($data['message'] ?? 'Unknown error'));
            }

            $taskId = $data['data']['task_id'] ?? null;

            Log::info('tripo.task.created', ['task_id' => $taskId]);

            return $data['data'];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('tripo.task.timeout', ['error' => $e->getMessage()]);
            throw new \RuntimeException("Tripo API connection timeout during task creation");
        }
    }

    /**
     * Check the status of a Tripo generation task.
     *
     * @param string $taskId
     * @return array ['status' => string, 'model_url' => string|null, 'error' => string|null]
     */
    public function checkTaskStatus(string $taskId): array
    {
        Log::info('tripo.status.checking', ['task_id' => $taskId]);

        try {
            $response = $this->client()->get("{$this->baseUrl}/task/{$taskId}");

            if ($response->failed()) {
                Log::error('tripo.status.api_error', [
                    'task_id' => $taskId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $errorMsg = $this->getErrorMessage($response, "API returned HTTP {$response->status()}");
                return [
                    'status' => 'failed',
                    'model_url' => null,
                    'error' => $errorMsg,
                ];
            }

            $data = $response->json();
            $taskData = $data['data'] ?? [];
            $taskStatus = strtolower($taskData['status'] ?? 'unknown');

            Log::info('tripo.status.result', [
                'task_id' => $taskId,
                'status' => $taskStatus,
            ]);

            // Map Tripo statuses to our internal statuses
            if (in_array($taskStatus, ['success', 'finished'])) {
                $modelUrl = $taskData['output']['model'] ?? $taskData['result']['model']['url'] ?? null;
                // Try alternative response structures
                if (!$modelUrl && isset($taskData['output']['rendered_image'])) {
                    $modelUrl = $taskData['output']['pbr_model'] ?? $taskData['output']['base_model'] ?? null;
                }

                return [
                    'status' => 'completed',
                    'model_url' => $modelUrl,
                    'error' => null,
                ];
            }

            if (in_array($taskStatus, ['failed', 'cancelled', 'expired', 'banned'])) {
                return [
                    'status' => 'failed',
                    'model_url' => null,
                    'error' => $taskData['error'] ?? $taskData['message'] ?? "Task {$taskStatus}",
                ];
            }

            // Still processing (queued, running, etc.)
            return [
                'status' => 'processing',
                'model_url' => null,
                'error' => null,
                'progress' => $taskData['progress'] ?? 0,
            ];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('tripo.status.timeout', [
                'task_id' => $taskId,
                'error' => $e->getMessage(),
            ]);
            return [
                'status' => 'processing', // Treat timeout as "still processing"
                'model_url' => null,
                'error' => null,
            ];
        }
    }

    /**
     * Download a 3D model file from Tripo's CDN to local storage.
     *
     * @param string $url The remote model URL
     * @param string $localPath Relative path within the public disk
     * @return string The stored path
     */
    public function downloadModel(string $url, string $localPath): string
    {
        Log::info('tripo.download.starting', [
            'url' => $url,
            'local_path' => $localPath,
        ]);

        try {
            $response = Http::timeout(300)->get($url);

            if ($response->failed()) {
                Log::error('tripo.download.failed', [
                    'url' => $url,
                    'status' => $response->status(),
                ]);
                throw new \RuntimeException("Failed to download 3D model: HTTP {$response->status()}");
            }

            // Ensure directory exists
            $directory = dirname($localPath);
            Storage::disk('public')->makeDirectory($directory);

            // Store the file
            Storage::disk('public')->put($localPath, $response->body());

            Log::info('tripo.download.completed', [
                'local_path' => $localPath,
                'size' => strlen($response->body()),
            ]);

            return $localPath;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('tripo.download.timeout', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException("Timeout downloading 3D model from Tripo");
        }
    }

    /**
     * Get a user-friendly error message from a failed HTTP response.
     */
    protected function getErrorMessage($response, string $defaultMessage): string
    {
        try {
            $data = $response->json();
            if (isset($data['message'])) {
                return $data['message'];
            }
            if (isset($data['error'])) {
                return $data['error'];
            }
        } catch (\Throwable $e) {
            // Not JSON or missing message fields
        }

        return $defaultMessage;
    }
}
