<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OpenAIService
{
    protected ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY', config('services.openai.key'));
    }

    /**
     * Preprocess a 2D floor plan layout image into a 3D-ready isometric rendering.
     *
     * @param string $imagePath Local path of the image (relative to storage/app/public)
     * @return string Preprocessed local image path (saved to storage/app/public)
     */
    public function preprocessFloorPlan(string $imagePath): string
    {
        if (empty($this->apiKey)) {
            Log::warning('openai.preprocess.missing_key', ['path' => $imagePath]);
            throw new \RuntimeException("OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.");
        }

        $fullPath = Storage::disk('public')->path($imagePath);
        if (!file_exists($fullPath)) {
            throw new \RuntimeException("Source image not found for preprocessing: {$imagePath}");
        }

        // Read the image data and convert to base64
        $imageData = base64_encode(file_get_contents($fullPath));
        $mimeType = mime_content_type($fullPath);

        Log::info('openai.preprocess.started', ['image' => $imagePath]);

        // Step 1: Send image to GPT-4o to analyze the layout and write a DALL-E prompt
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4o',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "This is a 2D architectural floor plan layout or drawing. Please write a highly detailed, descriptive prompt for DALL-E 3 to generate a beautiful, realistic, isometric 3D cutaway architectural render of this exact apartment layout. Describe the room layouts, furniture placement, flooring, walls, doors, windows, and realistic warm architectural lighting. Keep the prompt compact and optimized for DALL-E 3 to generate a clean, isolated 3D model look on a neutral gray studio background, suitable for converting to a 3D asset.",
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:{$mimeType};base64,{$imageData}",
                            ],
                        ],
                    ],
                ],
            ],
            'max_tokens' => 300,
        ]);

        if ($response->failed()) {
            Log::error('openai.preprocess.gpt_failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException("GPT-4o preprocessing failed: " . ($response->json('error.message') ?? 'Unknown error'));
        }

        $dallePrompt = $response->json('choices.0.message.content');
        if (empty($dallePrompt)) {
            throw new \RuntimeException("Failed to generate DALL-E prompt from GPT-4o");
        }

        Log::info('openai.preprocess.prompt_generated', ['prompt' => $dallePrompt]);

        // Step 2: Use DALL-E 3 to generate the 3D-ready rendering
        $dalleResponse = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
        ])->post('https://api.openai.com/v1/images/generations', [
            'model' => 'dall-e-3',
            'prompt' => $dallePrompt . " Clean 3D asset, isometric white background, soft lighting, award-winning architectural visualization.",
            'n' => 1,
            'size' => '1024x1024',
        ]);

        if ($dalleResponse->failed()) {
            Log::error('openai.preprocess.dalle_failed', ['status' => $dalleResponse->status(), 'body' => $dalleResponse->body()]);
            throw new \RuntimeException("DALL-E 3 image generation failed: " . ($dalleResponse->json('error.message') ?? 'Unknown error'));
        }

        $imageUrl = $dalleResponse->json('data.0.url');
        if (empty($imageUrl)) {
            throw new \RuntimeException("No image URL returned from DALL-E 3");
        }

        // Step 3: Download the generated image and save to public storage
        $imageContent = Http::get($imageUrl)->body();
        $newFilename = 'branding/' . Str::uuid() . '.png';
        Storage::disk('public')->put($newFilename, $imageContent);

        Log::info('openai.preprocess.success', ['original' => $imagePath, 'preprocessed' => $newFilename]);

        return $newFilename;
    }
}
