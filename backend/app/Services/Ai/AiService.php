<?php

namespace App\Services\Ai;

use App\Models\Lead;
use App\Models\Payment;
use App\Models\AiPrediction;
use App\Models\AiConversation;
use Illuminate\Support\Facades\DB;

class AiService
{
    protected AiProviderInterface $provider;

    public function __construct()
    {
        $providerName = env('AI_PROVIDER', 'local');
        
        if ($providerName === 'gemini') {
            $this->provider = new GeminiProvider();
        } else {
            $this->provider = new LocalMockProvider();
        }
    }

    /**
     * Score a single lead and cache it in the database.
     */
    public function getLeadScore(Lead $lead): array
    {
        $result = $this->provider->scoreLead($lead);

        AiPrediction::updateOrCreate(
            [
                'model_name' => 'lead_scoring',
                'entity_type' => Lead::class,
                'entity_id' => $lead->id,
            ],
            [
                'company_id' => $lead->company_id,
                'prediction_score' => $result['score'],
                'prediction_output' => [
                    'reasons' => $result['reasons'],
                    'explanation' => $result['explanation']
                ],
                'status' => 'completed'
            ]
        );

        return $result;
    }

    /**
     * Predict default risk for a single payment.
     */
    public function getCollectionRisk(Payment $payment): array
    {
        $result = $this->provider->predictCollectionRisk($payment);

        AiPrediction::updateOrCreate(
            [
                'model_name' => 'collection_risk',
                'entity_type' => Payment::class,
                'entity_id' => $payment->id,
            ],
            [
                'company_id' => $payment->contract ? $payment->contract->company_id : null,
                'prediction_score' => $result['score'],
                'prediction_output' => [
                    'reasons' => $result['reasons'],
                    'explanation' => $result['explanation']
                ],
                'status' => 'completed'
            ]
        );

        return $result;
    }

    /**
     * Compute sales forecasting trends based on historical collections.
     */
    public function getSalesForecast(?string $companyId = null): array
    {
        // 1. Gather historical collections data from the past 12 months
        $historicalData = DB::table('payments')
            ->select(
                DB::raw("DATE_FORMAT(due_date, '%Y-%m') as period"),
                DB::raw("SUM(amount) as value")
            )
            ->where('status', 'paid')
            ->where('due_date', '>=', now()->subMonths(12))
            ->groupBy('period')
            ->orderBy('period', 'asc')
            ->get()
            ->toArray();

        // Map to array format
        $mappedHistory = array_map(function($item) {
            return [
                'period' => $item->period,
                'value' => (float)$item->value
            ];
        }, $historicalData);

        // 2. Query provider forecast
        $forecast = $this->provider->forecastSales($mappedHistory);

        // 3. Cache the forecast prediction output
        AiPrediction::updateOrCreate(
            [
                'model_name' => 'sales_forecast',
                'entity_type' => null,
                'entity_id' => null,
                'company_id' => $companyId
            ],
            [
                'prediction_score' => 100.00,
                'prediction_output' => [
                    'history' => $mappedHistory,
                    'forecast' => $forecast
                ],
                'status' => 'completed'
            ]
        );

        return [
            'history' => $mappedHistory,
            'forecast' => $forecast
        ];
    }

    /**
     * Dialog handler for system chatbot sandbox.
     */
    public function handleChat(string $sessionId, string $message, ?string $companyId = null): array
    {
        // Fetch or create AI conversation tracking record
        $conversation = AiConversation::firstOrCreate([
            'session_id' => $sessionId,
            'company_id' => $companyId
        ]);

        // Get past dialogue context metadata
        $history = $conversation->metadata['chat_history'] ?? [];

        // Call active provider
        $result = $this->provider->chatResponse($sessionId, $message, $history);

        // Append to local context log
        $history[] = ['role' => 'user', 'content' => $message];
        $history[] = ['role' => 'assistant', 'content' => $result['response']];

        // Keep last 10 messages to limit context size
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        // Generate summary description of what was discussed (simple logic)
        $summary = "Chat Session about " . trim(substr($message, 0, 40)) . "...";

        // Save conversation state
        $conversation->update([
            'context_summary' => $summary,
            'tokens_used' => $conversation->tokens_used + $result['tokens_used'],
            'metadata' => [
                'chat_history' => $history
            ]
        ]);

        return [
            'response' => $result['response'],
            'history' => $history
        ];
    }

    /**
     * Clear active session history.
     */
    public function clearChat(string $sessionId): void
    {
        AiConversation::where('session_id', $sessionId)->delete();
    }
}
