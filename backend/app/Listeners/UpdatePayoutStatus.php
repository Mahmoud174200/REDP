<?php

namespace App\Listeners;

use App\Events\ApprovalApproved;
use App\Events\ApprovalRejected;
use App\Models\CommissionPayout;
use App\Models\CommissionCalculation;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class UpdatePayoutStatus
{
    /**
     * Handle ApprovalApproved event.
     */
    public function handleApproved(ApprovalApproved $event): void
    {
        $instance = $event->instance;
        Log::info("UpdatePayoutStatus: Handling Approved approval instance: " . $instance->id);

        if ($instance->entity_type === 'commission_payout') {
            $payout = CommissionPayout::find($instance->entity_id);
            if ($payout) {
                $approverId = null;
                $lastAction = $instance->actions()->where('action', 'approve')->first();
                if ($lastAction) {
                    $approverId = $lastAction->actor_id;
                }

                $payout->update([
                    'status' => 'approved',
                    'approved_by' => $approverId,
                    'approved_at' => now(),
                ]);

                // Update calculations associated with this payout to 'approved'
                CommissionCalculation::where('payout_id', $payout->id)
                    ->update(['status' => 'approved']);

                AuditLogService::log(
                    'COMMISSION_PAYOUT_APPROVED',
                    $instance->requested_by,
                    ['payout_id' => $payout->id, 'approved_by' => $approverId]
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
        Log::info("UpdatePayoutStatus: Handling Rejected approval instance: " . $instance->id);

        if ($instance->entity_type === 'commission_payout') {
            $payout = CommissionPayout::find($instance->entity_id);
            if ($payout) {
                $payout->update(['status' => 'rejected']);

                // Reset calculations associated with this payout back to 'pending' and detach them
                CommissionCalculation::where('payout_id', $payout->id)
                    ->update([
                        'status' => 'pending',
                        'payout_id' => null
                    ]);

                AuditLogService::log(
                    'COMMISSION_PAYOUT_REJECTED',
                    $instance->requested_by,
                    ['payout_id' => $payout->id]
                );
            }
        }
    }
}
