<?php

namespace App\Listeners;

use App\Events\ApprovalApproved;
use App\Events\ApprovalRejected;
use App\Models\Contract;
use App\Models\Unit;
use App\Events\ContractSigned;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class UpdateContractApprovalStatus
{
    /**
     * Handle ApprovalApproved event.
     */
    public function handleApproved(ApprovalApproved $event): void
    {
        $instance = $event->instance;
        Log::info("UpdateContractApprovalStatus: Handling Approved approval instance: " . $instance->id);

        if ($instance->entity_type === 'contract') {
            $contract = Contract::find($instance->entity_id);
            if ($contract) {
                $contract->update([
                    'status' => 'active',
                    'signed_at' => now(),
                ]);

                if ($contract->unit_id) {
                    Unit::where('id', $contract->unit_id)->update(['status' => 'sold']);
                }

                // Emit Decoupled event to notify other modules
                event(new ContractSigned(
                    $contract->id,
                    $contract->client_id,
                    $contract->unit_id,
                    $contract->reservation_id
                ));

                AuditLogService::log(
                    'CONTRACT_APPROVED',
                    $instance->requested_by,
                    ['contract_id' => $contract->id, 'contract_number' => $contract->contract_number]
                );
            }
        }
    }

    /**
     * Handle ApprovalRejected event.
     */
    public function handleRejected(ApprovalRejected $event): void
    {
        $instance = $event->instance;
        Log::info("UpdateContractApprovalStatus: Handling Rejected approval instance: " . $instance->id);

        if ($instance->entity_type === 'contract') {
            $contract = Contract::find($instance->entity_id);
            if ($contract) {
                // Set status back to draft so sales rep can modify and resubmit
                $contract->update(['status' => 'draft']);

                AuditLogService::log(
                    'CONTRACT_REJECTED',
                    $instance->requested_by,
                    ['contract_id' => $contract->id, 'contract_number' => $contract->contract_number]
                );
            }
        }
    }
}
