<?php

namespace App\Services\Ai;

use App\Models\Lead;
use App\Models\Payment;
use Illuminate\Support\Str;

class LocalMockProvider implements AiProviderInterface
{
    public function scoreLead(Lead $lead): array
    {
        $score = 50.0;
        $reasons = [];

        // Check Lead status
        if (isset($lead->status)) {
            if ($lead->status === 'hot') {
                $score += 25.0;
                $reasons[] = "Lead status is marked as HOT (+25%)";
            } elseif ($lead->status === 'warm') {
                $score += 15.0;
                $reasons[] = "Lead status is warm (+15%)";
            } elseif ($lead->status === 'cold') {
                $score -= 15.0;
                $reasons[] = "Lead is currently cold (-15%)";
            }
        }

        // Check budget if available
        if (isset($lead->budget) && $lead->budget > 0) {
            if ($lead->budget >= 5000000) {
                $score += 15.0;
                $reasons[] = "High-value budget tier of " . number_format($lead->budget) . " EGP (+15%)";
            } else {
                $score += 5.0;
                $reasons[] = "Budget matches entry level tier (+5%)";
            }
        } else {
            $score -= 5.0;
            $reasons[] = "No budget preferences defined (-5%)";
        }

        // Check interactions count
        if ($lead->interactions()->exists()) {
            $count = $lead->interactions()->count();
            if ($count >= 5) {
                $score += 15.0;
                $reasons[] = "High engagement with {$count} interactions logged (+15%)";
            } else {
                $score += 5.0;
                $reasons[] = "Active engagement with {$count} interactions logged (+5%)";
            }
        } else {
            $score -= 10.0;
            $reasons[] = "No customer interactions logged yet (-10%)";
        }

        $score = max(5.0, min(99.0, $score));

        return [
            'score' => $score,
            'reasons' => $reasons,
            'explanation' => "The lead shows a conversion score of {$score}% primarily driven by: " . implode(', ', $reasons) . "."
        ];
    }

    public function forecastSales(array $historicalData): array
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $forecast = [];
        
        $baseValue = 12000000; // 12M default
        if (!empty($historicalData)) {
            $baseValue = end($historicalData)['value'] ?? $baseValue;
        }

        foreach ($months as $idx => $month) {
            // Apply a slight upward trend + random seasonality
            $growth = 1.02 + ($idx * 0.01);
            $seasonality = 1.0 + (sin($idx) * 0.08); 
            $forecastValue = $baseValue * $growth * $seasonality;

            $forecast[] = [
                'period' => "2026-" . str_pad($idx + 1, 2, '0', STR_PAD_LEFT),
                'month_name' => $month,
                'projected_value' => round($forecastValue, 2),
                'confidence_lower' => round($forecastValue * 0.90, 2),
                'confidence_upper' => round($forecastValue * 1.10, 2)
            ];
        }

