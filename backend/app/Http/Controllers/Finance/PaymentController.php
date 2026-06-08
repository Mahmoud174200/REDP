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
        self::applyOverduePenalties();
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
        self::applyOverduePenalties();
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
        self::applyOverduePenalties();
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

        // Calculate Cash vs Bank balances
        $cashBalance = Payment::where('status', 'paid')
            ->where('gateway', 'cash')
            ->sum('amount');
        $bankBalance = Payment::where('status', 'paid')
            ->where('gateway', '!=', 'cash')
            ->sum('amount');

        // Recent payments
        $recentPayments = Payment::where('status', 'paid')
            ->with('contract.client')
            ->latest('paid_at')
            ->take(10)
            ->get();

        // Expected collections
        $thisMonthExpected = Payment::where('status', 'pending')
            ->whereMonth('due_date', now()->month)
            ->whereYear('due_date', now()->year)
            ->sum('amount');

        $nextMonthExpected = Payment::where('status', 'pending')
            ->whereMonth('due_date', now()->addMonth()->month)
            ->whereYear('due_date', now()->addMonth()->year)
            ->sum('amount');

        $thisYearExpected = Payment::where('status', 'pending')
            ->whereYear('due_date', now()->year)
            ->sum('amount');

        // Compounds and units breakdown (H.3 / Outstanding collection segmentation)
        $contracts = Contract::with(['client', 'unit.project'])
            ->whereIn('status', ['active', 'pending_signature', 'completed'])
            ->get();

        $compoundStats = [];
        foreach ($contracts as $contract) {
            $projectName = $contract->unit->project->name ?? 'External Project / Landmark';
            $clientName = $contract->client->name ?? 'N/A';
            $unitNumber = $contract->unit->unit_number ?? 'N/A';
            
            $total = (float) $contract->total_amount;
            $paid = (float) $contract->paid_amount;
            $outstanding = max(0.0, $total - $paid);

            if (!isset($compoundStats[$projectName])) {
                $compoundStats[$projectName] = [
                    'project_name' => $projectName,
                    'total_contracts' => 0,
                    'total_amount' => 0.0,
                    'paid_amount' => 0.0,
                    'outstanding' => 0.0,
                    'units' => [],
                ];
            }

            $compoundStats[$projectName]['total_contracts']++;
            $compoundStats[$projectName]['total_amount'] += $total;
            $compoundStats[$projectName]['paid_amount'] += $paid;
            $compoundStats[$projectName]['outstanding'] += $outstanding;

            $compoundStats[$projectName]['units'][] = [
                'unit_number' => $unitNumber,
                'client_name' => $clientName,
                'contract_number' => $contract->contract_number,
                'total_amount' => $total,
                'paid_amount' => $paid,
                'outstanding' => $outstanding,
                'status' => $contract->status,
            ];
        }
        $compoundStats = array_values($compoundStats);

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
                'cash_balance' => (float) $cashBalance,
                'bank_balance' => (float) $bankBalance,
                'this_month_expected' => (float) $thisMonthExpected,
                'next_month_expected' => (float) $nextMonthExpected,
                'this_year_expected' => (float) $thisYearExpected,
                'compound_stats' => $compoundStats,
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

    /**
     * Get all payment installments with filters.
     */
    public function index(Request $request)
    {
        self::applyOverduePenalties();
        $query = Payment::with(['contract.client', 'contract.unit']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('gateway') && $request->gateway !== 'all') {
            $query->where('gateway', $request->gateway);
        }

        $payments = $query->latest('due_date')->get();

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'data' => $payments
        ], 200);
    }

    /**
     * Collect a payment manually (Finance Officer operation).
     */
    public function collectPayment(Request $request, string $id)
    {
        $fields = $request->validate([
            'amount' => 'required|numeric|min:1',
            'gateway' => 'required|string|in:cash,bank_transfer,stripe,fawry',
            'transaction_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $payment = Payment::findOrFail($id);

        if ($payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This installment has already been paid.',
            ], 400);
        }

        $officerId = $request->user()->id;
        $originalAmount = (float) $payment->amount;
        $paidAmount = (float) $fields['amount'];
        $gateway = $fields['gateway'];
        $transactionRef = $fields['transaction_reference'] ?? strtoupper(Str::random(16));
        $notes = $fields['notes'];

        // Determine if this is a partial payment or full payment
        $isPartial = $paidAmount < $originalAmount;

        \Illuminate\Support\Facades\DB::transaction(function () use ($payment, $isPartial, $paidAmount, $originalAmount, $gateway, $transactionRef, $notes) {
            if ($isPartial) {
                // Partial payment:
                // 1. Update current payment record to the collected amount, and mark as paid
                $payment->update([
                    'amount' => $paidAmount,
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway' => $gateway,
                    'transaction_reference' => $transactionRef . ' (Partial)',
                ]);

                // 2. Create a new pending payment record for the remainder
                $remainder = $originalAmount - $paidAmount;
                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $payment->contract_id,
                    'payment_plan_id' => $payment->payment_plan_id,
                    'amount' => $remainder,
                    'status' => 'pending',
                    'due_date' => $payment->due_date,
                    'installment_number' => $payment->installment_number,
                    'transaction_reference' => 'Remainder of installment #' . $payment->installment_number,
                ]);

                // Note: We do NOT decrement unpaid_installments because a remainder installment is still pending!
            } else {
                // Full payment:
                // 1. Mark as paid
                $payment->update([
                    'amount' => $paidAmount, // in case they paid more or exact
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway' => $gateway,
                    'transaction_reference' => $transactionRef,
                ]);

                // 2. Decrement unpaid installments on the plan
                $paymentPlan = $payment->paymentPlan;
                if ($paymentPlan) {
                    $paymentPlan->decrement('unpaid_installments');
                    if ($paymentPlan->unpaid_installments <= 0) {
                        $paymentPlan->update(['status' => 'completed']);
                    }
                }
            }

            // 3. Increment paid amount on the contract
            $contract = $payment->contract;
            if ($contract) {
                $contract->increment('paid_amount', $paidAmount);
                if ($contract->isPaid()) {
                    $contract->update(['status' => 'completed']);
                }
            }
        });

        // Refetch updated models
        $payment->refresh();
        $contract = $payment->contract;
        $clientId = $contract ? $contract->client_id : $request->user()->id;

        // Emit decoupled event with the Client ID
        event(new \App\Events\PaymentReceived(
            $payment->id,
            $clientId,
            $paidAmount,
            $contract->id ?? null,
            $payment->installment_number,
            $gateway,
            $transactionRef
        ));

        // Audit Log
        AuditLogService::log('PAYMENT_MANUAL_COLLECT', $officerId, [
            'payment_id' => $payment->id,
            'contract_id' => $contract->id ?? null,
            'amount_collected' => $paidAmount,
            'is_partial' => $isPartial,
            'original_amount' => $originalAmount,
            'gateway' => $gateway,
            'transaction_reference' => $transactionRef,
            'notes' => $notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => $isPartial 
                ? 'Partial payment collected successfully. Remainder installment created.'
                : 'Payment collected successfully in full.',
            'data' => $payment,
        ]);
    }

    /**
     * Apply late penalties (10%) to any overdue installments.
     */
    public static function applyOverduePenalties()
    {
        $overduePayments = Payment::where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->where('penalty_amount', 0)
            ->where('penalty_waived', false)
            ->get();

        foreach ($overduePayments as $payment) {
            // Apply 10% late penalty
            $penalty = round($payment->amount * 0.10, 2);
            $payment->update([
                'penalty_amount' => $penalty,
            ]);
        }
    }

    /**
     * Waive/remove the overdue penalty for a payment.
     */
    public function waivePenalty(string $id)
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot waive penalty on an already paid installment.',
            ], 400);
        }

        $payment->update([
            'penalty_amount' => 0.00,
            'penalty_waived' => true,
        ]);

        AuditLogService::log('PAYMENT_PENALTY_WAIVED', auth()->user()->id ?? null, [
            'payment_id' => $payment->id,
            'contract_id' => $payment->contract_id,
            'installment_number' => $payment->installment_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Overdue penalty has been successfully waived.',
            'payment' => $payment,
        ]);
    }
}
