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
    /**
     * Get financial dashboard KPIs.
     */
    public function getDashboard(Request $request)
    {
        self::applyOverduePenalties();

        $year = (int) $request->input('year', now()->year);
        $month = $request->input('month'); // optional (1-12)
        $projectId = $request->input('project_id'); // optional
        $phase = $request->input('phase'); // optional
        $unitType = $request->input('unit_type'); // optional
        $clientId = $request->input('client_id'); // optional
        $paymentStatus = $request->input('status'); // optional ('all', 'paid', 'pending', 'overdue', 'partial')

        // 1. Construct contract query based on filters
        $contractQuery = Contract::query();
        if ($clientId) {
            $contractQuery->where('client_id', $clientId);
        }
        if ($projectId || $phase || $unitType) {
            $contractQuery->whereHas('unit', function ($qu) use ($projectId, $phase, $unitType) {
                if ($projectId) $qu->where('project_id', $projectId);
                if ($phase) $qu->where('phase', $phase);
                if ($unitType) $qu->where('type', $unitType);
            });
        }

        $filteredContracts = $contractQuery->clone()
            ->whereIn('status', ['active', 'pending_signature', 'completed', 'withdrawn'])
            ->get();

        // 2. Construct payment query based on filters
        $paymentQuery = Payment::query()->whereHas('contract', function ($q) use ($projectId, $phase, $unitType, $clientId) {
            if ($clientId) {
                $q->where('client_id', $clientId);
            }
            if ($projectId || $phase || $unitType) {
                $q->whereHas('unit', function ($qu) use ($projectId, $phase, $unitType) {
                    if ($projectId) $qu->where('project_id', $projectId);
                    if ($phase) $qu->where('phase', $phase);
                    if ($unitType) $qu->where('type', $unitType);
                });
            }
        });

        // Apply payment status filter
        if ($paymentStatus && $paymentStatus !== 'all') {
            if ($paymentStatus === 'overdue') {
                $paymentQuery->where('status', 'pending')->where('due_date', '<', now());
            } else {
                $paymentQuery->where('status', $paymentStatus);
            }
        }

        // Apply month/year filters on payments where applicable
        $revenueQuery = $paymentQuery->clone()->where('status', 'paid');
        if ($month) {
            $revenueQuery->whereMonth('paid_at', $month);
        }
        $revenueQuery->whereYear('paid_at', $year);

        // Revenue KPI Metrics
        $totalCollected = (float) $revenueQuery->sum('paid_amount');
        $totalRevenue = (float) $paymentQuery->clone()->where('status', 'paid')->sum('amount'); // total paid in history matching filters

        // Total outstanding (outstanding balance on active contracts matching filter)
        $totalOutstanding = (float) $contractQuery->clone()
            ->whereIn('status', ['active', 'pending_signature'])
            ->get()
            ->sum(fn($c) => max(0.0, (float) $c->total_amount - (float) $c->paid_amount));

        // Cash vs Bank balances (filtered)
        $cashBalance = (float) $revenueQuery->clone()->where('gateway', 'cash')->sum('paid_amount');
        $bankBalance = (float) $revenueQuery->clone()->where('gateway', '!=', 'cash')->sum('paid_amount');

        // Monthly revenue of selected year
        $monthlyRevenue = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyRevenue[$m] = (float) $paymentQuery->clone()
                ->where('status', 'paid')
                ->whereYear('paid_at', $year)
                ->whereMonth('paid_at', $m)
                ->sum('paid_amount');
        }

        // Yearly revenue of last 5 years
        $yearlyRevenue = [];
        $currentYear = now()->year;
        for ($y = $currentYear - 4; $y <= $currentYear; $y++) {
            $yearlyRevenue[$y] = (float) $paymentQuery->clone()
                ->where('status', 'paid')
                ->whereYear('paid_at', $y)
                ->sum('paid_amount');
        }

        // 3. Customer Statistics
        // Fetch clients who have contracts matching our query
        $clientIds = $contractQuery->clone()->pluck('client_id')->unique()->toArray();
        
        $regularCustomersCount = 0;
        $overdueCustomersCount = 0;
        $totalOverdueDays = 0;
        $overduePaymentsCount = 0;

        foreach ($clientIds as $cId) {
            // Check if this customer has any overdue payments matching filters
            $customerOverdue = Payment::whereHas('contract', fn($q) => $q->where('client_id', $cId))
                ->where('status', 'pending')
                ->where('due_date', '<', now())
                ->get();

            if ($customerOverdue->count() > 0) {
                $overdueCustomersCount++;
                foreach ($customerOverdue as $op) {
                    $dueDate = \Carbon\Carbon::parse($op->due_date);
                    $totalOverdueDays += max(0, now()->diffInDays($dueDate));
                    $overduePaymentsCount++;
                }
            } else {
                $regularCustomersCount++;
            }
        }

        $avgOverdueDays = $overduePaymentsCount > 0 ? round($totalOverdueDays / $overduePaymentsCount, 1) : 0;
        
        // Total penalty fees collected
        $totalPenalties = (float) $paymentQuery->clone()->where('status', 'paid')->sum('penalty_amount');
        // Total pending penalties (applied but unpaid)
        $pendingPenalties = (float) $paymentQuery->clone()
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->sum('penalty_amount');

        // 4. Units Statistics
        $unitQuery = \App\Models\Unit::query();
        if ($projectId) $unitQuery->where('project_id', $projectId);
        if ($phase) $unitQuery->where('phase', $phase);
        if ($unitType) $unitQuery->where('type', $unitType);

        $availableUnits = $unitQuery->clone()->where('status', 'available')->count();
        $reservedUnits = $unitQuery->clone()->where('status', 'reserved')->count();
        $soldUnits = $unitQuery->clone()->where('status', 'sold')->count();
        $withdrawnUnits = $contractQuery->clone()->where('status', 'withdrawn')->count();

        // 5. Forecasting Cash Flows
        // Expected future payments (status = pending and due date is in the future) grouped by month
        $upcomingInstallmentsSum = (float) $paymentQuery->clone()
            ->where('status', 'pending')
            ->where('due_date', '>=', now())
            ->sum('amount');

        $expectedCashFlows = [];
        // Group by month for the next 12 months
        for ($i = 0; $i < 12; $i++) {
            $targetDate = now()->addMonths($i);
            $expectedCashFlows[$targetDate->format('Y-m')] = (float) $paymentQuery->clone()
                ->where('status', 'pending')
                ->whereYear('due_date', $targetDate->year)
                ->whereMonth('due_date', $targetDate->month)
                ->sum('amount');
        }

        // Current month expected collections
        $thisMonthExpected = (float) $paymentQuery->clone()
            ->where('status', 'pending')
            ->whereMonth('due_date', now()->month)
            ->whereYear('due_date', now()->year)
            ->sum('amount');

        $nextMonthExpected = (float) $paymentQuery->clone()
            ->where('status', 'pending')
            ->whereMonth('due_date', now()->addMonth()->month)
            ->whereYear('due_date', now()->addMonth()->year)
            ->sum('amount');

        $thisYearExpected = (float) $paymentQuery->clone()
            ->where('status', 'pending')
            ->whereYear('due_date', now()->year)
            ->sum('amount');

        // Compounds and units breakdown (H.3 / Outstanding collection segmentation)
        $compoundStats = [];
        foreach ($filteredContracts as $contract) {
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

        // Recent payments
        $recentPayments = Payment::where('status', 'paid')
            ->whereHas('contract', function ($q) use ($projectId, $phase, $unitType, $clientId) {
                if ($clientId) $q->where('client_id', $clientId);
                if ($projectId || $phase || $unitType) {
                    $q->whereHas('unit', function ($qu) use ($projectId, $phase, $unitType) {
                        if ($projectId) $qu->where('project_id', $projectId);
                        if ($phase) $qu->where('phase', $phase);
                        if ($unitType) $qu->where('type', $unitType);
                    });
                }
            })
            ->with('contract.client')
            ->latest('paid_at')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'dashboard' => [
                'total_revenue' => $totalRevenue,
                'total_collected' => $totalCollected,
                'total_outstanding' => $totalOutstanding,
                'cash_balance' => $cashBalance,
                'bank_balance' => $bankBalance,
                'this_month_revenue' => $monthlyRevenue[(int)now()->format('m')],
                'monthly_revenue_data' => array_values($monthlyRevenue),
                'yearly_revenue_data' => $yearlyRevenue,
                
                // Customer statistics
                'regular_customers' => $regularCustomersCount,
                'overdue_customers' => $overdueCustomersCount,
                'average_overdue_days' => $avgOverdueDays,
                'total_penalties' => $totalPenalties,
                'pending_penalties' => $pendingPenalties,

                // Unit statistics
                'available_units' => $availableUnits,
                'reserved_units' => $reservedUnits,
                'sold_units' => $soldUnits,
                'withdrawn_units' => $withdrawnUnits,

                // Forecasting / expected outlays
                'expected_cash_flows' => $expectedCashFlows,
                'upcoming_installments_sum' => $upcomingInstallmentsSum,
                'this_month_expected' => $thisMonthExpected,
                'next_month_expected' => $nextMonthExpected,
                'this_year_expected' => $thisYearExpected,
                
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

        if ($payment->paid_amount >= $payment->amount) {
            return response()->json([
                'success' => false,
                'message' => 'This installment has already been paid in full.',
            ], 400);
        }

        $officerId = $request->user()->id;
        $originalAmount = (float) $payment->amount;
        $paidAmount = (float) $fields['amount'];
        $gateway = $fields['gateway'];
        $transactionRef = $fields['transaction_reference'] ?? strtoupper(Str::random(16));
        $notes = $fields['notes'];

        $remainingBase = $originalAmount - (float) $payment->paid_amount;
        if ($paidAmount > $remainingBase) {
            return response()->json([
                'success' => false,
                'message' => 'Collected amount cannot exceed the remaining installment amount due (' . $remainingBase . ' EGP).',
            ], 400);
        }

        $currentPaidTotal = (float) $payment->paid_amount + $paidAmount;
        $isPartial = $currentPaidTotal < $originalAmount;

        \Illuminate\Support\Facades\DB::transaction(function () use ($payment, $isPartial, $paidAmount, $currentPaidTotal, $gateway, $transactionRef, $notes) {
            // Update current payment record to the collected amount
            $payment->update([
                'paid_amount' => $currentPaidTotal,
                'paid_at' => now(),
                'gateway' => $gateway,
                'transaction_reference' => $transactionRef . ($isPartial ? ' (Partial)' : ''),
            ]);

            if (!$isPartial) {
                // Decrement unpaid installments on the plan
                $paymentPlan = $payment->paymentPlan;
                if ($paymentPlan) {
                    $paymentPlan->decrement('unpaid_installments');
                    if ($paymentPlan->unpaid_installments <= 0) {
                        $paymentPlan->update(['status' => 'completed']);
                    }
                }
            }

            // Increment paid amount on the contract
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
                ? 'Partial payment collected successfully.'
                : 'Payment collected successfully in full.',
            'data' => $payment,
        ]);
    }

    /**
     * Apply late penalties to any overdue installments.
     */
    public static function applyOverduePenalties()
    {
        // Fetch global settings
        $globalRate = (float) (\App\Models\SystemConfig::where('key', 'delay_penalty_percentage')->value('value') ?? 1.0);
        $globalEnabled = filter_var(\App\Models\SystemConfig::where('key', 'delay_penalty_enabled')->value('value') ?? 'true', FILTER_VALIDATE_BOOLEAN);
        $globalGrace = (int) (\App\Models\SystemConfig::where('key', 'delay_penalty_grace_days')->value('value') ?? 0);

        // Retrieve all payments not fully paid and not waived
        $payments = Payment::where('penalty_waived', false)
            ->whereColumn('paid_amount', '<', 'amount')
            ->with('paymentPlan')
            ->get();

        foreach ($payments as $payment) {
            $plan = $payment->paymentPlan;

            // Determine effective settings
            $enabled = $plan && !is_null($plan->penalty_enabled) ? (bool) $plan->penalty_enabled : $globalEnabled;
            $rate = $plan && !is_null($plan->penalty_rate) ? (float) $plan->penalty_rate : $globalRate;
            $grace = $plan && !is_null($plan->grace_period_days) ? (int) $plan->grace_period_days : $globalGrace;

            $remainingAmount = (float) ($payment->amount - $payment->paid_amount);

            if ($enabled && $payment->due_date && $remainingAmount > 0) {
                // Calculate threshold date: due date + grace days
                $dueDate = \Carbon\Carbon::parse($payment->due_date);
                $thresholdDate = $dueDate->copy()->addDays($grace);

                if (now()->greaterThan($thresholdDate)) {
                    // Apply late penalty on remaining unpaid amount
                    $penalty = round($remainingAmount * ($rate / 100), 2);
                    $payment->update([
                        'penalty_amount' => $penalty,
                    ]);
                    continue;
                }
            }

            // Reset penalty_amount to 0 if penalty is disabled/not overdue
            if ($payment->penalty_amount > 0) {
                $payment->update([
                    'penalty_amount' => 0.00,
                ]);
            }
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

    /**
     * Update delay penalty settings for a contract's payment plan.
     */
    public function updatePenaltySettings(Request $request, string $contractId)
    {
        $fields = $request->validate([
            'penalty_enabled' => 'required|boolean',
            'penalty_rate' => 'required|numeric|min:0|max:100',
            'grace_period_days' => 'required|integer|min:0|max:365',
        ]);

        $contract = Contract::findOrFail($contractId);
        $paymentPlan = $contract->paymentPlan;

        if (!$paymentPlan) {
            return response()->json([
                'success' => false,
                'message' => 'No payment plan found for this contract.',
            ], 404);
        }

        $paymentPlan->update([
            'penalty_enabled' => $fields['penalty_enabled'],
            'penalty_rate' => $fields['penalty_rate'],
            'grace_period_days' => $fields['grace_period_days'],
        ]);

        // Recalculate penalties immediately
        self::applyOverduePenalties();

        AuditLogService::log('PAYMENT_PLAN_PENALTY_CONFIG', $request->user()->id ?? null, [
            'contract_id' => $contractId,
            'payment_plan_id' => $paymentPlan->id,
            'penalty_enabled' => $fields['penalty_enabled'],
            'penalty_rate' => $fields['penalty_rate'],
            'grace_period_days' => $fields['grace_period_days'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penalty settings updated successfully and penalties recalculated.',
            'payment_plan' => $paymentPlan->fresh(),
        ]);
    }
}
