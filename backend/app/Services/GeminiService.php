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

    /**
     * Analyze a 2D floor plan image and generate a structural grid representing walls, windows, and doors.
     *
     * @param string $imagePath Local path of the image (relative to storage/app/public)
     * @param int $gridSize Size of the grid (default 28)
     * @return array 2D array representing structural layout
     * @throws \RuntimeException when API key is missing/invalid or detection fails
     */
    public function autodetectFloorPlanGrid(string $imagePath, int $gridSize = 28): array
    {
        if (empty($this->apiKey) || $this->apiKey === 'your_gemini_api_key_here' || str_contains($this->apiKey, 'placeholder')) {
            throw new \RuntimeException(
                "Gemini API key is not configured. Please set a valid GEMINI_API_KEY in your .env file.\n" .
                "مفتاح Gemini API غير مُعد. يرجى إضافة مفتاح صالح في ملف .env"
            );
        }

        $fullPath = Storage::disk('public')->path($imagePath);
        if (!file_exists($fullPath)) {
            throw new \RuntimeException("Source image not found for layout detection: {$imagePath}");
        }

        $imageData = base64_encode(file_get_contents($fullPath));
        $mimeType = mime_content_type($fullPath);

        Log::info('gemini.layout_autodetect.started', ['image' => $imagePath, 'gridSize' => $gridSize]);

        $promptText = "You are an expert architectural floor plan analyzer. Analyze this 2D floor plan image with extreme precision and map it onto a {$gridSize}x{$gridSize} grid matrix.

ANALYSIS INSTRUCTIONS:
1. First identify the EXACT shape and proportions of the apartment/unit boundary (it may not be a perfect rectangle).
2. Identify ALL rooms: bedrooms, bathrooms, kitchen, living room, dining area, walk-in closets, storage rooms, patio/balcony, hallways, and entry areas.
3. Identify the EXACT position of every wall segment — both outer boundary walls AND inner partition walls that separate rooms.
4. Identify ALL doors (shown as arcs or gaps in walls) and ALL windows (shown as parallel lines on outer walls).
5. Pay close attention to the relative sizes of rooms — bathrooms and closets are typically much smaller than bedrooms and living rooms.

GRID MAPPING RULES:
- Row 0 = top of the floor plan, Row " . ($gridSize - 1) . " = bottom
- Column 0 = left of the floor plan, Column " . ($gridSize - 1) . " = right
- Scale the floor plan to fill most of the {$gridSize}x{$gridSize} grid, leaving 1-2 cells of margin around the outer boundary.
- Each cell value:
  0 = Empty walkable floor area (inside rooms, hallways)
  1 = Wall (structural walls — must form continuous connected lines, never isolated single cells)
  2 = Window (on outer walls only, where windows appear in the drawing)
  3 = Door (where doors/openings appear — both entrance and internal doors)

CRITICAL ACCURACY REQUIREMENTS:
- Walls MUST form continuous connected lines (no gaps except at doors/windows).
- The outer boundary MUST form a CLOSED perimeter (except at entrance doors and windows).
- Inner partition walls MUST connect to the outer walls to fully enclose each room.
- Room proportions must match the original drawing — if Bedroom 1 is 12'x17' and Bath 1 is 5'x8', the bedroom should occupy roughly 4x the grid area of the bathroom.
- Every room visible in the floor plan must appear as a distinct enclosed space in the grid.
- Areas OUTSIDE the apartment boundary should be 0 (empty).

Return a JSON object with a 'grid' key containing the {$gridSize}x{$gridSize} 2D integer array.";

        $chatModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
        $response = null;
        $lastError = '';
        $maxRetries = 2; // retry each model up to 2 times

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'grid' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'ARRAY',
                        'items' => [
                            'type' => 'INTEGER'
                        ]
                    ]
                ]
            ],
            'required' => ['grid']
        ];

        foreach ($chatModels as $model) {
            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                Log::info("gemini.layout_autodetect.trying_model", ['model' => $model, 'attempt' => $attempt]);
                $response = Http::timeout(180)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $this->apiKey, [
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
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $schema
                    ]
                ]);

                if ($response->successful()) {
                    break 2; // break both loops
                }

                $lastError = $response->json('error.message') ?? 'Unknown error';
                Log::warning("gemini.layout_autodetect.model_failed", ['model' => $model, 'attempt' => $attempt, 'error' => $lastError]);

                // If rate limited or high demand, wait before retry
                if (str_contains(strtolower($lastError), 'high demand') || 
                    str_contains(strtolower($lastError), 'rate limit') ||
                    str_contains(strtolower($lastError), '429') ||
                    $response->status() === 429 || $response->status() === 503) {
                    Log::info("gemini.layout_autodetect.waiting_before_retry", ['seconds' => 5 * $attempt]);
                    sleep(5 * $attempt); // Wait 5s, then 10s
                } else {
                    break; // Non-retryable error, try next model
                }
            }
        }

        if (!$response || !$response->successful()) {
            Log::error('gemini.layout_autodetect.all_models_failed', ['error' => $lastError]);

            if (str_contains(strtolower($lastError), 'api key not valid') || str_contains(strtolower($lastError), 'expired') || str_contains(strtolower($lastError), 'key not')) {
                throw new \RuntimeException(
                    "Gemini API key is invalid or expired. Please update GEMINI_API_KEY in your .env file with a valid key from https://aistudio.google.com/app/apikey\n" .
                    "مفتاح Gemini API غير صالح أو منتهي الصلاحية. يرجى تحديث المفتاح في ملف .env"
                );
            }

            throw new \RuntimeException("Gemini layout detection failed: " . $lastError);
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        $data = json_decode($text, true);

        if (empty($data) || !isset($data['grid'])) {
            if (preg_match('/\{[\s\S]*\}/', $text, $matches)) {
                $data = json_decode($matches[0], true);
            }
        }

        if (empty($data) || !isset($data['grid']) || !is_array($data['grid'])) {
            Log::error('gemini.layout_autodetect.invalid_json', ['text' => $text]);
            throw new \RuntimeException(
                "Failed to parse structural layout grid from Gemini response.\n" .
                "فشل في تحليل شبكة المخطط من استجابة Gemini"
            );
        }

        // Normalize the grid to exactly $gridSize x $gridSize
        $detectedGrid = $data['grid'];
        $normalizedGrid = [];
        for ($r = 0; $r < $gridSize; $r++) {
            $row = [];
            for ($c = 0; $c < $gridSize; $c++) {
                $val = $detectedGrid[$r][$c] ?? 0;
                // Clamp values to valid range 0-3
                $row[] = max(0, min(3, (int)$val));
            }
            $normalizedGrid[] = $row;
        }

        // Validate: check that there are some walls detected (not an empty/all-zero grid)
        $wallCount = 0;
        foreach ($normalizedGrid as $row) {
            foreach ($row as $cell) {
                if ($cell === 1) $wallCount++;
            }
        }

        if ($wallCount < 10) {
            Log::warning('gemini.layout_autodetect.too_few_walls', ['wall_count' => $wallCount]);
            throw new \RuntimeException(
                "AI detected too few walls ({$wallCount}). The floor plan image may be unclear or too complex. Please try with a clearer image.\n" .
                "اكتشف الذكاء الاصطناعي عدداً قليلاً جداً من الجدران. يرجى استخدام صورة أوضح للمخطط."
            );
        }

        Log::info('gemini.layout_autodetect.success', [
            'image' => $imagePath,
            'walls' => $wallCount,
            'grid_rows' => count($normalizedGrid),
            'grid_cols' => count($normalizedGrid[0] ?? [])
        ]);

        return $normalizedGrid;
    }

    /**
     * Generate a procedural mock 2D apartment floor plan grid layout.
     */
    protected function generateMockGrid(int $gridSize): array
    {
        // Initialize grid with 0s
        $grid = array_fill(0, $gridSize, array_fill(0, $gridSize, 0));

        // Let's create a beautiful, standard layout for a 28x28 grid
        if ($gridSize === 28) {
            // 1. Draw Outer Walls
            for ($c = 2; $c <= 25; $c++) {
                $grid[2][$c] = 1;  // Top Wall
                $grid[25][$c] = 1; // Bottom Wall
            }
            for ($r = 2; $r <= 25; $r++) {
                $grid[$r][2] = 1;  // Left Wall
                $grid[$r][25] = 1; // Right Wall
            }

            // 2. Put Outer Windows (value 2) and Entrance Door (value 3)
            $grid[2][8] = 2;   // Top Window 1
            $grid[2][18] = 2;  // Top Window 2
            $grid[12][2] = 2;  // Left Window
            $grid[12][25] = 2; // Right Window
            $grid[25][14] = 3; // Entrance Door (Bottom)

            // 3. Draw Horizontal partition dividing bedrooms (top) and living (bottom) at row 14
            for ($c = 2; $c <= 25; $c++) {
                $grid[14][$c] = 1;
            }
            // Put doors in the horizontal partition
            $grid[14][6] = 3;  // Door to Left Bedroom
            $grid[14][18] = 3; // Door to Right Bedroom
            $grid[14][12] = 0; // Walkway opening

            // 4. Draw Vertical partition dividing Top Left and Top Right bedrooms at col 13
            for ($r = 2; $r <= 14; $r++) {
                $grid[$r][13] = 1;
            }
            $grid[8][13] = 3;  // Inter-connecting door between bedrooms

            // 5. Draw Vertical partition separating Kitchen/Bathroom from Living Area at col 10 (bottom)
            for ($r = 14; $r <= 25; $r++) {
                $grid[$r][10] = 1;
            }
            $grid[18][10] = 3; // Door to kitchen/bathroom area

            // 6. Draw Horizontal partition separating Bathroom (top left bottom part) and Kitchen (bottom left) at row 19
            for ($c = 2; $c <= 10; $c++) {
                $grid[19][$c] = 1;
            }
            $grid[19][5] = 3;  // Door to bathroom
        } else {
            // General grid size fallback: just draw outer walls and center partition
            for ($c = 1; $c < $gridSize - 1; $c++) {
                $grid[1][$c] = 1;
                $grid[$gridSize - 2][$c] = 1;
            }
            for ($r = 1; $r < $gridSize - 1; $r++) {
                $grid[$r][1] = 1;
                $grid[$r][$gridSize - 2] = 1;
            }
            // Entrance
            $grid[$gridSize - 2][(int)($gridSize / 2)] = 3;
            
            // Middle partition
            $mid = (int)($gridSize / 2);
            for ($c = 1; $c < $gridSize - 1; $c++) {
                $grid[$mid][$c] = 1;
            }
            $grid[$mid][(int)($gridSize / 3)] = 3;
        }

        return $grid;
    }
}

