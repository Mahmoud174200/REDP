<?php

namespace App\Listeners\Acquisition;

use App\Events\PaymentReceived;
use App\Models\Commission;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Listener: HandlePaymentReceived
 *
 * Consumes Finance domain's PaymentReceived event.
 * Updates broker commission statuses when payments are processed.
 * ─────────────────────────────────────────────────────────
 */
class HandlePaymentReceived implements ShouldQueue
{
    public function handle(PaymentReceived $event): void
    {
        Log::info('[Acquisition] Handling PaymentReceived event', [
            'payment_id' => $event->paymentId ?? null,
            'contract_id' => $event->contractId ?? null,
        ]);

        // When a payment is received, check if there are pending commissions
        // linked to the same contract/unit and advance them to 'approved'
        if (isset($event->contractId)) {
            $commissions = Commission::where('status', Commission::STATUS_PENDING)
                ->whereHas('lead', function ($query) use ($event) {
                    $query->where('status', 'contracted');
                })
                ->get();

            foreach ($commissions as $commission) {
                $commission->update(['status' => Commission::STATUS_APPROVED]);

                Log::info('[Acquisition] Commission approved after payment received', [
                    'commission_id' => $commission->id,
                    'broker_id'     => $commission->broker_id,
                    'amount'        => $commission->gross_amount,
                ]);
            }
        }
    }
}
