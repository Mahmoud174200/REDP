<?php

namespace App\Services\Ai;

use App\Models\User;
use App\Models\AiConversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — AI Assistant Agent
 *
 * A full agentic chatbot built on Google Gemini with function calling.
 * It can hold a natural bilingual (Arabic/English) conversation AND take
 * real actions through {@see AssistantToolkit} (look up projects/units,
 * register leads, open tickets, read financials …).
 *
 * The same engine powers:
 *   - the public landing-page assistant (audience = 'public')
 *   - the internal staff/client assistant (audience = 'internal')
 *
 * Voice ("talk like a person") is handled in the browser: speech-to-text
 * feeds this agent text, and the agent's text reply is spoken back via
 * text-to-speech. This keeps everything runnable locally with no telephony.
 * ─────────────────────────────────────────────────────────
 */
class AssistantAgent
{
    /** Max function-calling round-trips before we force a text answer. */
    protected const MAX_STEPS = 6;

    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = (string) (config('services.gemini.key') ?: env('GEMINI_API_KEY', ''));
        $this->model = (string) (config('services.gemini.model') ?: 'gemini-2.5-flash');
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Guzzle `verify` value: an explicit CA bundle path when one is available
     * (fixes Windows/PHP setups with no curl.cainfo), otherwise true.
     */
    protected function caBundle(): bool|string
    {
        $ca = env('CURL_CA_BUNDLE') ?: storage_path('cacert.pem');
        return (is_string($ca) && is_file($ca)) ? $ca : true;
    }

