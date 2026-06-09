<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\CostCenter;
use App\Models\ProfitCenter;
use App\Models\JournalEntry;
use App\Models\Budget;
use App\Models\Company;
use App\Services\AccountingService;
use App\Services\JournalEntryService;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    protected AccountingService $accountingService;
    protected JournalEntryService $journalEntryService;

    public function __construct(
        AccountingService $accountingService,
        JournalEntryService $journalEntryService
    ) {
        $this->accountingService = $accountingService;
        $this->journalEntryService = $journalEntryService;
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

    // ── CHART OF ACCOUNTS ──

    public function getAccounts(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        
        $this->accountingService->seedDefaultChart($companyId);

        $accounts = ChartOfAccount::where('company_id', $companyId)
            ->orWhereNull('company_id')
            ->orderBy('code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $accounts
        ]);
    }

    public function createAccount(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'code' => 'required|string',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:asset,liability,equity,revenue,expense',
            'parent_id' => 'nullable|string|exists:chart_of_accounts,id',
        ]);

        $fields['company_id'] = $companyId;

        $account = ChartOfAccount::create($fields);

        return response()->json([
            'success' => true,
            'data' => $account
        ], 201);
    }

    // ── COST & PROFIT CENTERS ──

    public function getCostCenters(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $centers = CostCenter::where('company_id', $companyId)->orderBy('code')->get();
        return response()->json([
            'success' => true,
            'data' => $centers
        ]);
    }

    public function createCostCenter(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'code' => 'required|string',
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|string|exists:cost_centers,id',
        ]);

        $fields['company_id'] = $companyId;
        $center = CostCenter::create($fields);

        return response()->json([
            'success' => true,
            'data' => $center
        ], 201);
    }

    public function getProfitCenters(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $centers = ProfitCenter::where('company_id', $companyId)->orderBy('code')->get();
        return response()->json([
            'success' => true,
            'data' => $centers
        ]);
    }

    public function createProfitCenter(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'code' => 'required|string',
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|string|exists:profit_centers,id',
        ]);

        $fields['company_id'] = $companyId;
        $center = ProfitCenter::create($fields);

        return response()->json([
            'success' => true,
            'data' => $center
        ], 201);
    }

    // ── JOURNAL ENTRIES ──

    public function getJournalEntries(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $query = JournalEntry::with(['lines.account', 'creator', 'approver'])
            ->where('company_id', $companyId);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_start')) {
            $query->whereDate('entry_date', '>=', $request->input('date_start'));
        }
        if ($request->filled('date_end')) {
            $query->whereDate('entry_date', '<=', $request->input('date_end'));
        }

        $entries = $query->orderBy('entry_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $entries
        ]);
    }

    public function createJournalEntry(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $request->validate([
            'entry_date' => 'required|date',
            'description' => 'required|string|max:1000',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|string|exists:chart_of_accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.cost_center_id' => 'nullable|string|exists:cost_centers,id',
            'lines.*.profit_center_id' => 'nullable|string|exists:profit_centers,id',
        ]);

        $entryData = [
            'company_id' => $companyId,
            'entry_date' => $request->input('entry_date'),
            'description' => $request->input('description'),
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ];

        try {
            $entry = $this->journalEntryService->createEntry($entryData, $request->input('lines'), false);
            return response()->json([
                'success' => true,
                'data' => $entry
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function postJournalEntry(Request $request, string $id)
    {
        try {
            $entry = $this->journalEntryService->postEntry($id);
            return response()->json([
                'success' => true,
                'data' => $entry
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // ── FINANCIAL REPORTS ──

    public function getReports(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $request->validate([
            'type' => 'required|string|in:trial-balance,balance-sheet,income-statement',
            'date_start' => 'required|date',
            'date_end' => 'required|date',
        ]);

        $type = $request->input('type');
        $start = $request->input('date_start');
        $end = $request->input('date_end');

        switch ($type) {
            case 'trial-balance':
                $data = $this->accountingService->getTrialBalance($companyId, $start, $end);
                break;
            case 'balance-sheet':
                $data = $this->accountingService->getBalanceSheet($companyId, $start, $end);
                break;
            case 'income-statement':
                $data = $this->accountingService->getIncomeStatement($companyId, $start, $end);
                break;
            default:
                return response()->json(['success' => false, 'message' => 'Invalid report type'], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // ── BUDGETS ──

    public function getBudgets(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $budgets = Budget::with('account')
            ->where('company_id', $companyId)
            ->orderBy('fiscal_year', 'desc')
            ->orderBy('period', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $budgets
        ]);
    }

    public function createBudget(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'account_id' => 'required|string|exists:chart_of_accounts,id',
            'fiscal_year' => 'required|integer|min:2020',
            'period' => 'required|integer|between:1,12',
            'amount' => 'required|numeric|min:0',
        ]);

        $fields['company_id'] = $companyId;
        $fields['status'] = 'active';

        $exists = Budget::where('company_id', $companyId)
            ->where('account_id', $fields['account_id'])
            ->where('fiscal_year', $fields['fiscal_year'])
            ->where('period', $fields['period'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Budget already allocated for this account and period.'
            ], 400);
        }

        $budget = Budget::create($fields);

        return response()->json([
            'success' => true,
            'data' => $budget
        ], 201);
    }
}
