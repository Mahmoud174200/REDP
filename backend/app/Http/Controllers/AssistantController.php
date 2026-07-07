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

    /**
     * Start rendering a photoreal talking-head video (D-ID) of the character
     * speaking the given text. Returns a talk id to poll, or configured=false
     * when no D-ID key is set (so the client falls back to the 3D avatar + TTS).
     */
    public function avatarVideoCreate(Request $request): JsonResponse
    {
        $data = $request->validate(['text' => 'required|string|max:2000']);
        return config('services.avatar_video.provider') === 'did'
            ? $this->didCreate($data['text'])
            : $this->heygenCreate($data['text']);
    }

    /** Poll the talking-head render; returns the video url once done. */
    public function avatarVideoStatus(Request $request, string $id): JsonResponse
    {
        return config('services.avatar_video.provider') === 'did'
            ? $this->didStatus($id)
            : $this->heygenStatus($id);
    }

    // ── HeyGen (Video Generation API) ──
    protected function heygenCreate(string $text): JsonResponse
    {
        $key = config('services.heygen.key');
        if (empty($key)) {
            return response()->json(['success' => true, 'data' => ['configured' => false]]);
        }
        $ar = (bool) preg_match('/\p{Arabic}/u', $text);
        $voice = $ar ? config('services.heygen.voice_ar') : config('services.heygen.voice_id');
        $voiceCfg = ['type' => 'text', 'input_text' => $text];
        if (!empty($voice)) {
            $voiceCfg['voice_id'] = $voice;
        }

        $avatarId = config('services.heygen.avatar_id');
        $configured = config('services.heygen.character_type');
        // Auto-try: a 32-hex id is usually a Talking Photo; a named id is a stock avatar.
        $types = $configured ? [$configured] : (preg_match('/^[a-f0-9]{32}$/i', (string) $avatarId) ? ['talking_photo', 'avatar'] : ['avatar', 'talking_photo']);

        $lastErr = '';
        foreach ($types as $type) {
            $character = $type === 'talking_photo'
                ? ['type' => 'talking_photo', 'talking_photo_id' => $avatarId]
                : ['type' => 'avatar', 'avatar_id' => $avatarId, 'avatar_style' => 'normal'];
            try {
                $resp = \Illuminate\Support\Facades\Http::withOptions(['verify' => $this->caBundle()])
                    ->withHeaders(['X-Api-Key' => $key, 'Content-Type' => 'application/json'])
                    ->post('https://api.heygen.com/v2/video/generate', [
                        'video_inputs' => [['character' => $character, 'voice' => $voiceCfg]],
                        'dimension' => ['width' => 720, 'height' => 720],
                    ]);
                if ($resp->successful()) {
                    $j = $resp->json();
                    $vid = $j['data']['video_id'] ?? ($j['video_id'] ?? null);
                    if ($vid) {
                        return response()->json(['success' => true, 'data' => ['configured' => true, 'id' => $vid, 'character_type' => $type]]);
                    }
                    $lastErr = json_encode($j);
                } else {
                    $lastErr = $resp->body();
                }
            } catch (\Throwable $e) {
                $lastErr = $e->getMessage();
            }
        }
        return response()->json(['success' => false, 'message' => 'HeyGen create failed: ' . $lastErr], 502);
    }

    protected function heygenStatus(string $id): JsonResponse
    {
        $key = config('services.heygen.key');
        if (empty($key)) {
            return response()->json(['success' => true, 'data' => ['configured' => false]]);
        }
        try {
            $resp = \Illuminate\Support\Facades\Http::withOptions(['verify' => $this->caBundle()])
                ->withHeaders(['X-Api-Key' => $key])
                ->get('https://api.heygen.com/v1/video_status.get', ['video_id' => $id]);
            $d = $resp->json()['data'] ?? [];
            $status = $d['status'] ?? 'unknown'; // completed | processing | pending | failed
            $norm = $status === 'completed' ? 'done' : (in_array($status, ['failed', 'error'], true) ? 'error' : 'processing');
            return response()->json(['success' => true, 'data' => [
                'status' => $norm,
                'video_url' => $d['video_url'] ?? null,
            ]]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }
    }

    // ── D-ID (alternative provider) ──
    protected function didCreate(string $text): JsonResponse
    {
        $key = config('services.did.key');
        if (empty($key)) {
            return response()->json(['success' => true, 'data' => ['configured' => false]]);
        }
        $ar = (bool) preg_match('/\p{Arabic}/u', $text);
        $voice = $ar ? config('services.did.voice_ar') : config('services.did.voice_en');
        try {
            $resp = \Illuminate\Support\Facades\Http::withOptions(['verify' => $this->caBundle()])
                ->withHeaders(['Authorization' => 'Basic ' . $key])
                ->post('https://api.d-id.com/talks', [
                    'source_url' => config('services.did.source_url'),
                    'script' => ['type' => 'text', 'input' => $text, 'provider' => ['type' => 'microsoft', 'voice_id' => $voice]],
                    'config' => ['fluent' => true, 'pad_audio' => 0.0, 'stitch' => true],
                ]);
            if (!$resp->successful()) {
                return response()->json(['success' => false, 'message' => 'D-ID create failed: ' . $resp->body()], 502);
            }
            return response()->json(['success' => true, 'data' => ['configured' => true, 'id' => $resp->json()['id'] ?? null]]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }
    }

    protected function didStatus(string $id): JsonResponse
    {
        $key = config('services.did.key');
        if (empty($key)) {
            return response()->json(['success' => true, 'data' => ['configured' => false]]);
        }
        try {
            $resp = \Illuminate\Support\Facades\Http::withOptions(['verify' => $this->caBundle()])
                ->withHeaders(['Authorization' => 'Basic ' . $key])
                ->get('https://api.d-id.com/talks/' . urlencode($id));
            $j = $resp->json();
            return response()->json(['success' => true, 'data' => [
                'status' => $j['status'] ?? 'unknown',
                'video_url' => $j['result_url'] ?? null,
            ]]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 502);
        }
    }

    protected function caBundle(): bool|string
    {
        $ca = env('CURL_CA_BUNDLE') ?: storage_path('cacert.pem');
        return (is_string($ca) && is_file($ca)) ? $ca : true;
    }

    /** Reset a conversation. */
    public function clear(Request $request): JsonResponse
    {
        $data = $request->validate(['session_id' => 'required|string|max:100']);
        $this->agent->clear($data['session_id']);

        return response()->json(['success' => true, 'message' => 'Conversation cleared.']);
    }
}
