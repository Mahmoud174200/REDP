<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\CommissionRule;
use App\Models\CommissionCalculation;
use App\Models\CommissionPayout;
use App\Models\Company;
use App\Services\CommissionService;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    protected CommissionService $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    protected function getCompanyId(Request $request): string
    {
        $companyId = $request->user()?->company_id;
        if (!$companyId) {
            $company = Company::first();
            if (!$company) {
                $company = Company::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'name' => 'Default Company Holding',
                    'legal_name' => 'Default Real Estate Holding Co.',
                    'type' => 'holding',
                    'status' => 'active',
                ]);
            }
            $companyId = $company->id;
        }
        return $companyId;
    }

    // ── COMMISSION RULES ──

    public function getRules(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $rules = CommissionRule::with('project')
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rules
        ]);
    }

    public function createRule(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'title' => 'required|string|max:255',
            'project_id' => 'nullable|uuid|exists:projects,id',
            'unit_type' => 'nullable|string|max:100',
            'tier_type' => 'required|string|in:broker,sales_agent,manager,director',
            'min_deal_size' => 'nullable|numeric|min:0',
            'max_deal_size' => 'nullable|numeric|min:0',
            'commission_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $fields['company_id'] = $companyId;
        $fields['min_deal_size'] = $fields['min_deal_size'] ?? 0.00;
        $fields['max_deal_size'] = $fields['max_deal_size'] ?? 999999999.00;
        $fields['status'] = 'active';

        $rule = CommissionRule::create($fields);

        return response()->json([
            'success' => true,
            'data' => $rule
        ], 201);
    }

    // ── COMMISSION CALCULATIONS ──

    public function getCalculations(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $query = CommissionCalculation::with(['payment', 'contract.unit', 'rule', 'user', 'broker'])
            ->where('company_id', $companyId);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('recipient_type')) {
            $type = $request->input('recipient_type');
            if ($type === 'user') {
                $query->whereNotNull('user_id');
            } elseif ($type === 'broker') {
                $query->whereNotNull('broker_id');
            }
        }

        $calculations = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $calculations
        ]);
    }

    // ── COMMISSION PAYOUTS ──

    public function getPayouts(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $payouts = CommissionPayout::with(['user', 'broker', 'approver', 'calculations'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payouts
        ]);
    }

    public function createPayoutBatch(Request $request)
    {
        $request->validate([
            'calculation_ids' => 'required|array|min:1',
            'calculation_ids.*' => 'required|uuid|exists:commission_calculations,id',
            'recipient_type' => 'required|string|in:user,broker',
            'recipient_id' => 'required|uuid',
        ]);

        try {
            $payout = $this->commissionService->createPayoutBatch(
                $request->input('calculation_ids'),
                $request->input('recipient_type'),
                $request->input('recipient_id'),
                $request->user()
            );

            return response()->json([
                'success' => true,
                'data' => $payout
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function payOut(Request $request, string $id)
    {
        try {
            $payout = $this->commissionService->markAsPaid($id);
            return response()->json([
                'success' => true,
                'data' => $payout
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