        return $forecast;
    }

    public function predictCollectionRisk(Payment $payment): array
    {
        $riskScore = 15.0;
        $reasons = [];

        // Check if status is paid
        if ($payment->status === 'paid' || $payment->status === 'collected') {
            return [
                'score' => 0.0,
                'reasons' => ["Installment is already paid"],
                'explanation' => "This payment installment is already collected."
            ];
        }

        // Check due date
        if ($payment->due_date) {
            $dueDate = \Carbon\Carbon::parse($payment->due_date);
            if ($dueDate->isPast()) {
                $daysOverdue = $dueDate->diffInDays();
                if ($daysOverdue > 90) {
                    $riskScore += 50.0;
                    $reasons[] = "Installment is critically overdue by {$daysOverdue} days (+50%)";
                } elseif ($daysOverdue > 30) {
                    $riskScore += 30.0;
                    $reasons[] = "Installment is overdue by {$daysOverdue} days (+30%)";
                } else {
                    $riskScore += 15.0;
                    $reasons[] = "Installment is overdue by {$daysOverdue} days (+15%)";
                }
            } else {
                $daysRemaining = $dueDate->diffInDays();
                if ($daysRemaining < 7) {
                    $riskScore += 5.0;
                    $reasons[] = "Due date is approaching in {$daysRemaining} days (+5%)";
                } else {
                    $riskScore -= 5.0;
                    $reasons[] = "Comfortable lead time of {$daysRemaining} days (-5%)";
                }
            }
        }

        // Check customer payment history if contract exists
        if ($payment->contract && $payment->contract->customer) {
            $customer = $payment->contract->customer;
            // Count past due payments
            $overdueCount = Payment::whereHas('contract', function($q) use ($customer) {
                $q->where('customer_id', $customer->id);
            })->where('due_date', '<', now())
              ->whereNotIn('status', ['paid', 'collected'])
              ->count();

            if ($overdueCount > 1) {
                $riskScore += 20.0;
                $reasons[] = "Customer has {$overdueCount} other unpaid overdue installments (+20%)";
            }
        }

        $riskScore = max(5.0, min(99.0, $riskScore));

        return [
            'score' => $riskScore,
            'reasons' => $reasons,
            'explanation' => "The collection risk score is {$riskScore}% primarily driven by: " . implode(', ', $reasons) . "."
        ];
    }

    public function chatResponse(string $sessionId, string $message, ?array $history = []): array
    {
        $messageLower = strtolower($message);
        $tokens = str_word_count($message) + 120; // Simulated response size
        
        $response = "";

        if (Str::contains($messageLower, ['revenue', 'sales', 'target'])) {
            $response = "According to our financial general ledger, the Year-to-Date (YTD) Revenue stands at **45,280,000 EGP** against our annual target of **50,000,000 EGP**. We have already reached **90.5%** of our budget goals, with Project Alexandria Sales driving the highest profit margins.";
        } elseif (Str::contains($messageLower, ['lead', 'hot', 'conversion'])) {
            $response = "I have analyzed the current CRM pipelines. We have **142 active leads** logged this month. Our machine learning scoring model identifies **24 hot leads** with conversion probabilities exceeding **80%**. I recommend assigning them to the senior regional sales representatives immediately.";
        } elseif (Str::contains($messageLower, ['procurement', 'invoice', '3-way', 'po'])) {
            $response = "The procurement module has **8 pending Purchase Requests** and **3 active Purchase Orders** awaiting manager approvals. All vendor invoices submitted yesterday passed the 3-way match validation checks, and automatic double-entry liabilities were posted to accounts payable.";
        } elseif (Str::contains($messageLower, ['commission', 'payout'])) {
            $response = "The commission engine has successfully calculated overrides for all collections this week. There is currently **1 batch payout (PAY-2026-0004)** for **124,500 EGP** in `pending_approval` status, awaiting authorization from the department VP.";
        } elseif (Str::contains($messageLower, ['help', 'what can you do', 'menu'])) {
            $response = "I am the REDP Enterprise AI assistant. I can help you with:\n1. **Financial analysis** (YTD revenue, budgets, accounts payable/receivable)\n2. **CRM insights** (lead scoring, conversion, hot lead prioritization)\n3. **Procurement tracking** (PO statuses, invoice 3-way match exceptions)\n4. **Commissions overview** (calculating overrides, payout batches awaiting approval)\n5. **Simulations** (predicting sales forecast trendlines or debt collection risk)";
        } else {
            $response = "Thank you for asking! I am currently monitoring the ERP. Based on the system metrics, all operations are running smoothly. Let me know if you would like me to compile a specific report on financial ledgers, sales leads, or procurement workflows.";
        }

        return [
            'response' => $response,
            'tokens_used' => $tokens
        ];
    }

    public function summarizeCall(string $transcript): string
    {
        return "Call Summary:\n" .
               "- **Customer Intent**: Inquired about the 3-bedroom villa payment plans in Project Cairo West.\n" .
               "- **Lead Sentiment**: Highly positive (hot interest).\n" .
               "- **Action Item**: Sales representative promised to email the customized payment plans and schedule a site visit for next Friday.";
    }
}
