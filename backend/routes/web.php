<?php

use Illuminate\Support\Facades\Route;

/**
 * Live handover-timeline document. Rendered on-demand from current DB state so
 * it always reflects the real handover status (no stale cached file). Keyed by
 * the contract UUID (unguessable) and opened in a new browser tab from the
 * owner's portal Vault, so it sits outside the API auth middleware.
 */
Route::get('/handover-timeline/{contract}', function (string $contract) {
    $model = \App\Models\Contract::find($contract);
    abort_if(!$model, 404, 'Handover timeline not found.');

    return response(\App\Services\HandoverTimelineService::buildHtml($model))
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
})->name('handover.timeline');

Route::get('/', function () {
    return response()->json([
        'platform' => 'REDP — Real Estate Digital Platform',
        'api_documentation' => '/api',
        'status' => 'Healthy',
        'timestamp' => now()->toIso8601String()
    ]);
});
