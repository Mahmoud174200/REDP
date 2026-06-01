<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HandoverController extends Controller
{
    /**
     * Get inspection checklist for a unit.
     */
    public function getChecklist(Request $request, string $unitId)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'message' => 'Quality Control Snagging checklist template.',
            'checklist' => [
                ['id' => 'ch1', 'item' => 'Verify wall paint and smooth plastering', 'passed' => false],
                ['id' => 'ch2', 'item' => 'Inspect plumbing drainage and tap flows', 'passed' => false],
                ['id' => 'ch3', 'item' => 'Check electric sockets and breaker panels', 'passed' => false]
            ]
        ]);
    }

    /**
     * Log a new snag/defect on a unit inspection.
     */
    public function reportSnag(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'message' => 'Snag defect registered successfully.',
            'todo' => 'Mahmoud to integrate camera upload and photo markup tools here.'
        ]);
    }
}