    /**
     * Handle one turn of conversation.
     *
     * @return array{reply:string, tools_used:array, configured:bool}
     */
    public function chat(string $sessionId, string $message, string $audience = 'public', ?User $user = null, ?array $context = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'reply' => "🤖 The AI assistant isn't configured yet. Please add your GEMINI_API_KEY to the backend .env file."
                    . "\n\n🤖 لم يتم إعداد المساعد الذكي بعد. الرجاء إضافة مفتاح GEMINI_API_KEY في ملف .env.",
                'tools_used' => [],
                'configured' => false,
            ];
        }

        $toolkit = new AssistantToolkit($audience, $user);

        // Dynamic tool loading: choose the tools relevant to this turn + page.
        $page = is_array($context) ? ($context['page'] ?? null) : null;
        $declarations = $toolkit->selectDeclarations($message, $page);

        $conversation = AiConversation::firstOrCreate([
            'session_id' => $sessionId,
            'company_id' => $user->company_id ?? null,
        ]);

        // Persisted history is text-only turns in Gemini "contents" shape.
        $history = $conversation->metadata['assistant_history'] ?? [];

        $contents = $history;
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $toolsUsed = [];
        $replyText = '';
        $tokens = 0;

        $requestContents = $contents;

        for ($step = 0; $step < self::MAX_STEPS; $step++) {
            $data = $this->callGemini($requestContents, $declarations, $audience, $user, $context);

            if ($data === null) {
                $replyText = $replyText ?: "Sorry, I couldn't reach the AI service right now. Please try again.\nعذراً، تعذّر الوصول إلى الخدمة الآن. حاول مرة أخرى.";
                break;
            }

            $tokens += (int) ($data['usageMetadata']['totalTokenCount'] ?? 0);
            $candidate = $data['candidates'][0] ?? null;
            $parts = $candidate['content']['parts'] ?? [];

            $functionCalls = array_values(array_filter($parts, fn ($p) => isset($p['functionCall'])));

            if (!empty($functionCalls)) {
                // Record the model's function-call turn. Normalise each call's
                // `args`: an empty {} comes back from json_decode as [] and would
                // re-encode as an invalid JSON list — force it back to an object.
                $modelContent = $candidate['content'];
                if (isset($modelContent['parts']) && is_array($modelContent['parts'])) {
                    foreach ($modelContent['parts'] as $i => $part) {
                        if (isset($part['functionCall'])) {
                            $modelContent['parts'][$i]['functionCall']['args'] = (object) ($part['functionCall']['args'] ?? []);
                        }
                    }
                }
                $requestContents[] = $modelContent;

                $responseParts = [];
                foreach ($functionCalls as $call) {
                    $fnName = $call['functionCall']['name'] ?? '';
                    $fnArgs = (array) ($call['functionCall']['args'] ?? []);
                    $result = $toolkit->execute($fnName, $fnArgs);
                    $toolsUsed[] = $fnName;

                    $responseParts[] = [
                        'functionResponse' => [
                            'name' => $fnName,
                            'response' => ['result' => $result],
                        ],
                    ];
                }

                // Gemini REST expects the function results in a role:"user" turn.
                $requestContents[] = ['role' => 'user', 'parts' => $responseParts];
                continue; // let the model use the results
            }

            // No function call → collect the text answer.
            $replyText = trim(implode('', array_map(fn ($p) => $p['text'] ?? '', $parts)));
            break;
        }

        if ($replyText === '') {
            $replyText = "Sorry, I wasn't able to complete that. Could you rephrase?\nعذراً، لم أتمكن من إتمام ذلك. هل يمكنك إعادة الصياغة؟";
        }

        // Persist compact text-only history so future turns keep context.
        $history[] = ['role' => 'user', 'parts' => [['text' => $message]]];
        $history[] = ['role' => 'model', 'parts' => [['text' => $replyText]]];
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        $conversation->update([
            'context_summary' => 'AI Assistant • ' . mb_substr($message, 0, 60),
            'tokens_used' => (int) $conversation->tokens_used + $tokens,
            'metadata' => array_merge($conversation->metadata ?? [], ['assistant_history' => $history]),
        ]);

        return [
            'reply' => $replyText,
            'tools_used' => array_values(array_unique($toolsUsed)),
            'configured' => true,
        ];
    }

    public function clear(string $sessionId): void
    {
        AiConversation::where('session_id', $sessionId)->delete();
    }

    /**
     * Setup payload for a real-time voice call (Gemini Live API). The browser
     * connects to the Live WebSocket with these and relays tool calls back to
     * /assistant/live-tool. Tools stay role-scoped via the same toolkit.
     *
     * NOTE: api_key is returned to the authenticated browser so it can open the
     * WebSocket directly. For production, mint a short-lived ephemeral token
     * server-side (v1alpha auth_tokens) and return that instead of the key.
     */
    public function voiceSetup(?User $user, ?array $context = null): array
    {
        $toolkit = new AssistantToolkit('internal', $user);

        $prompt = $this->systemPrompt('internal', $user, $context)
            . "\n\nVOICE CALL MODE: You are on a live phone call. Keep every reply short and conversational — one or two natural sentences. "
            . "Never read out markdown, IDs, URLs or long lists; summarise like a human on the phone. You can still call tools while talking.";

        // Female voice (Nour) for customers; a neutral female voice is fine for staff too.
        $voice = ($user && ($user->role ?? '') === 'client') ? 'Leda' : 'Aoede';

        return [
            'configured' => $this->isConfigured(),
            'model' => (string) (config('services.gemini.live_model') ?: 'gemini-2.5-flash-native-audio-latest'),
            'api_key' => $this->apiKey,
            'system_instruction' => $prompt,
            'tools' => $toolkit->declarations(),
            'voice_name' => $voice,
        ];
    }

    /** Execute a single tool for a live voice session (role-scoped). */
    public function executeVoiceTool(?User $user, string $name, array $args): array
    {
        $toolkit = new AssistantToolkit('internal', $user);
        return $toolkit->execute($name, $args);
    }

    /**
     * One raw call to Gemini generateContent. Returns decoded JSON or null.
     */
    protected function callGemini(array $contents, array $declarations, string $audience, ?User $user, ?array $context = null): ?array
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $this->systemPrompt($audience, $user, $context)]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.5,
                'maxOutputTokens' => 1024,
            ],
        ];

        if (!empty($declarations)) {
            $payload['tools'] = [['function_declarations' => $declarations]];
        }

        // Retry on transient failures (429 rate-limit, 500/503 overloaded, network).
        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $response = Http::withOptions(['verify' => $this->caBundle()])->timeout(30)->post($url, $payload);
                if ($response->successful()) {
                    return $response->json();
                }
                $status = $response->status();
                if (in_array($status, [429, 500, 503], true) && $attempt < $maxAttempts) {
                    usleep(700000 * $attempt); // 0.7s, then 1.4s backoff
                    continue;
                }
                Log::warning('[AssistantAgent] Gemini HTTP ' . $status . ': ' . $response->body());
                return null;
            } catch (\Throwable $e) {
                if ($attempt < $maxAttempts) {
                    usleep(700000 * $attempt);
                    continue;
                }
                Log::error('[AssistantAgent] Gemini exception: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * Persona + operating rules injected on every request.
     */
    protected function systemPrompt(string $audience, ?User $user, ?array $context = null): string
    {
        $today = now()->toFormattedDateString();
        $isCustomer = $audience === 'public' || ($user && ($user->role ?? '') === 'client');
        $name = $isCustomer ? 'Nour' : 'Aiva';
        $persona = $isCustomer
            ? 'You are a warm, friendly, caring young female real-estate consultant — personable and human, never robotic. Introduce yourself as Nour if greeting.'
            : '';

        $base = <<<PROMPT
You are "{$name}", REDP's AI assistant — a real-estate developer platform in Egypt selling apartments and villas in gated compounds. Today is {$today}. All money is in Egyptian Pounds (EGP). {$persona}

PERSONALITY & VOICE:
- Talk like a warm, professional human agent on a phone call — friendly, natural and concise. Your replies may be read aloud by text-to-speech, so avoid markdown tables, long bullet lists, code, emojis and links. Speak in short natural sentences.
- Detect the user's language automatically. If they write in Arabic, reply in Egyptian Arabic; if in English, reply in English. Never mix languages in one reply unless the user does.

GROUNDING (very important):
- NEVER invent projects, unit numbers, prices, availability, names, balances or figures. Whenever the user asks about real data, CALL A TOOL first and answer only from the tool result.
- For any question about company POLICY, procedures, rules, how a process works, refunds, cancellations, commissions, handover, KYC, payment rules or FAQs, call search_knowledge_base and answer ONLY from what it returns — then CITE the source title(s) you used (e.g. "according to the EOI Reservation Policy…"). Never answer a policy/procedure question from your own general knowledge; if the knowledge base has nothing relevant, say the information isn't documented yet.
- If a tool returns nothing or an error, say so honestly and offer an alternative.
- When speaking, summarise: mention a few options and offer to give more detail, instead of dumping long lists.

BEING HELPFUL & TAKING ACTION:
- You can actually perform actions through your tools, not just talk. Use them proactively.
- If a prospect is interested, collect their name and phone number, read the phone back to confirm, then register them with the create_lead tool and reassure them the sales team will follow up.

RELIABILITY & PERMISSIONS:
- Prioritise accuracy over speed. If a request is ambiguous, or you are missing a detail needed to act safely (which record, a required field, or confirmation before a bulk/irreversible action), ASK a short clarifying question instead of guessing.
- Your available tools already reflect THIS user's permissions. If the user asks for something you have no tool for, do not pretend to do it — briefly explain that it needs a specific role/permission (e.g. finance officer or admin) and offer an alternative (ask a colleague with that access, or what you CAN do instead).
PROMPT;

        $base .= $this->awarenessBlock($audience, $user, $context);

        if ($audience === 'internal') {
            $name = $user->name ?? 'colleague';
            $role = $user->role ?? 'staff';
            $base .= "\n\nCONTEXT: You are inside the staff dashboard. The logged-in user is {$name} (role: {$role}). "
                . "Help them do their job — look up leads, inventory, sales KPIs, client balances, EOI reservations, open tickets — using your tools. "
                . "Only the tools you were given are available; if you lack a tool for something, say it's outside your access.\n"
                . "IMPORTANT — when the user names a specific PERSON and asks about their status, situation, or details "
                . "(e.g. 'what is Sara Ali's status', 'سارة علي ايه وضعها', 'اظهر بيانات احمد'), that is a lookup of a lead/client — "
                . "call get_lead_details (it also returns that person's EOI reservation status) or get_eoi_reservation. "
                . "NEVER answer a question about a named person with generic project/unit information.\n"
                . "NAME MATCHING — records may be stored in Latin/English letters even when the user writes the name in Arabic (or vice-versa). "
                . "If a name lookup returns nothing, ALWAYS try again with the name transliterated into the other script before giving up "
                . "(e.g. 'سارة علي' → 'Sara Ali', 'أحمد' → 'Ahmed', 'Mohamed' → 'محمد'). Only after both fail, say you couldn't find them and ask for a phone or email.\n"
                . "RE-CHECK ON REPEAT — if the user asks something you previously said you 'couldn't find' or 'don't have info on', DO NOT simply repeat that earlier answer. "
                . "Data and tools change between messages, so you MUST actually call the lookup tool again (including the transliteration retry) before responding. "
                . "Do NOT reply with only a promise like 'I'm searching now' / 'أنا ببحث دلوقتي' — actually invoke the tool in this same turn and answer from its result.";
        } else {
            $base .= "\n\nCONTEXT: You are the public assistant on the company website, talking to potential buyers. "
                . "Be persuasive but honest, help them find a suitable unit, and capture their contact details as a lead when they show interest.";
        }

        return $base;
    }

    /**
     * "Who am I talking to and where are they" — injected so responses adapt
     * to auth state, role, account status and the current page/workflow.
     */
    protected function awarenessBlock(string $audience, ?User $user, ?array $context): string
    {
        if ($audience === 'internal' && $user) {
            $role = $user->role ?? 'staff';
            $authState = $role === 'admin'
                ? 'ADMINISTRATOR'
                : ($role === 'client' ? 'logged-in CUSTOMER (client)' : 'logged-in EMPLOYEE');
            $line = "\n\nCURRENT CONTEXT (stay aware of this every reply):\n"
                . "- Auth state: {$authState}. Name: " . ($user->name ?? 'colleague')
                . ". Role: {$role}. Account status: " . ($user->status ?? 'unknown') . ".";
        } else {
            $line = "\n\nCURRENT CONTEXT (stay aware of this every reply):\n"
                . "- Auth state: GUEST VISITOR (not logged in). Treat them as a prospective buyer.";
        }

        if ($hint = $this->pageHint($context)) {
            $line .= "\n- The user is currently on {$hint}. Tailor your help to what they are likely doing there, and prefer actions relevant to this page.";
        }

        return $line;
    }

    /** Map the current route the widget reported to a human description. */
    protected function pageHint(?array $context): ?string
    {
        $page = is_array($context) ? trim((string) ($context['page'] ?? '')) : '';
        if ($page === '') {
            return null;
        }

        $map = [
            '/acquisition/eoi-reservations' => 'the EOI Reservations page (submit, review, approve/reject EOIs, invite approved clients in queue order, and queue prioritisation rules)',
            '/acquisition/leads' => 'the Leads page (lead management and KYC)',
            '/acquisition/crm' => 'the CRM sales pipeline (Kanban) page',
            '/acquisition/brokers' => 'the Brokers page',
            '/acquisition/kyc' => 'the KYC Approvals page',
            '/acquisition/campaigns' => 'the Marketing Campaigns page',
            '/sales/tele' => 'the Tele-Sales portal',
            '/sales/broker' => 'the Broker portal',
            '/sales/company' => 'the Company Sales portal',
            '/sales/priorities' => 'the Booking Priorities board',
            '/finance/inventory' => 'the Unit Inventory page',
            '/finance/contracts' => 'the Contracts page',
            '/finance/collections' => 'the Collections and aging-debt page',
            '/finance/plan-approvals' => 'the custom Payment-Plan Approvals page',
            '/finance/reserved' => 'the Reserved Units page',
            '/finance/payments' => 'the Finance overview / payments page',
            '/finance/ledger' => 'the payments ledger page',
            '/delivery/overview' => 'the Delivery overview / client portal page',
            '/delivery/maintenance' => 'the Maintenance Tickets page',
            '/delivery/handover' => 'the Handover and snagging inspection page',
            '/delivery/documents' => 'the Document Vault (DMS) page',
            '/delivery/analytics' => 'the BI analytics / cash-flow page',
            '/delivery/workflows' => 'the Workflow Automation page',
            '/admin/panel' => 'the Admin panel (users, projects, units, configs)',
            '/admin/master-plan' => 'the project Master Plan editor',
            '/enterprise/accounting' => 'the Accounting / ERP pages',
            '/enterprise/procurement' => 'the Procurement pages',
            '/enterprise/commission' => 'the Commission pages',
            '/enterprise/legal' => 'the Legal case management page',
            '/enterprise/rbac' => 'the roles & permissions (RBAC) page',
            '/enterprise' => 'an Enterprise module page',
            '/unit-selection' => 'the interactive 3D unit-selection page',
            '/' => 'the public landing page',
        ];

        foreach ($map as $prefix => $desc) {
            if ($prefix !== '/' && str_starts_with($page, $prefix)) {
                return $desc;
            }
        }
        if ($page === '/') {
            return $map['/'];
        }

        return "the '{$page}' page";
    }
}
