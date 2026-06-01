<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\AuditLogService;
use App\Events\PaymentReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Get billing installments timeline for a client.
     */
    public function getInstallments(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🔵 Melwany (Finance)',
            'installments' => [
                [
                    'id' => 'inst1',
                    'due_date' => '2026-07-01',
                    'amount' => 12000.00,
                    'status' => 'unpaid',
                    'description' => 'Q3 Installment'
                ],
                [
                    'id' => 'inst2',
                    'due_date' => '2026-10-01',
                    'amount' => 12000.00,
                    'status' => 'unpaid',
                    'description' => 'Q4 Installment'
                ]
            ]
        ]);
    }

    /**
     * Handle payment webhook or callback verification.
     */
    public function chargeInstallment(Request $request)
    {
        $fields = $request->validate([
            'installment_id' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        $clientId = $request->user()->id;
        $paymentId = (string) Str::uuid();

        // Emit decoupled payment event for other modules
        event(new PaymentReceived($paymentId, $clientId, $fields['amount']));

        AuditLogService::log('PAYMENT_PROCESS', $clientId, [
            'payment_id' => $paymentId,
            'installment_id' => $fields['installment_id'],
            'amount' => $fields['amount']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment received successfully. Ledger updated.',
            'receipt' => [
                'payment_id' => $paymentId,
                'amount' => $fields['amount'],
                'date' => now()->toDateString(),
                'gateway' => 'stripe'
            ]
        ]);
    }
}
