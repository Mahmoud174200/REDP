<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Cancellation;
use App\Models\Commission;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Accountant financial overview — organised, detailed money view:
 *   - What we HAVE (cash collected), are OWED (receivables), and OWE (payables)
 *   - Per-project sales breakdown (sold value, collected, cash vs installment)
 *   - Per-client statement (paid vs remaining, full schedule)
 *
 * "Signed" = contracts that became real sales (status active/completed).
 */
class FinanceOverviewController extends Controller
{
    private const SIGNED = ['active', 'completed'];

    /**
     * GET /api/v1/finance/overview
     */
    public function overview(): JsonResponse
    {
        $signed = Contract::with(['unit.project:id,name', 'paymentPlan:id,contract_id,total_installments'])
            ->whereIn('status', self::SIGNED)
            ->get();

        $signedIds = $signed->pluck('id');

        // Collected is tracked canonically on contract.paid_amount (maintained by
        // generate + collectPayment). Cash-desk = gateway-tagged cash collections.
        $collected = (float) $signed->sum('paid_amount');
        $cash      = (float) Payment::whereIn('contract_id', $signedIds)->where('gateway', 'cash')->sum('paid_amount');
        $bank      = max(0, $collected - $cash);

        $receivable = 0.0;
        $cashCount = 0; $instCount = 0;
        $projects = [];

        foreach ($signed as $c) {
            $coll = (float) $c->paid_amount;
            $tot  = (float) $c->total_amount;
            $rem  = max(0, $tot - $coll);
            $receivable += $rem;

            $isCash = $c->type === 'cash' || (($c->paymentPlan->total_installments ?? 1) <= 1);
            $isCash ? $cashCount++ : $instCount++;

            $pid = $c->unit->project_id ?? 'none';
            if (!isset($projects[$pid])) {
                $projects[$pid] = [
                    'project_id' => $pid,
                    'project_name' => $c->unit->project->name ?? 'Unassigned',
                    'sold_units' => 0, 'sold_value' => 0.0, 'contract_value' => 0.0,
                    'collected' => 0.0, 'outstanding' => 0.0,
                    'cash_contracts' => 0, 'installment_contracts' => 0,
                ];
            }
            $projects[$pid]['sold_units']++;
            $projects[$pid]['sold_value']     += (float) ($c->unit->price ?? $tot);
            $projects[$pid]['contract_value'] += $tot;
            $projects[$pid]['collected']      += $coll;
            $projects[$pid]['outstanding']    += $rem;
            $isCash ? $projects[$pid]['cash_contracts']++ : $projects[$pid]['installment_contracts']++;
        }

        // Overdue receivable (past-due unpaid portion)
        $overdue = (float) Payment::whereIn('contract_id', $signedIds)
            ->whereColumn('paid_amount', '<', 'amount')
            ->whereNotNull('due_date')->where('due_date', '<', now())
            ->selectRaw('SUM(amount - paid_amount) as o')->value('o');

        // Payables
        $commissions = (float) Commission::whereIn('status', ['pending', 'approved'])->sum('gross_amount');
        $refunds     = (float) Cancellation::whereIn('status', ['pending', 'approved'])->sum('refund_amount');

        usort($projects, fn($a, $b) => $b['sold_value'] <=> $a['sold_value']);

        return response()->json([
            'success' => true,
            'data' => [
                'have'        => ['collected' => $collected, 'cash' => $cash, 'bank' => $bank],
                'receivables' => ['total' => $receivable, 'overdue' => (float) $overdue],
                'payables'    => ['broker_commissions' => $commissions, 'refunds' => $refunds, 'total' => $commissions + $refunds],
                'summary'     => [
                    'signed_contracts'      => $signed->count(),
                    'cash_contracts'        => $cashCount,
                    'installment_contracts' => $instCount,
                    'net_position'          => $collected + $receivable - ($commissions + $refunds),
                ],
                'projects'    => array_values($projects),
            ],
        ]);
    }

