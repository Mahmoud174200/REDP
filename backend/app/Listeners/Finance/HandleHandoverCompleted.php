<?php

namespace App\Listeners\Finance;

use App\Models\Contract;
use App\Models\CollectionsQueue;
use App\Services\AuditLogService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * HandleHandoverCompleted
 * 
 * Listens to: handover_completed event (from Mahmoud — Delivery)
 * 
 * When a unit handover quality check passes, this listener runs a final
 * financial settlement check: verifies all payments are complete, flags
 * outstanding amounts to the collections queue, and marks the contract
 * as 'completed' if fully paid.
 */
class HandleHandoverCompleted
{
    /**
     * Handle the event.
     * 
     * The event object must have: contractId, unitId
     */
    public function handle($event): void
    {
        try {
            Log::info('[Finance Listener] HandoverCompleted received', [
                'unit_id' => $event->unitId ?? 'N/A',
            ]);

            // Find the contract associated with this unit
            $contract = Contract::where('unit_id', $event->unitId ?? null)->first();

            if (!$contract) {
                Log::warning('[Finance Listener] No contract found for handover unit', [
                    'unit_id' => $event->unitId ?? 'N/A',
                ]);
                return;
            }

            // Check if all payments are complete
            $outstandingAmount = $contract->outstanding_amount;

            if ($outstandingAmount <= 0) {
                // All paid — mark contract as completed
                $contract->update(['status' => 'completed']);

                AuditLogService::log('CONTRACT_COMPLETED', $contract->client_id, [
                    'contract_id' => $contract->id,
                    'total_amount' => $contract->total_amount,
                    'trigger' => 'handover_completed',
                ]);

                Log::info('[Finance Listener] Contract marked as completed', [
                    'contract_id' => $contract->id,
                ]);
            } else {
                // Outstanding balance exists — flag to collections
                CollectionsQueue::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'client_id' => $contract->client_id,
                    'aging_bucket' => '30_days',
                    'outstanding_amount' => $outstandingAmount,
                    'status' => 'active',
                    'notes' => 'Flagged during handover completion — outstanding balance detected.',
                ]);

                AuditLogService::log('COLLECTIONS_FLAGGED', $contract->client_id, [
                    'contract_id' => $contract->id,
                    'outstanding_amount' => $outstandingAmount,
                    'trigger' => 'handover_completed',
                ]);

                Log::warning('[Finance Listener] Outstanding balance flagged to collections', [
                    'contract_id' => $contract->id,
                    'outstanding_amount' => $outstandingAmount,
                ]);
            }

        } catch (\Throwable $e) {
            Log::error('[Finance Listener] Failed to process HandoverCompleted', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
