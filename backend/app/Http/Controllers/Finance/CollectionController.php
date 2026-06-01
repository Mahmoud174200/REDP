<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\CollectionsQueue;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentPlan;
use App\Models\Cancellation;
use App\Models\ReschedulingRequest;
use App\Services\AuditLogService;
use App\Events\Finance\CancellationProcessed;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    /**
     * Get collections queue with aging buckets.
     * Blueprint H.13 Rescheduling, H.14 Aging debts, H.15 Cancellation
     */
    public function getQueue(Request $request)
    {
        $query = CollectionsQueue::with(['contract.client', 'contract.unit']);

        if ($request->has('bucket') && $request->bucket !== 'all') {
            $query->bucket($request->bucket);
        }
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $items = $query->active()->latest()->get();

        // Summary by aging bucket
        $bucketSummary = [
            '30_days' => [
                'count' => CollectionsQueue::active()->bucket('30_days')->count(),
                'total' => (float) CollectionsQueue::active()->bucket('30_days')->sum('outstanding_amount'),
            ],
            '60_days' => [
                'count' => CollectionsQueue::active()->bucket('60_days')->count(),
                'total' => (float) CollectionsQueue::active()->bucket('60_days')->sum('outstanding_amount'),
            ],
            '90_days_plus' => [
                'count' => CollectionsQueue::active()->bucket('90_days_plus')->count(),
                'total' => (float) CollectionsQueue::active()->bucket('90_days_plus')->sum('outstanding_amount'),
            ],
        ];

        $totalOutstanding = (float) CollectionsQueue::active()->sum('outstanding_amount');

        return response()->json([
            'success' => true,
            'owner' => '🔵 Melwany (Finance)',
            'data' => $items,
            'buckets' => $bucketSummary,
            'total_outstanding' => $totalOutstanding,
        ]);
    }

    /**
     * Record a promise-to-pay date.
     */
    public function recordPromiseToPay(Request $request, string $id)
    {
        $request->validate([
            'promise_date' => 'required|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $item = CollectionsQueue::findOrFail($id);
        $item->update([
            'status' => 'promised',
            'promise_to_pay_date' => $request->promise_date,
            'notes' => $request->notes ?? $item->notes,
        ]);

        AuditLogService::log('PROMISE_TO_PAY', $request->user()->id, [
            'collection_id' => $id,
            'promise_date' => $request->promise_date,
            'contract_id' => $item->contract_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Promise-to-pay date recorded.',
            'item' => $item->fresh(),
        ]);
    }

    /**
     * Submit a rescheduling request.
     * Blueprint H.13 — Rescheduling scheduler
     */
    public function reschedule(Request $request, string $contractId)
    {
        $request->validate([
            'reason' => 'required|string|min:10',
            'proposed_installments_count' => 'required|integer|min:1|max:120',
        ]);

        $contract = Contract::with('paymentPlan')->findOrFail($contractId);
        $outstanding = $contract->outstanding_amount;
        $proposedMonthly = round($outstanding / $request->proposed_installments_count, 2);

        $reschedule = ReschedulingRequest::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contractId,
            'reason' => $request->reason,
            'current_installments' => $contract->paymentPlan->total_installments ?? 0,
            'proposed_installments_count' => $request->proposed_installments_count,
            'proposed_monthly_amount' => $proposedMonthly,
            'status' => 'pending',
        ]);

        AuditLogService::log('RESCHEDULE_REQUESTED', $request->user()->id, [
            'contract_id' => $contractId,
            'proposed_installments' => $request->proposed_installments_count,
            'proposed_monthly' => $proposedMonthly,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rescheduling request submitted for review.',
            'request' => $reschedule,
        ], 201);
    }

    /**
     * Approve a rescheduling request and restructure the payment plan.
     */
    public function approveReschedule(Request $request, string $id)
    {
        $reschedule = ReschedulingRequest::findOrFail($id);

        if ($reschedule->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been processed.',
            ], 400);
        }

        $contract = Contract::with('paymentPlan')->findOrFail($reschedule->contract_id);

        // Cancel old pending payments
        Payment::where('contract_id', $contract->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        // Update payment plan
        $paymentPlan = $contract->paymentPlan;
        if ($paymentPlan) {
            $paymentPlan->update([
                'total_installments' => $reschedule->proposed_installments_count,
                'unpaid_installments' => $reschedule->proposed_installments_count,
                'monthly_amount' => $reschedule->proposed_monthly_amount,
                'status' => 'rescheduled',
            ]);
        }

        // Generate new payment entries
        for ($i = 1; $i <= $reschedule->proposed_installments_count; $i++) {
            Payment::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract->id,
                'payment_plan_id' => $paymentPlan->id ?? null,
                'amount' => $reschedule->proposed_monthly_amount,
                'status' => 'pending',
                'due_date' => now()->addMonths($i * 3),
                'installment_number' => $i,
            ]);
        }

        // Approve the request
        $reschedule->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        AuditLogService::log('RESCHEDULE_APPROVED', $request->user()->id, [
            'reschedule_id' => $id,
            'contract_id' => $contract->id,
            'new_installments' => $reschedule->proposed_installments_count,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment plan rescheduled successfully. New installments generated.',
            'request' => $reschedule->fresh(),
        ]);
    }

    /**
     * Process contract cancellation with penalty calculation.
     * Blueprint H.15 — Cancellation processor
     */
    public function processCancellation(Request $request, string $contractId)
    {
        $request->validate([
            'reason' => 'required|string|min:10',
            'penalty_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $contract = Contract::findOrFail($contractId);

        if ($contract->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Contract is already cancelled.',
            ], 400);
        }

        $penaltyPercentage = $request->penalty_percentage ?? 10; // Default 10% penalty
        $paidAmount = (float) $contract->paid_amount;
        $penaltyAmount = round($paidAmount * ($penaltyPercentage / 100), 2);
        $refundAmount = round($paidAmount - $penaltyAmount, 2);

        // Create cancellation record
        $cancellation = Cancellation::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contractId,
            'reason' => $request->reason,
            'refund_amount' => max(0, $refundAmount),
            'penalty_amount' => $penaltyAmount,
            'penalty_percentage' => $penaltyPercentage,
            'status' => 'processed',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        // Update contract
        $contract->update(['status' => 'cancelled']);

        // Cancel pending payments
        Payment::where('contract_id', $contractId)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        // Cancel payment plan
        PaymentPlan::where('contract_id', $contractId)->update(['status' => 'cancelled']);

        // Release the unit
        if ($contract->unit_id) {
            \App\Models\Unit::where('id', $contract->unit_id)->update(['status' => 'available']);
        }

        // Resolve any collection entries
        CollectionsQueue::where('contract_id', $contractId)
            ->where('status', '!=', 'resolved')
            ->update(['status' => 'resolved']);

        // Emit cancellation event
        event(new CancellationProcessed($contractId, $cancellation->id, $refundAmount, $penaltyAmount));

        AuditLogService::log('CANCELLATION_PROCESSED', $request->user()->id, [
            'contract_id' => $contractId,
            'cancellation_id' => $cancellation->id,
            'refund' => $refundAmount,
            'penalty' => $penaltyAmount,
            'penalty_rate' => $penaltyPercentage . '%',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract cancellation processed. Unit released. Refund calculated.',
            'cancellation' => $cancellation,
            'financial_summary' => [
                'total_paid' => $paidAmount,
                'penalty_percentage' => $penaltyPercentage . '%',
                'penalty_amount' => $penaltyAmount,
                'net_refund' => max(0, $refundAmount),
            ],
        ]);
    }

    /**
     * Get aging debt analysis report.
     * Blueprint H.14 — Aging debts
     */
    public function getAgingReport()
    {
        $overduePayments = Payment::where('status', 'pending')
            ->where('due_date', '<', now())
            ->with(['contract.client', 'contract.unit'])
            ->get();

        $buckets = [
            '0_30' => ['count' => 0, 'amount' => 0, 'items' => []],
            '31_60' => ['count' => 0, 'amount' => 0, 'items' => []],
            '61_90' => ['count' => 0, 'amount' => 0, 'items' => []],
            '90_plus' => ['count' => 0, 'amount' => 0, 'items' => []],
        ];

        foreach ($overduePayments as $payment) {
            $daysOverdue = $payment->due_date->diffInDays(now());
            $bucket = match (true) {
                $daysOverdue <= 30 => '0_30',
                $daysOverdue <= 60 => '31_60',
                $daysOverdue <= 90 => '61_90',
                default => '90_plus',
            };

            $buckets[$bucket]['count']++;
            $buckets[$bucket]['amount'] += (float) $payment->amount;
            $buckets[$bucket]['items'][] = [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'due_date' => $payment->due_date->toDateString(),
                'days_overdue' => $daysOverdue,
                'client_name' => $payment->contract->client->name ?? 'N/A',
                'unit_number' => $payment->contract->unit->unit_number ?? 'N/A',
            ];
        }

        return response()->json([
            'success' => true,
            'owner' => '🔵 Melwany (Finance)',
            'total_overdue' => (float) $overduePayments->sum('amount'),
            'total_overdue_count' => $overduePayments->count(),
            'aging_buckets' => $buckets,
        ]);
    }
}
