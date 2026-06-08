<?php

namespace App\Services\Ai;

use App\Models\Lead;
use App\Models\Payment;

interface AiProviderInterface
{
    /**
     * Scores a lead's conversion probability.
     * Returns ['score' => float, 'reasons' => array, 'explanation' => string]
     */
    public function scoreLead(Lead $lead): array;

    /**
     * Forecasts future sales pipelines.
     * Returns array of monthly project forecasts.
     */
    public function forecastSales(array $historicalData): array;

    /**
     * Predicts risk of default or delay on payment installments.
     * Returns ['score' => float, 'reasons' => array, 'explanation' => string]
     */
    public function predictCollectionRisk(Payment $payment): array;

    /**
     * Gets response from the AI agent assistant.
     * Returns ['response' => string, 'tokens_used' => int]
     */
    public function chatResponse(string $sessionId, string $message, ?array $history = []): array;

    /**
     * Summarizes transcripts of call logs.
     */
    public function summarizeCall(string $transcript): string;
}
