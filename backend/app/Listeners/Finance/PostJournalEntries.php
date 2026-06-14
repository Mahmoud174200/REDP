<?php

namespace App\Listeners\Finance;

use App\Events\ContractSigned;
use App\Events\PaymentReceived;
use App\Events\Finance\CancellationProcessed;
use App\Models\Contract;
use App\Models\Payment;
use App\Services\JournalEntryService;
use Illuminate\Support\Facades\Log;

class PostJournalEntries
{
    protected JournalEntryService $journalEntryService;

    public function __construct(JournalEntryService $journalEntryService)
    {
        $this->journalEntryService = $journalEntryService;
    }

    /**
     * Handle contract signing -> record unearned revenue & receivable.
     */
    public function handleContractSigned(ContractSigned $event): void
    {
        try {
            $contract = Contract::findOrFail($event->contractId);
            $companyId = $contract->company_id ?? $this->getDefaultCompanyId();

            $this->journalEntryService->postAutomaticEntry(
                $companyId,
                'CONTRACT_SIGNED',
                (float) $contract->total_amount,
                $contract->id,
                "Contract Ref: {$contract->contract_number}"
            );

            Log::info("[Accounting] Posted CONTRACT_SIGNED JV for Contract: {$contract->contract_number}");
        } catch (\Exception $e) {
            Log::error("[Accounting] Failed to post CONTRACT_SIGNED JV: " . $e->getMessage());
        }
    }

    /**
     * Handle payment collection -> cash receipt, settle receivable, realize revenue.
     */
    public function handlePaymentReceived(PaymentReceived $event): void
    {
        try {
            $payment = Payment::with('contract')->findOrFail($event->paymentId);
            $contract = $payment->contract;
            $companyId = $contract->company_id ?? $this->getDefaultCompanyId();

            $this->journalEntryService->postAutomaticEntry(
                $companyId,
                'PAYMENT_COLLECTED',
                (float) $event->amount,
                $payment->id,
                "Installment #{$payment->installment_number} on Contract #{$contract->contract_number}"
            );

            Log::info("[Accounting] Posted PAYMENT_COLLECTED JV for Payment: {$payment->id}");
        } catch (\Exception $e) {
            Log::error("[Accounting] Failed to post PAYMENT_COLLECTED JV: " . $e->getMessage());
        }
    }

    /**
     * Handle cancellation -> reverse unearned revenue & receivable, record refund and penalty.
     */
    public function handleCancellationProcessed(CancellationProcessed $event): void
    {
        try {
            $contract = Contract::findOrFail($event->contractId);
            $companyId = $contract->company_id ?? $this->getDefaultCompanyId();

            $this->journalEntryService->postAutomaticEntry(
                $companyId,
                'CONTRACT_CANCELLED',
                (float) $contract->total_amount,
                $event->cancellationId,
                "Cancellation of Contract #{$contract->contract_number}",
                null,
                null,
                [
                    'refund_amount' => $event->refundAmount,
                    'penalty_amount' => $event->penaltyAmount,
                ]
            );

            Log::info("[Accounting] Posted CONTRACT_CANCELLED JV for Contract: {$contract->contract_number}");
        } catch (\Exception $e) {
            Log::error("[Accounting] Failed to post CONTRACT_CANCELLED JV: " . $e->getMessage());
        }
    }

    /**
     * Helper to get a fallback company ID.
     */
    protected function getDefaultCompanyId(): string
    {
        $company = \App\Models\Company::first();
        if (!$company) {
            $company = \App\Models\Company::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'name' => 'Default Company Holding',
                'legal_name' => 'Default Real Estate Holding Co.',
                'type' => 'holding',
                'status' => 'active',
            ]);
        }
        return $company->id;
    }
}
