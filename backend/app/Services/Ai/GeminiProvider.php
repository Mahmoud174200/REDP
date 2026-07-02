<?php

namespace App\Services\Ai;

use App\Models\Lead;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements AiProviderInterface
{
    protected ?string $apiKey;
    protected string $model;
    protected LocalMockProvider $mockFallback;

    public function __construct()
    {
        // Try getting from config or env
        $this->apiKey = config('services.gemini.key') ?: env('GEMINI_API_KEY');
        $this->model = config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');
        $this->mockFallback = new LocalMockProvider();
    }

    protected function callGemini(string $prompt, ?array $jsonSchema = null): ?string
    {
        if (empty($this->apiKey)) {
            return null;
        }

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key=" . $this->apiKey;

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ];

            if ($jsonSchema) {
                $payload['generationConfig'] = [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => $jsonSchema
                ];
            }

            $caBundle = env('CURL_CA_BUNDLE') ?: storage_path('cacert.pem');
            $verify = (is_string($caBundle) && is_file($caBundle)) ? $caBundle : true;
            $response = Http::withOptions(['verify' => $verify])->timeout(10)->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::warning("Gemini API call returned status code: " . $response->status() . " with response: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Gemini Provider exception encountered: " . $e->getMessage());
        }

        return null;
    }

    public function scoreLead(Lead $lead): array
    {
        if (empty($this->apiKey)) {
            return $this->mockFallback->scoreLead($lead);
        }

        $leadData = [
            'status' => $lead->status,
            'budget' => $lead->budget,
            'source' => $lead->source,
            'notes' => $lead->notes,
            'interactions_count' => $lead->interactions()->count()
        ];

        $prompt = "Analyze the following real estate CRM lead parameters and calculate their conversion probability (0.00 to 100.00) to buy a property. You must return a JSON object with fields: 'score' (number), 'reasons' (array of strings outlining positives/negatives), and 'explanation' (string summaries).\n\nLead Details:\n" . json_encode($leadData, JSON_PRETTY_PRINT);

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'score' => ['type' => 'NUMBER'],
                'reasons' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                'explanation' => ['type' => 'STRING']
            ],
            'required' => ['score', 'reasons', 'explanation']
        ];

        $res = $this->callGemini($prompt, $schema);
        if ($res) {
            $parsed = json_decode($res, true);
            if ($parsed && isset($parsed['score'])) {
                return $parsed;
            }
        }

        return $this->mockFallback->scoreLead($lead);
    }

    public function forecastSales(array $historicalData): array
    {
        if (empty($this->apiKey)) {
            return $this->mockFallback->forecastSales($historicalData);
        }

        $prompt = "Given the historical monthly sales values, project the next 12 months values including confidence margins. Return a JSON array of objects, where each object has: 'period' (string, e.g. '2026-01'), 'month_name' (string, e.g. 'Jan'), 'projected_value' (number), 'confidence_lower' (number), and 'confidence_upper' (number).\n\nHistorical Monthly Data:\n" . json_encode($historicalData, JSON_PRETTY_PRINT);

        $schema = [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'period' => ['type' => 'STRING'],
                    'month_name' => ['type' => 'STRING'],
                    'projected_value' => ['type' => 'NUMBER'],
                    'confidence_lower' => ['type' => 'NUMBER'],
                    'confidence_upper' => ['type' => 'NUMBER']
                ],
                'required' => ['period', 'month_name', 'projected_value', 'confidence_lower', 'confidence_upper']
            ]
        ];

        $res = $this->callGemini($prompt, $schema);
        if ($res) {
            $parsed = json_decode($res, true);
            if (is_array($parsed) && !empty($parsed)) {
                return $parsed;
            }
        }

        return $this->mockFallback->forecastSales($historicalData);
    }

    public function predictCollectionRisk(Payment $payment): array
    {
        if (empty($this->apiKey)) {
            return $this->mockFallback->predictCollectionRisk($payment);
        }

        $paymentData = [
            'amount' => $payment->amount,
            'due_date' => $payment->due_date,
            'status' => $payment->status,
            'days_overdue' => $payment->due_date ? \Carbon\Carbon::parse($payment->due_date)->diffInDays(now(), false) : 0,
            'customer_name' => $payment->contract && $payment->contract->customer ? $payment->contract->customer->name : 'N/A'
        ];

        $prompt = "Evaluate the default / delay risk percentage (0.00 to 100.00) of this real estate payment installment. Return a JSON object with: 'score' (number representing risk probability), 'reasons' (array of strings detailing risk factors), and 'explanation' (string text summary).\n\nPayment Details:\n" . json_encode($paymentData, JSON_PRETTY_PRINT);

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'score' => ['type' => 'NUMBER'],
                'reasons' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                'explanation' => ['type' => 'STRING']
            ],
            'required' => ['score', 'reasons', 'explanation']
        ];

        $res = $this->callGemini($prompt, $schema);
        if ($res) {
            $parsed = json_decode($res, true);
            if ($parsed && isset($parsed['score'])) {
                return $parsed;
            }
        }

        return $this->mockFallback->predictCollectionRisk($payment);
    }

    public function chatResponse(string $sessionId, string $message, ?array $history = []): array
    {
        if (empty($this->apiKey)) {
            return $this->mockFallback->chatResponse($sessionId, $message, $history);
        }

        // Build simple conversational prompt with short system context
        $systemInstructions = "You are REDP Enterprise AI assistant. You have access to real estate ERP data including leads, accounting ledgers, purchase workflows, and commission calculations. Answer user queries professionally and concisely. If they ask about YTD revenue, budget, leads or commissions, provide helpful realistic summaries. Keep response under 150 words.";
        
        $prompt = $systemInstructions . "\n\nChat History:\n";
        foreach ($history as $h) {
            $role = $h['role'] === 'user' ? 'User' : 'Assistant';
            $prompt .= $role . ": " . $h['content'] . "\n";
        }
        $prompt .= "User: " . $message . "\nAssistant:";

        $res = $this->callGemini($prompt);
        if ($res) {
            $tokens = str_word_count($res) + str_word_count($prompt);
            return [
                'response' => trim($res),
                'tokens_used' => $tokens
            ];
        }

        return $this->mockFallback->chatResponse($sessionId, $message, $history);
    }

    public function summarizeCall(string $transcript): string
    {
        if (empty($this->apiKey)) {
            return $this->mockFallback->summarizeCall($transcript);
        }

        $prompt = "Summarize the following customer VoIP call transcript into bullet points highlighting key client intent, sentiment, and rep action items:\n\nTranscript:\n" . $transcript;
        
        $res = $this->callGemini($prompt);
        return $res ?: $this->mockFallback->summarizeCall($transcript);
    }
}
