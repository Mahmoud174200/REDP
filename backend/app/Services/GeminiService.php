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
        $promptText = "This is a 2D architectural floor plan layout or drawing. Please write a highly detailed, descriptive text prompt for Google Imagen 4 to generate a beautiful, realistic, isometric 3D cutaway architectural render of this exact apartment layout, optimized for 3D model reconstruction.\nStyle Instructions:\n- Describe it as an ultra-clean, minimalist 3D model with flat shading, smooth solid-colored surfaces, and sharp crisp edges.\n- Describe the rooms, walls, doors, windows, solid floor colors (e.g., smooth light-colored wood flooring, solid-colored tiles), and clean minimalist furniture with solid colors.\n- Avoid describing complex noisy textures like marble veins, highly grainy wood, or wallpaper patterns, as these cause reconstruction noise.\n- Specify bright, uniform studio lighting with zero noise, sharp outlines, and clear contrasts.\n- The output style must look like a clean, isolated 3D digital asset on a pure white background.\n\nCRITICAL:\n- Your response must contain ONLY the raw prompt text for the image generator.\n- Do NOT include any introductory or concluding text, conversational remarks, or markdown formatting (such as bold markers **, bullet points *, or code blocks ```).\n- The response must be a single continuous paragraph of plain text descriptions, without lists, headers, or bullet points.";

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

        // Step 2: Use Imagen 4 to generate the 3D-ready rendering
        $imagenResponse = Http::timeout(120)->withHeaders([
            'x-goog-api-key' => $this->apiKey,
            'Content-Type' => 'application/json'
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict", [
            'instances' => [
                [
                    'prompt' => $imagenPrompt . " Flat shading, smooth solid-colored surfaces, crisp sharp edges, isolated 3D model asset, pure white background, uniform studio lighting, zero noise, highly detailed minimalist style, optimized for 3D reconstruction."
                ]
            ],
            'parameters' => [
                'sampleCount' => 1
            ]
        ]);

        if ($imagenResponse->failed()) {
            Log::error('gemini.preprocess.imagen_failed', ['status' => $imagenResponse->status(), 'body' => $imagenResponse->body()]);
            throw new \RuntimeException("Imagen 4 generation failed: " . ($imagenResponse->json('error.message') ?? 'Unknown error'));
        }

        $base64Image = $imagenResponse->json('predictions.0.bytesBase64Encoded');
        if (empty($base64Image)) {
            throw new \RuntimeException("No base64 image returned from Imagen 4");
        }

        // Step 3: Decode base64 image and save to public storage
        $imageContent = base64_decode($base64Image);
        $newFilename = 'branding/' . Str::uuid() . '.png';
        Storage::disk('public')->put($newFilename, $imageContent);

        Log::info('gemini.preprocess.success', ['original' => $imagePath, 'preprocessed' => $newFilename]);

        return $newFilename;
    }
}
