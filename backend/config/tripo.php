<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tripo AI API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating with Tripo AI's 3D model generation API.
    | Get your API key from: https://platform.tripo3d.ai
    |
    */

    'api_key' => env('TRIPO_API_KEY', ''),

    'base_url' => env('TRIPO_BASE_URL', 'https://api.tripo3d.ai/v2/openapi'),

    'model_version' => env('TRIPO_MODEL_VERSION', 'v2.5-20250123'),

    // HTTP timeout in seconds for API calls
    'timeout' => 120,

    // Seconds between status poll checks
    'poll_interval' => 60,

    // Maximum number of polling attempts (30 × 60s = 30 min max wait)
    'max_polls' => 30,
];
