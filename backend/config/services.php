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

];
