<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Services\CommissionService;
use Illuminate\Support\Facades\Log;

class CalculateCommissions
{
    protected CommissionService $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    /**
     * Handle the event.
     */
    public function handle(PaymentReceived $event): void
    {
        Log::info("CalculateCommissions: Handling PaymentReceived event for payment: " . $event->paymentId);
        try {
            $this->commissionService->calculateCommissionsForPayment($event->paymentId);
        } catch (\Exception $e) {
            Log::error("CalculateCommissions: Error calculating commissions: " . $e->getMessage());
        }
    }
}
