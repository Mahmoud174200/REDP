<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeminiService
{
    protected ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
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
            Log::warning('gemini.preprocess.missing_key', ['path' => $imagePath]);
            throw new \RuntimeException("Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.");
        }

        $fullPath = Storage::disk('public')->path($imagePath);
        if (!file_exists($fullPath)) {
            throw new \RuntimeException("Source image not found for preprocessing: {$imagePath}");
        }

        // Read the image data and convert to base64
        $imageData = base64_encode(file_get_contents($fullPath));
        $mimeType = mime_content_type($fullPath);

        Log::info('gemini.preprocess.started', ['image' => $imagePath]);

        // Step 1: Send image to Gemini (with fallback) to analyze the layout and write a prompt
        $promptText = "This is a 2D architectural floor plan layout or drawing. Please analyze the layout with extreme precision, focusing on the exact position, relative size, and boundaries of each room (bedrooms, bathrooms, closets, living room, kitchen, dining, patio/deck) relative to one another.
Then, write a highly detailed, spatially accurate text prompt for Google Imagen to generate a beautiful, realistic, isometric 3D cutaway architectural render that matches this exact layout.

CRITICAL LAYOUT INSTRUCTIONS:
- You must carefully inspect the 2D layout and describe the rooms in their exact locations (e.g., top-left, middle-left, bottom-left, top-middle, center, top-right, bottom-right).
- Describe where bathrooms are located precisely, ensuring their relative sizes are small and accurate (e.g., if a bathroom is at the bottom-left of the top-left bedroom, specify that it occupies only a small corner, not the whole width of the room).
- Detail the exact walls, doors, and walkways connecting these rooms to prevent the image generator from merging rooms or placing doors in incorrect spots.
- Clearly describe the living room in the center as an open space with living room furniture, not a bedroom.

STYLE INSTRUCTIONS:
- Describe it as an ultra-clean, minimalist 3D model with flat shading, smooth solid-colored surfaces, and sharp crisp edges.
- Describe the rooms, walls, doors, windows, solid floor colors (e.g., smooth light-colored wood flooring, solid-colored tiles), and clean minimalist furniture with solid colors.
- Avoid describing complex noisy textures like marble veins, highly grainy wood, or wallpaper patterns, as these cause reconstruction noise.
- Specify bright, uniform studio lighting with zero noise, sharp outlines, and clear contrasts.
- The output style must look like a clean, isolated 3D digital asset on a pure white background.

OUTPUT FORMAT CRITICAL:
- Your response must contain ONLY the raw prompt text for the image generator.
- Do NOT include any introductory or concluding text, conversational remarks, or markdown formatting (such as bold markers **, bullet points *, or code blocks ```).
- The response must be a single continuous paragraph of plain text descriptions, without lists, headers, or bullet points.";

        $chatModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
        $response = null;
        $lastError = '';

        foreach ($chatModels as $model) {
            Log::info("gemini.preprocess.trying_model", ['model' => $model]);
            $response = Http::timeout(120)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $promptText],
                            [
                                'inlineData' => [
                                    'mimeType' => $mimeType,
                                    'data' => $imageData
                                ]
                            ]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                ]
            ]);

            if ($response->successful()) {
                break;
            }

            $lastError = $response->json('error.message') ?? 'Unknown error';
            Log::warning("gemini.preprocess.model_failed", ['model' => $model, 'error' => $lastError]);
        }

        if (!$response || !$response->successful()) {
            Log::error('gemini.preprocess.all_models_failed', ['error' => $lastError]);
            throw new \RuntimeException("Gemini analysis failed: " . $lastError);
        }

        $imagenPrompt = $response->json('candidates.0.content.parts.0.text');
        if (empty($imagenPrompt)) {
            throw new \RuntimeException("Failed to generate Imagen 4 prompt from Gemini");
        }

        // Clean up conversational intros and markdown formatting
        $imagenPrompt = trim($imagenPrompt);
        
        // Strip markdown formatting characters
        $imagenPrompt = str_replace(['*', '`', '#', '■', '•'], '', $imagenPrompt);
        
        // If the model still returned a conversational intro like "Here is the prompt: ...", strip it
        if (preg_match('/^(here is|here\'s|sure|ok|this is|certainly)[^:]+:\s*/i', $imagenPrompt, $matches)) {
            $imagenPrompt = substr($imagenPrompt, strlen($matches[0]));
        }

        $imagenPrompt = trim($imagenPrompt);

        Log::info('gemini.preprocess.prompt_generated', ['prompt' => $imagenPrompt]);

        // Step 2: Use an image generation model to generate the 3D-ready rendering (with fallback)
        $imageModels = [
            'gemini-3.1-flash-image',
            'gemini-2.5-flash-image',
            'gemini-3-pro-image',
            'imagen-4.0-generate-001',
            'imagen-4.0-fast-generate-001',
            'imagen-4.0-ultra-generate-001'
        ];
        $base64Image = null;
        $imagenError = '';

        $fullPrompt = $imagenPrompt . " Flat shading, smooth solid-colored surfaces, crisp sharp edges, isolated 3D model asset, pure white background, uniform studio lighting, zero noise, highly detailed minimalist style, optimized for 3D reconstruction.";

        foreach ($imageModels as $model) {
            Log::info("gemini.preprocess.trying_image_model", ['model' => $model]);
            
            $isGeminiImageModel = str_contains($model, 'gemini-') && str_contains($model, '-image');
            
            if ($isGeminiImageModel) {
                // Use generateContent API for new Gemini Image models
                $imagenResponse = Http::timeout(120)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $this->apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $fullPrompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseModalities' => ['TEXT', 'IMAGE']
                    ]
                ]);
            } else {
                // Use predict API for legacy Imagen models
                $imagenResponse = Http::timeout(120)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:predict?key=" . $this->apiKey, [
                    'instances' => [
                        [
                            'prompt' => $fullPrompt
                        ]
                    ],
                    'parameters' => [
                        'sampleCount' => 1
                    ]
                ]);
            }

            if ($imagenResponse->successful()) {
                if ($isGeminiImageModel) {
                    $parts = $imagenResponse->json('candidates.0.content.parts') ?? [];
                    foreach ($parts as $part) {
                        if (isset($part['inlineData']['data'])) {
                            $base64Image = $part['inlineData']['data'];
                            break;
                        }
                    }
                } else {
                    $base64Image = $imagenResponse->json('predictions.0.bytesBase64Encoded');
                }

                if (!empty($base64Image)) {
                    break;
                } else {
                    $imagenError = "Model response was successful but did not contain image data.";
                    Log::warning("gemini.preprocess.image_model_missing_data", ['model' => $model]);
                }
            } else {
                $imagenError = $imagenResponse->json('error.message') ?? 'Unknown error';
                Log::warning("gemini.preprocess.image_model_failed", ['model' => $model, 'error' => $imagenError]);
            }
        }

        if (empty($base64Image)) {
            Log::error('gemini.preprocess.all_image_models_failed', ['error' => $imagenError]);
            throw new \RuntimeException("Image generation failed: " . $imagenError);
        }

        // Step 3: Decode base64 image and save to public storage
        $imageContent = base64_decode($base64Image);
        $newFilename = 'branding/' . Str::uuid() . '.png';
        Storage::disk('public')->put($newFilename, $imageContent);

        Log::info('gemini.preprocess.success', ['original' => $imagePath, 'preprocessed' => $newFilename]);

        return $newFilename;
    }
}
