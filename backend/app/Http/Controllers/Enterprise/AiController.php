<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Ai\AiService;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\AiPrediction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Trigger scoring evaluation for a lead.
     */
    public function scoreLead(Request $request, Lead $lead): JsonResponse
    {
        try {
            $result = $this->aiService->getLeadScore($lead);
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error scoring lead: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Evaluate payment risk of collection default.
     */
    public function predictCollectionRisk(Request $request, Payment $payment): JsonResponse
    {
        try {
            $result = $this->aiService->getCollectionRisk($payment);
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error evaluating collection risk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve monthly sales forecasting metrics.
     */
    public function salesForecast(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id ?? null;
            $result = $this->aiService->getSalesForecast($companyId);
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error calculating sales forecast: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chat response sandbox for system chatbot agent.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'session_id' => 'required|string'
        ]);

        try {
            $companyId = $request->user()->company_id ?? null;
            $result = $this->aiService->handleChat(
                $request->input('session_id'),
                $request->input('message'),
                $companyId
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error handling chat: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset chat conversation history.
     */
    public function clearChat(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|string'
        ]);

        try {
            $this->aiService->clearChat($request->input('session_id'));
            return response()->json([
                'success' => true,
                'message' => 'Chat history cleared successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error clearing chat: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Query existing predictions lists.
     */
    public function getPredictions(Request $request): JsonResponse
    {
        try {
            $query = AiPrediction::with(['company']);

            if ($request->has('model_name')) {
                $query->where('model_name', $request->input('model_name'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Include references to models if lead scoring or collection risks
            $predictions = $query->orderBy('created_at', 'desc')->get();

            // Manually bind polymorphic relationships for display in UI
            foreach ($predictions as $pred) {
                if ($pred->entity_type === Lead::class && $pred->entity_id) {
                    $pred->entity = Lead::find($pred->entity_id);
                } elseif ($pred->entity_type === Payment::class && $pred->entity_id) {
                    $pred->entity = Payment::with(['contract.customer'])->find($pred->entity_id);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $predictions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading predictions: ' . $e->getMessage()
            ], 500);
        }
    }
}
