<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    // ── Google Gemini (AI Assistant / Chatbot) ──
    'gemini' => [
        'key'   => env('GEMINI_API_KEY'),
        // Any current Gemini model that supports function calling, e.g.
        // gemini-2.5-flash, gemini-2.5-pro, gemini-flash-latest
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
        // Embedding model + output dimensionality for the RAG knowledge base.
        'embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
        'embedding_dims' => (int) env('GEMINI_EMBEDDING_DIMS', 768),
        // Native-audio model for the real-time voice (Gemini Live API).
        'live_model' => env('GEMINI_LIVE_MODEL', 'gemini-2.5-flash-native-audio-latest'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
    ],

    // ── Photoreal talking-head video for the customer character "Nour" ──
    'avatar_video' => [
        'provider' => env('AVATAR_VIDEO_PROVIDER', 'heygen'), // heygen | did
    ],

    // HeyGen (Video Generation API — needs an API-enabled plan)
    'heygen' => [
        'key' => env('HEYGEN_API_KEY'),
        'avatar_id' => env('HEYGEN_AVATAR_ID', 'Daisy-inskirt-20220818'),
        'character_type' => env('HEYGEN_CHARACTER_TYPE', ''), // avatar | talking_photo | '' (auto-try both)
        'voice_id' => env('HEYGEN_VOICE_ID', ''),     // English female voice id (HeyGen)
        'voice_ar' => env('HEYGEN_VOICE_AR', ''),     // Arabic female voice id (optional)
    ],

    // D-ID (alternative provider)
    'did' => [
        'key' => env('DID_API_KEY'),
        'source_url' => env('DID_SOURCE_URL', 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg'),
        'voice_en' => env('DID_VOICE_EN', 'en-US-JennyNeural'),
        'voice_ar' => env('DID_VOICE_AR', 'ar-EG-SalmaNeural'),
    ],

];
