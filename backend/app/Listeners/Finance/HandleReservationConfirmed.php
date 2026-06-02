<?php

namespace App\Listeners\Finance;

use App\Events\ReservationConfirmed;
use App\Models\Contract;
use App\Models\PaymentPlan;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Unit;
use App\Services\AuditLogService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * HandleReservationConfirmed
 * 
 * Listens to: App\Events\ReservationConfirmed (from Acquisition)
 * 
 * When a reservation is confirmed by the acquisition engine, this listener
 * auto-generates a draft contract, payment plan, and individual installment
 * records. This is the core financial pipeline entry point.
 */
class HandleReservationConfirmed
{
    /**
     * Handle the event.
     */
    public function handle(ReservationConfirmed $event): void
    {
        try {
            Log::info('[Finance Listener] ReservationConfirmed received', [
                'reservation_id' => $event->reservationId,
                'unit_id' => $event->unitId,
                'client_id' => $event->clientId,
            ]);

            // 1. Fetch reservation and unit details
            $reservation = Reservation::findOrFail($event->reservationId);
            $unit = Unit::findOrFail($event->unitId);

            // 2. Auto-generate draft contract
            $contract = Contract::create([
                'id' => (string) Str::uuid(),
                'contract_number' => Contract::generateContractNumber(),
                'reservation_id' => $event->reservationId,
                'unit_id' => $event->unitId,
                'client_id' => $event->clientId,
                'total_amount' => $unit->price,
                'paid_amount' => $reservation->eoi_amount, // EOI counts as first payment
                'type' => 'installment',
                'status' => 'draft',
                'notes' => 'Auto-generated from reservation confirmation.',
            ]);

            // 3. Generate payment plan (quarterly installments over 3 years = 12 installments)
            $totalInstallments = 12;
            $remainingAmount = $unit->price - $reservation->eoi_amount;
            $monthlyAmount = round($remainingAmount / $totalInstallments, 2);

            $paymentPlan = PaymentPlan::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract->id,
                'total_installments' => $totalInstallments,
                'unpaid_installments' => $totalInstallments,
                'monthly_amount' => $monthlyAmount,
                'status' => 'active',
                'start_date' => now()->addMonth(),
            ]);

            // 4. Create individual installment payment records
            for ($i = 1; $i <= $totalInstallments; $i++) {
                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $paymentPlan->id,
                    'amount' => $monthlyAmount,
                    'status' => 'pending',
                    'due_date' => now()->addMonths($i * 3), // Quarterly
                    'installment_number' => $i,
                ]);
            }

            // 5. Record the EOI as a paid payment entry
            Payment::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract->id,
                'payment_plan_id' => $paymentPlan->id,
                'amount' => $reservation->eoi_amount,
                'status' => 'paid',
                'paid_at' => now(),
                'due_date' => now(),
                'installment_number' => 0, // EOI = installment 0
                'gateway' => 'eoi_deposit',
                'transaction_reference' => 'EOI-' . $event->reservationId,
            ]);

            // 6. Audit trail
            AuditLogService::log('CONTRACT_AUTO_GENERATED', $event->clientId, [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'unit_id' => $event->unitId,
                'total_amount' => $unit->price,
                'installments' => $totalInstallments,
            ]);

            Log::info('[Finance Listener] Contract and payment plan generated', [
                'contract_id' => $contract->id,
                'payment_plan_id' => $paymentPlan->id,
            ]);

        } catch (\Throwable $e) {
            Log::error('[Finance Listener] Failed to process ReservationConfirmed', [
                'error' => $e->getMessage(),
                'reservation_id' => $event->reservationId,
            ]);
        }
    }
}
