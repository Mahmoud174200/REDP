<?php

namespace App\Http\Controllers;

use App\Services\Ai\AssistantAgent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — AI Assistant Controller
 *
 * Two entry points to the same agentic Gemini assistant:
 *   - publicChat() : unauthenticated landing-page assistant
 *   - chat()       : authenticated staff/client assistant (role-scoped tools)
 * ─────────────────────────────────────────────────────────
 */
class AssistantController extends Controller
{
    protected AssistantAgent $agent;

    public function __construct(AssistantAgent $agent)
    {
        $this->agent = $agent;
    }

    /** Public assistant (landing page — prospects). */
    public function publicChat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => 'required|string|max:4000',
            'session_id' => 'required|string|max:100',
            'context' => 'sometimes|array',
            'context.page' => 'sometimes|nullable|string|max:255',
        ]);

        $result = $this->agent->chat($data['session_id'], $data['message'], 'public', null, $data['context'] ?? null);

        return response()->json(['success' => true, 'data' => $result]);
    }

    /** Internal assistant (dashboard — logged-in users). */
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => 'required|string|max:4000',
            'session_id' => 'required|string|max:100',
            'context' => 'sometimes|array',
            'context.page' => 'sometimes|nullable|string|max:255',
        ]);

        $result = $this->agent->chat($data['session_id'], $data['message'], 'internal', $request->user(), $data['context'] ?? null);

        return response()->json(['success' => true, 'data' => $result]);
    }

    /** Config for a real-time voice call (auth-gated). */
    public function liveConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'context' => 'sometimes|array',
            'context.page' => 'sometimes|nullable|string|max:255',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->agent->voiceSetup($request->user(), $data['context'] ?? null),
        ]);
    }

    /** Execute a tool requested by the model during a live voice call. */
    public function liveTool(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'args' => 'sometimes|array',
        ]);

        $result = $this->agent->executeVoiceTool($request->user(), $data['name'], $data['args'] ?? []);

        return response()->json(['success' => true, 'data' => $result]);
    }

    /** Reset a conversation. */
    public function clear(Request $request): JsonResponse
    {
        $data = $request->validate(['session_id' => 'required|string|max:100']);
        $this->agent->clear($data['session_id']);

        return response()->json(['success' => true, 'message' => 'Conversation cleared.']);
    }
}
