<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\GeneralLedger;
use App\Models\JournalEntry;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JournalEntryService
{
    /**
     * Create a new journal entry with lines.
     */
    public function createEntry(array $entryData, array $linesData, bool $autoPost = false): JournalEntry
    {
        return DB::transaction(function () use ($entryData, $linesData, $autoPost) {
            $companyId = $entryData['company_id'];
            
            // Auto generate entry number if not provided
            if (empty($entryData['entry_number'])) {
                $year = date('Y', strtotime($entryData['entry_date']));
                $count = JournalEntry::where('company_id', $companyId)
                    ->whereYear('entry_date', $year)
                    ->count() + 1;
                $entryData['entry_number'] = 'JV-' . $companyId . '-' . $year . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);
            }

            if (empty($entryData['created_by'])) {
                $entryData['created_by'] = Auth::id() ?: User::where('role', 'admin')->first()?->id;
            }

            $entry = JournalEntry::create($entryData);

            foreach ($linesData as $line) {
                // Resolve account_id if code is passed instead of direct account_id
                if (isset($line['account_code'])) {
                    $account = ChartOfAccount::where('company_id', $companyId)
                        ->where('code', $line['account_code'])
                        ->first();
                    if (!$account) {
                        throw new Exception("Account code {$line['account_code']} not found for company {$companyId}");
                    }
                    $line['account_id'] = $account->id;
                    unset($line['account_code']);
                }

                $entry->lines()->create($line);
            }

            if ($autoPost) {
                $this->postEntry($entry->id);
            }

            return $entry;
        });
    }

    /**
     * Post a draft journal entry to the General Ledger.
     */
    public function postEntry(string $entryId): JournalEntry
    {
        return DB::transaction(function () use ($entryId) {
            $entry = JournalEntry::with('lines.account')->findOrFail($entryId);

            if ($entry->status === 'posted') {
                throw new Exception("Journal Entry is already posted.");
            }

            // Verify double-entry balance: Debits == Credits
            $debits = 0.00;
            $credits = 0.00;
            foreach ($entry->lines as $line) {
                $debits += (float) $line->debit;
                $credits += (float) $line->credit;
            }

            if (abs($debits - $credits) > 0.01) {
                throw new Exception("Out of balance: Debits ({$debits}) must equal Credits ({$credits}). Difference: " . abs($debits - $credits));
            }

            $entry->status = 'posted';
            $entry->posted_at = now();
            if (empty($entry->approved_by)) {
                $entry->approved_by = Auth::id();
            }
            $entry->save();

            // Post balances to General Ledger periods
            $year = date('Y', strtotime($entry->entry_date));
            $period = (int) date('m', strtotime($entry->entry_date));

            foreach ($entry->lines as $line) {
                $account = $line->account;
                
                $gl = GeneralLedger::firstOrCreate(
                    [
                        'company_id' => $entry->company_id,
                        'account_id' => $line->account_id,
                        'fiscal_year' => $year,
                        'period' => $period,
                    ],
                    [
                        'opening_balance' => 0.00,
                        'debit_amount' => 0.00,
                        'credit_amount' => 0.00,
                        'closing_balance' => 0.00,
                    ]
                );

                if ($gl->wasRecentlyCreated) {
                    $prevPeriod = $period - 1;
                    $prevYear = $year;
                    if ($prevPeriod === 0) {
                        $prevPeriod = 12;
                        $prevYear = $year - 1;
                    }
                    $prevGl = GeneralLedger::where('company_id', $entry->company_id)
                        ->where('account_id', $line->account_id)
                        ->where('fiscal_year', $prevYear)
                        ->where('period', $prevPeriod)
                        ->first();
                    if ($prevGl) {
                        $gl->opening_balance = $prevGl->closing_balance;
                    }
                }

                $gl->debit_amount += $line->debit;
                $gl->credit_amount += $line->credit;

                if (in_array($account->type, ['asset', 'expense'])) {
                    $gl->closing_balance = $gl->opening_balance + $gl->debit_amount - $gl->credit_amount;
                } else {
                    $gl->closing_balance = $gl->opening_balance + $gl->credit_amount - $gl->debit_amount;
                }

                $gl->save();
            }

            return $entry;
        });
    }

    /**
     * Automatic Ledger Entry integration rules engine.
     */
    public function postAutomaticEntry(
        string $companyId,
        string $action,
        float $amount,
        string $reference,
        string $description,
        ?string $costCenterId = null,
        ?string $profitCenterId = null,
        array $extraData = []
    ): ?JournalEntry {
        $accountingService = new AccountingService();
        $accountingService->seedDefaultChart($companyId);

        $lines = [];

        if ($action === 'CONTRACT_SIGNED') {
            $lines = [
                [
                    'account_code' => '12000',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => "Receivable for Contract {$description}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
                [
                    'account_code' => '22000',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'description' => "Deferred revenue for Contract {$description}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ]
            ];
        } elseif ($action === 'PAYMENT_COLLECTED') {
            $lines = [
                [
                    'account_code' => '11000',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => "Collected payment reference {$reference}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
                [
                    'account_code' => '12000',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'description' => "Settled receivable payment reference {$reference}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
                [
                    'account_code' => '22000',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => "Realized revenue conversion reference {$reference}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
                [
                    'account_code' => '41000',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'description' => "Realized real estate revenue reference {$reference}",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ]
            ];
        } elseif ($action === 'CONTRACT_CANCELLED') {
            $refund = (float) ($extraData['refund_amount'] ?? 0.00);
            $penalty = (float) ($extraData['penalty_amount'] ?? 0.00);
            
            $outstandingReceivable = max(0.00, $amount - $refund - $penalty);
            
            $lines = [
                [
                    'account_code' => '22000',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'description' => "Reversing unearned deferred revenue for cancellation",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
                [
                    'account_code' => '12000',
                    'debit' => 0.00,
                    'credit' => $outstandingReceivable,
                    'description' => "Reversing outstanding receivable balance",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ],
            ];

            if ($refund > 0) {
                $lines[] = [
                    'account_code' => '21000',
                    'debit' => 0.00,
                    'credit' => $refund,
                    'description' => "Refund payable to client",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ];
            }

            if ($penalty > 0) {
                $lines[] = [
                    'account_code' => '42000',
                    'debit' => 0.00,
                    'credit' => $penalty,
                    'description' => "Cancellation penalty revenue realized",
                    'cost_center_id' => $costCenterId,
                    'profit_center_id' => $profitCenterId,
                ];
            }

            $sumCredits = 0;
            foreach ($lines as $l) {
                $sumCredits += $l['credit'];
            }
            if (abs($amount - $sumCredits) > 0.01) {
                $lines[1]['credit'] += ($amount - $sumCredits);
            }
        }

        if (empty($lines)) {
            return null;
        }

        $entryData = [
            'company_id' => $companyId,
            'reference' => $reference,
            'description' => "Auto-generated ledger entry for action: {$action}. {$description}",
            'entry_date' => now()->toDateString(),
            'status' => 'draft',
        ];

        return $this->createEntry($entryData, $lines, true);
    }
}
