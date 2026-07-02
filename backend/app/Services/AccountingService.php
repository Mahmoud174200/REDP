<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\GeneralLedger;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Seed a default Chart of Accounts for a company.
     */
    public function seedDefaultChart(string $companyId): void
    {
        $defaultAccounts = [
            // ASSETS (1xxxxx)
            ['code' => '11000', 'name' => 'Cash & Bank Gateway', 'type' => 'asset'],
            ['code' => '12000', 'name' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '13000', 'name' => 'Inventory - Units Under Construction', 'type' => 'asset'],
            
            // LIABILITIES (2xxxxx)
            ['code' => '21000', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '22000', 'name' => 'Unearned Deferred Revenue', 'type' => 'liability'],
            
            // EQUITY (3xxxxx)
            ['code' => '31000', 'name' => 'Paid-in Capital', 'type' => 'equity'],
            ['code' => '32000', 'name' => 'Retained Earnings', 'type' => 'equity'],
            
            // REVENUES (4xxxxx)
            ['code' => '41000', 'name' => 'Realized Real Estate Revenue', 'type' => 'revenue'],
            ['code' => '42000', 'name' => 'Cancellation & Penalty Revenue', 'type' => 'revenue'],
            
            // EXPENSES (5xxxxx)
            ['code' => '51000', 'name' => 'Cost of Goods Sold (COGS)', 'type' => 'expense'],
            ['code' => '52000', 'name' => 'Marketing & Broker Commission Expense', 'type' => 'expense'],
            ['code' => '53000', 'name' => 'Administrative Expense', 'type' => 'expense'],
        ];

        foreach ($defaultAccounts as $acc) {
            $exists = ChartOfAccount::where('company_id', $companyId)
                ->where('code', $acc['code'])
                ->exists();

            if (!$exists) {
                ChartOfAccount::create([
                    'company_id' => $companyId,
                    'code' => $acc['code'],
                    'name' => $acc['name'],
                    'type' => $acc['type'],
                    'status' => 'active',
                ]);
            }
        }
    }

    /**
     * Get Trial Balance report data.
     */
    public function getTrialBalance(string $companyId, string $dateStart, string $dateEnd): array
    {
        $linesQuery = DB::table('journal_lines')
            ->join('journal_entries', 'journal_lines.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.company_id', $companyId)
            ->where('journal_entries.status', 'posted')
            ->whereBetween('journal_entries.entry_date', [$dateStart, $dateEnd])
            ->select(
                'journal_lines.account_id',
                DB::raw('SUM(journal_lines.debit) as total_debit'),
                DB::raw('SUM(journal_lines.credit) as total_credit')
            )
            ->groupBy('journal_lines.account_id');

        $accounts = ChartOfAccount::where('company_id', $companyId)
            ->orWhereNull('company_id')
            ->get();

        $linesData = $linesQuery->get()->keyBy('account_id');

        $report = [];
        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($accounts as $acc) {
            $sumData = $linesData->get($acc->id);
            $debit = $sumData ? (float) $sumData->total_debit : 0.00;
            $credit = $sumData ? (float) $sumData->total_credit : 0.00;

            $balance = 0.00;
            if (in_array($acc->type, ['asset', 'expense'])) {
                $balance = $debit - $credit;
            } else {
                $balance = $credit - $debit;
            }

            $report[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance
            ];

            $totalDebits += $debit;
            $totalCredits += $credit;
        }

        return [
            'accounts' => $report,
            'total_debit' => $totalDebits,
            'total_credit' => $totalCredits
        ];
    }

    /**
     * Get Income Statement (P&L) report.
     */
    public function getIncomeStatement(string $companyId, string $dateStart, string $dateEnd): array
    {
        $tb = $this->getTrialBalance($companyId, $dateStart, $dateEnd);
        
        $revenues = [];
        $expenses = [];
        $totalRevenue = 0;
        $totalExpense = 0;

        foreach ($tb['accounts'] as $acc) {
            if ($acc['type'] === 'revenue') {
                $revenues[] = $acc;
                $totalRevenue += $acc['balance'];
            } elseif ($acc['type'] === 'expense') {
                $expenses[] = $acc;
                $totalExpense += $acc['balance'];
            }
        }

        $netIncome = $totalRevenue - $totalExpense;

        return [
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => $totalRevenue,
            'total_expense' => $totalExpense,
            'net_income' => $netIncome
        ];
    }

    /**
     * Get Balance Sheet report.
     */
    public function getBalanceSheet(string $companyId, string $dateStart, string $dateEnd): array
    {
        $tb = $this->getTrialBalance($companyId, $dateStart, $dateEnd);
        
        $assets = [];
        $liabilities = [];
        $equity = [];
        
        $totalAssets = 0;
        $totalLiabilities = 0;
        $totalEquity = 0;

        $inc = $this->getIncomeStatement($companyId, $dateStart, $dateEnd);
        $periodNetIncome = $inc['net_income'];

        foreach ($tb['accounts'] as $acc) {
            if ($acc['type'] === 'asset') {
                $assets[] = $acc;
                $totalAssets += $acc['balance'];
            } elseif ($acc['type'] === 'liability') {
                $liabilities[] = $acc;
                $totalLiabilities += $acc['balance'];
            } elseif ($acc['type'] === 'equity') {
                $val = $acc['balance'];
                if ($acc['code'] === '32000') {
                    $val += $periodNetIncome;
                }
                $acc['balance'] = $val;
                $equity[] = $acc;
                $totalEquity += $val;
            }
        }

        $balanced = abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01;

        return [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity' => $totalEquity,
            'total_liabilities_equity' => $totalLiabilities + $totalEquity,
            'is_balanced' => $balanced
        ];
    }
}
