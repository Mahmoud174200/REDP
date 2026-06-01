<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'platform' => 'REDP — Real Estate Digital Platform',
        'api_documentation' => '/api',
        'status' => 'Healthy',
        'timestamp' => now()->toIso8601String()
    ]);
});
