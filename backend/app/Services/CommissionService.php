<?php

namespace App\Services;

use App\Models\CommissionRule;
use App\Models\CommissionCalculation;
use App\Models\CommissionPayout;
use App\Models\Payment;
use App\Models\Contract;
use App\Models\User;
use App\Models\Lead;
use App\Models\EmployeeHierarchy;
use App\Models\Company;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CommissionService
{
    protected ApprovalEngine $approvalEngine;

    public function __construct(ApprovalEngine $approvalEngine)
    {
        $this->approvalEngine = $approvalEngine;
    }

    /**
     * Run the multi-tier calculations engine on payment receipt.
     */
    public function calculateCommissionsForPayment(string $paymentId): void
    {
        DB::transaction(function () use ($paymentId) {
            $payment = Payment::findOrFail($paymentId);
            $contract = Contract::with(['unit'])->findOrFail($payment->contract_id);
            $client = User::find($contract->client_id);
            
            if (!$client) {
                Log::warning("CommissionService: Client user not found for ID: " . $contract->client_id);
                return;
            }

            // Find associated Lead
            $lead = Lead::where('email', $client->email)
                ->orWhere('phone', $client->phone)
                ->first();

            if (!$lead) {
                Log::warning("CommissionService: Associated lead not found for client: " . $client->name);
                return;
            }

            $companyId = $payment->company_id ?: $contract->company_id ?: Company::first()?->id;
            $projectId = $contract->unit?->project_id;
            $unitType = $contract->unit?->type;
            $dealSize = (float) $contract->total_amount;
            $paymentAmount = (float) $payment->amount;

            // Resolve recipients
            $brokerId = $lead->broker_id;
            $salesRepId = $lead->assigned_sales_agent_id ?: $lead->company_sales_agent_id ?: $lead->tele_sales_agent_id;
            
            $managerId = null;
            $directorId = null;

            if ($salesRepId) {
                $hierarchy = EmployeeHierarchy::where('user_id', $salesRepId)->first();
                if ($hierarchy) {
                    $managerId = $hierarchy->direct_manager_id;
                    $directorId = $hierarchy->indirect_manager_id;
                }
            }

            // Fetch active rules matching the parameters
            $rules = CommissionRule::where('company_id', $companyId)
                ->where('status', 'active')
                ->where(function ($q) use ($projectId) {
                    $q->where('project_id', $projectId)->orWhereNull('project_id');
                })
                ->where(function ($q) use ($unitType) {
                    $q->where('unit_type', $unitType)->orWhereNull('unit_type');
                })
                ->where('min_deal_size', '<=', $dealSize)
                ->where('max_deal_size', '>=', $dealSize)
                ->get();

            foreach ($rules as $rule) {
                $recipientId = null;
                $recipientType = null;
                $isUser = false;

                switch ($rule->tier_type) {
                    case 'broker':
                    case 'tier_2':
                        if ($brokerId) {
                            $recipientId = $brokerId;
                            $recipientType = 'broker';
                        }
                        break;
                    case 'sales_agent':
                    case 'tier_3':
                        if ($salesRepId) {
                            $recipientId = $salesRepId;
                            $recipientType = 'user';
                            $isUser = true;
                        }
                        break;
                    case 'tier_1':
                        if ($salesRepId) {
                            $recipientId = $salesRepId;
                            $recipientType = 'user';
                            $isUser = true;
                        }
                        break;
                    case 'manager':
                        if ($managerId) {
                            $recipientId = $managerId;
                            $recipientType = 'user';
                            $isUser = true;
                        }
                        break;
                    case 'director':
                        if ($directorId) {
                            $recipientId = $directorId;
                            $recipientType = 'user';
                            $isUser = true;
                        }
                        break;
                }

                if (!$recipientId) {
                    continue;
                }

                // Check if this payment was already processed for this rule and recipient
                $exists = CommissionCalculation::where('payment_id', $paymentId)
                    ->where('rule_id', $rule->id)
                    ->where(function ($q) use ($recipientId, $isUser) {
                        if ($isUser) {
                            $q->where('user_id', $recipientId);
                        } else {
                            $q->where('broker_id', $recipientId);
                        }
                    })
                    ->exists();

                if ($exists) {
                    continue;
                }

                // Calculate amount
                $pct = (float) $rule->commission_percentage;
                $amount = $paymentAmount * ($pct / 100);

                CommissionCalculation::create([
                    'id' => (string) Str::uuid(),
                    'company_id' => $companyId,
                    'payment_id' => $payment->id,
                    'contract_id' => $contract->id,
                    'rule_id' => $rule->id,
                    'user_id' => $isUser ? $recipientId : null,
                    'broker_id' => !$isUser ? $recipientId : null,
                    'deal_amount' => $paymentAmount,
                    'calculated_percentage' => $pct,
                    'calculated_amount' => $amount,
                    'status' => 'pending',
                ]);

                Log::info("CommissionService: Calculated commission of {$amount} EGP for rule {$rule->title} (Recipient: {$recipientId})");
            }
        });
    }

    /**
     * Batch pending calculations into a new payout.
     */
    public function createPayoutBatch(array $calculationIds, string $recipientType, string $recipientId, User $user): CommissionPayout
    {
        return DB::transaction(function () use ($calculationIds, $recipientType, $recipientId, $user) {
            $companyId = $user->company_id ?: Company::first()?->id;

            // Load calculations
            $calculations = CommissionCalculation::whereIn('id', $calculationIds)
                ->where('company_id', $companyId)
                ->where('status', 'pending')
                ->whereNull('payout_id')
                ->lockForUpdate()
                ->get();

            if ($calculations->isEmpty()) {
                throw new Exception("No pending calculations found to batch.");
            }

            // Verify they belong to the correct recipient
            foreach ($calculations as $calc) {
                if ($recipientType === 'user' && $calc->user_id !== $recipientId) {
                    throw new Exception("Calculation {$calc->id} does not belong to recipient user {$recipientId}.");
                }
                if ($recipientType === 'broker' && $calc->broker_id !== $recipientId) {
                    throw new Exception("Calculation {$calc->id} does not belong to recipient broker {$recipientId}.");
                }
            }

            $totalAmount = $calculations->sum('calculated_amount');

            // Generate payout number
            $year = date('Y');
            $count = CommissionPayout::where('company_id', $companyId)->count() + 1;
            $payoutNumber = 'PAY-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

            // Create Payout record
            $payout = CommissionPayout::create([
                'id' => (string) Str::uuid(),
                'company_id' => $companyId,
                'payout_number' => $payoutNumber,
                'recipient_type' => $recipientType,
                'user_id' => $recipientType === 'user' ? $recipientId : null,
                'broker_id' => $recipientType === 'broker' ? $recipientId : null,
                'total_amount' => $totalAmount,
                'status' => 'pending_approval',
            ]);

            // Link calculations to this payout batch
            CommissionCalculation::whereIn('id', $calculations->pluck('id'))
                ->update(['payout_id' => $payout->id]);

            // Trigger Approval Engine workflow under entity type 'commission_payout'
            $this->approvalEngine->initiateApproval('commission_payout', $payout->id, $user, [
                'payout_number' => $payoutNumber,
                'total_amount' => (float) $totalAmount,
                'recipient_type' => $recipientType,
            ]);

            return $payout->fresh();
        });
    }

    /**
     * Mark payout and its linked calculations as paid.
     */
    public function markAsPaid(string $payoutId): CommissionPayout
    {
        return DB::transaction(function () use ($payoutId) {
            $payout = CommissionPayout::findOrFail($payoutId);
            
            if ($payout->status !== 'approved') {
                throw new Exception("Payout is not in approved status.");
            }

            $payout->update(['status' => 'paid']);

            CommissionCalculation::where('payout_id', $payout->id)
                ->update(['status' => 'paid']);

            return $payout;
        });
    }
}
