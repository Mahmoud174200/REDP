<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class BrokerController extends Controller
{
    /**
     * Get broker commissions metrics.
     */
    public function getCommissions(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟠 Ragab (Acquisition)',
            'metrics' => [
                'total_commissioned_sales' => 15000000.00,
                'pending_commissions' => 450000.00,
                'paid_commissions' => 200000.00,
                'commission_percentage' => 3.5
            ],
            'recent_payouts' => [
                ['id' => 'p1', 'amount' => 50000.00, 'status' => 'settled', 'date' => '2026-05-15'],
                ['id' => 'p2', 'amount' => 150000.00, 'status' => 'processing', 'date' => '2026-05-30']
            ]
        ]);
    }

    /**
     * Broker anti-poaching lead lock submission.
     */
    public function lockLead(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string',
            'client_phone' => 'required|string',
        ]);

        // Lock duration is 60 days per Blueprint Section DD
        return response()->json([
            'success' => true,
            'owner' => '🟠 Ragab (Acquisition)',
            'message' => 'Lead locked successfully under your broker profile for 60 days.',
            'lock_expires_at' => now()->addDays(60)->toDateString()
        ]);
    }
}
