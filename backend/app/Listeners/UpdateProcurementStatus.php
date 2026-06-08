<?php

namespace App\Listeners;

use App\Events\ApprovalApproved;
use App\Events\ApprovalRejected;
use App\Models\PurchaseRequest;
use App\Models\PurchaseOrder;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class UpdateProcurementStatus
{
    /**
     * Handle ApprovalApproved event.
     */
    public function handleApproved(ApprovalApproved $event): void
    {
        $instance = $event->instance;
        Log::info("UpdateProcurementStatus: Handling Approved approval instance: " . $instance->id);

        if ($instance->entity_type === 'purchase_request') {
            $pr = PurchaseRequest::find($instance->entity_id);
            if ($pr) {
                $pr->update(['status' => 'approved']);
                AuditLogService::log(
                    'PURCHASE_REQUEST_APPROVED',
                    $instance->requested_by,
                    ['purchase_request_id' => $pr->id]
                );
            }
        } elseif ($instance->entity_type === 'purchase_order') {
            $po = PurchaseOrder::find($instance->entity_id);
            if ($po) {
                $approverId = null;
                $lastApprovalAction = $instance->actions()
                    ->where('action', 'approve')
                    ->first();
                if ($lastApprovalAction) {
                    $approverId = $lastApprovalAction->actor_id;
                }

                $po->update([
                    'status' => 'approved',
                    'approved_by' => $approverId,
                    'approved_at' => now(),
                ]);
                AuditLogService::log(
                    'PURCHASE_ORDER_APPROVED',
                    $instance->requested_by,
                    ['purchase_order_id' => $po->id, 'approved_by' => $approverId]
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
        Log::info("UpdateProcurementStatus: Handling Rejected approval instance: " . $instance->id);

        if ($instance->entity_type === 'purchase_request') {
            $pr = PurchaseRequest::find($instance->entity_id);
            if ($pr) {
                $pr->update(['status' => 'rejected']);
                AuditLogService::log(
                    'PURCHASE_REQUEST_REJECTED',
                    $instance->requested_by,
                    ['purchase_request_id' => $pr->id]
                );
            }
        } elseif ($instance->entity_type === 'purchase_order') {
            $po = PurchaseOrder::find($instance->entity_id);
            if ($po) {
                $po->update(['status' => 'rejected']);
                AuditLogService::log(
                    'PURCHASE_ORDER_REJECTED',
                    $instance->requested_by,
                    ['purchase_order_id' => $po->id]
                );
            }
        }
    }
}
