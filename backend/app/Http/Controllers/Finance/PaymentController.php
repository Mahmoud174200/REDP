<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\PaymentPlan;
use App\Services\AuditLogService;
use App\Events\PaymentReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Get installment schedule for a specific contract.
     * Blueprint H.3 — Payment gateway hooks
     */
    public function getInstallments(string $contractId)
    {
        $contract = Contract::with(['paymentPlan', 'payments' => function ($q) {
            $q->orderBy('installment_number');
        }, 'unit', 'client'])->findOrFail($contractId);

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'contract' => $contract,
            'installments' => $contract->payments,
            'payment_plan' => $contract->paymentPlan,
        ]);
    }

    /**
     * Charge an installment payment.
     * Blueprint H.3 — Stripe/Fawry callbacks, ERP logging
     */
    public function chargeInstallment(Request $request)
    {
        $fields = $request->validate([
            'payment_id' => 'required|string|exists:payments,id',
            'amount' => 'required|numeric|min:1',
            'gateway' => 'nullable|string|in:stripe,fawry,bank_transfer,cash',
        ]);

        $payment = Payment::findOrFail($fields['payment_id']);

        if ($payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This installment has already been paid.',
            ], 400);
        }

        $clientId = $request->user()->id;
        $transactionRef = strtoupper(Str::random(16));
        $gateway = $fields['gateway'] ?? 'stripe';

        // Process payment
        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'gateway' => $gateway,
            'transaction_reference' => $transactionRef,
            'amount' => $fields['amount'],
        ]);

        // Update payment plan unpaid count
        $paymentPlan = $payment->paymentPlan;
        if ($paymentPlan) {
            $paymentPlan->decrement('unpaid_installments');
            if ($paymentPlan->unpaid_installments <= 0) {
                $paymentPlan->update(['status' => 'completed']);
            }
        }

        // Update contract paid amount
        $contract = $payment->contract;
        if ($contract) {
            $contract->increment('paid_amount', $fields['amount']);
            if ($contract->isPaid()) {
                $contract->update(['status' => 'completed']);
            }
        }

        // Emit decoupled payment event for other modules
        event(new PaymentReceived(
            $payment->id,
            $clientId,
            $fields['amount'],
            $contract->id ?? null,
            $payment->installment_number,
            $gateway,
            $transactionRef
        ));

        AuditLogService::log('PAYMENT_PROCESS', $clientId, [
            'payment_id' => $payment->id,
            'amount' => $fields['amount'],
            'gateway' => $gateway,
            'transaction_ref' => $transactionRef,
            'installment_number' => $payment->installment_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment received successfully. Ledger updated.',
            'receipt' => [
                'payment_id' => $payment->id,
                'amount' => $fields['amount'],
                'date' => now()->toDateString(),
                'gateway' => $gateway,
                'transaction_reference' => $transactionRef,
                'installment_number' => $payment->installment_number,
            ],
        ]);
    }

    /**
     * Get complete payment history for a contract.
     */
    public function getPaymentHistory(string $contractId)
    {
        $payments = Payment::where('contract_id', $contractId)
            ->orderBy('installment_number')
            ->get();

        $totalPaid = $payments->where('status', 'paid')->sum('amount');
        $totalPending = $payments->where('status', 'pending')->sum('amount');
        $overdue = $payments->filter(fn($p) => $p->isOverdue())->count();

        return response()->json([
            'success' => true,
            'payments' => $payments,
            'summary' => [
                'total_paid' => (float) $totalPaid,
                'total_pending' => (float) $totalPending,
                'overdue_count' => $overdue,
                'total_payments' => $payments->count(),
                'paid_count' => $payments->where('status', 'paid')->count(),
            ],
        ]);
    }

    /**
     * Get financial dashboard KPIs.
     */
    public function getDashboard()
    {
        $totalRevenue = Payment::where('status', 'paid')->sum('amount');
        $pendingAmount = Payment::where('status', 'pending')->sum('amount');
        $overduePayments = Payment::where('status', 'pending')
            ->where('due_date', '<', now())
            ->get();
        $overdueAmount = $overduePayments->sum('amount');

        $thisMonthRevenue = Payment::where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $lastMonthRevenue = Payment::where('status', 'paid')
            ->whereMonth('paid_at', now()->subMonth()->month)
            ->whereYear('paid_at', now()->subMonth()->year)
            ->sum('amount');

        $activeContracts = Contract::active()->count();
        $completedContracts = Contract::where('status', 'completed')->count();

        // Recent payments
        $recentPayments = Payment::where('status', 'paid')
            ->with('contract.client')
            ->latest('paid_at')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'dashboard' => [
                'total_revenue' => (float) $totalRevenue,
                'pending_amount' => (float) $pendingAmount,
                'overdue_amount' => (float) $overdueAmount,
                'overdue_count' => $overduePayments->count(),
                'this_month_revenue' => (float) $thisMonthRevenue,
                'last_month_revenue' => (float) $lastMonthRevenue,
                'month_over_month_change' => $lastMonthRevenue > 0
                    ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                    : 0,
                'active_contracts' => $activeContracts,
                'completed_contracts' => $completedContracts,
            ],
            'recent_payments' => $recentPayments,
        ]);
    }

    /**
     * Payment gateway webhook handler.
     * Blueprint H.3 — Stripe/Fawry callbacks
     */
    public function webhookCallback(Request $request, string $gateway)
    {
        // Log the incoming webhook for debugging
        AuditLogService::log('WEBHOOK_RECEIVED', null, [
            'gateway' => $gateway,
            'payload' => $request->all(),
        ]);

        // Gateway-specific processing placeholder
        switch ($gateway) {
            case 'stripe':
                // Verify Stripe signature and process event
                return response()->json(['success' => true, 'message' => 'Stripe webhook received']);
            case 'fawry':
                // Verify Fawry callback hash and process
                return response()->json(['success' => true, 'message' => 'Fawry callback received']);
            default:
                return response()->json(['success' => false, 'message' => 'Unknown gateway'], 400);
        }
    }
}