    /**
     * GET /api/v1/finance/clients-ledger?search=
     * One row per client: contracts, total value, paid, remaining.
     */
    public function clientsLedger(Request $request): JsonResponse
    {
        $contracts = Contract::with(['client:id,name,email,phone'])
            ->whereIn('status', self::SIGNED)
            ->whereNotNull('client_id')
            ->get();

        $clients = [];
        foreach ($contracts as $c) {
            $cid = $c->client_id;
            if (!isset($clients[$cid])) {
                $clients[$cid] = [
                    'client_id' => $cid,
                    'name' => $c->client->name ?? '—',
                    'email' => $c->client->email ?? null,
                    'phone' => $c->client->phone ?? null,
                    'contracts' => 0, 'total' => 0.0, 'paid' => 0.0, 'remaining' => 0.0,
                ];
            }
            $coll = (float) $c->paid_amount;
            $tot  = (float) $c->total_amount;
            $clients[$cid]['contracts']++;
            $clients[$cid]['total']     += $tot;
            $clients[$cid]['paid']      += $coll;
            $clients[$cid]['remaining'] += max(0, $tot - $coll);
        }

        $list = array_values($clients);

        if ($request->filled('search')) {
            $s = mb_strtolower($request->input('search'));
            $list = array_values(array_filter($list, fn($x) => str_contains(mb_strtolower(($x['name'] ?? '') . ' ' . ($x['email'] ?? '') . ' ' . ($x['phone'] ?? '')), $s)));
        }

        usort($list, fn($a, $b) => $b['remaining'] <=> $a['remaining']);

        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * GET /api/v1/finance/clients/{clientId}/statement
     * Full per-client statement: each contract + its installment schedule.
     */
    public function clientStatement(string $clientId): JsonResponse
    {
        $client = User::findOrFail($clientId);

        $contracts = Contract::with([
            'unit.project:id,name',
            'paymentPlan:id,contract_id,total_installments,monthly_amount',
            'payments' => fn($q) => $q->orderBy('installment_number')->orderBy('due_date'),
        ])->where('client_id', $clientId)
          ->whereIn('status', self::SIGNED)
          ->orderByDesc('created_at')
          ->get();

        $data = $contracts->map(function ($c) {
            $coll = (float) $c->paid_amount;
            $tot  = (float) $c->total_amount;
            return [
                'id' => $c->id,
                'contract_number' => $c->contract_number,
                'status' => $c->status,
                'type' => $c->type,
                'is_custom_plan' => (bool) $c->is_custom_plan,
                'unit_number' => $c->unit->unit_number ?? '—',
                'project' => $c->unit->project->name ?? '—',
                'total' => $tot,
                'paid' => $coll,
                'remaining' => max(0, $tot - $coll),
                'installments_total' => $c->paymentPlan->total_installments ?? 0,
                'payments' => $c->payments->map(function ($p) {
                    // A row is "paid" when it has paid_at (e.g. EOI/down) or paid_amount covers it.
                    $amount = (float) $p->amount;
                    $pa = (float) $p->paid_amount;
                    $isPaid = $p->paid_at !== null || $pa >= $amount;
                    $effPaid = $pa > 0 ? $pa : ($p->paid_at ? $amount : 0.0);
                    $overdue = !$isPaid && $p->due_date && $p->due_date->isPast();
                    $status = $isPaid ? 'paid' : ($pa > 0 ? 'partial' : ($overdue ? 'overdue' : 'upcoming'));
                    return [
                        'installment_number' => $p->installment_number,
                        'label' => $p->transaction_reference,
                        'amount' => $amount,
                        'paid_amount' => $effPaid,
                        'due_date' => $p->due_date,
                        'paid_at' => $p->paid_at,
                        'status' => $status,
                        'gateway' => $p->gateway,
                    ];
                })->values(),
            ];
        });

        $totalPaid = $data->sum('paid');
        $totalRemaining = $data->sum('remaining');

        return response()->json([
            'success' => true,
            'data' => [
                'client' => ['id' => $client->id, 'name' => $client->name, 'email' => $client->email, 'phone' => $client->phone],
                'totals' => ['paid' => $totalPaid, 'remaining' => $totalRemaining, 'contracts' => $data->count()],
                'contracts' => $data,
            ],
        ]);
    }
}
