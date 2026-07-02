<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\CustomerSession;
use App\Models\Lead;
use App\Services\Acquisition\AttributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Controller: TrackingController  (PUBLIC, no auth)
 *
 * Handles the visitor-facing attribution surface:
 *  - GET  /r/{slug}              branded broker short link
 *  - GET  /api/v1/track/qr/{t}   QR code resolution
 *  - GET  /api/v1/track/resolve  ref/promo/qr/UTM → session + cookie
 *  - POST /api/v1/track/event    funnel/page-view ingestion
 *
 * Cookies set (http-only, signed):
 *  - redp_anon : stable 1st-party visitor id (1 year)
 *  - redp_ref  : last resolved broker referral code (90 days)
 * ─────────────────────────────────────────────────────────
 */
class TrackingController extends Controller
{
    public function __construct(private AttributionService $attribution) {}

    private const ANON_COOKIE = 'redp_anon';
    private const REF_COOKIE  = 'redp_ref';
    private const ANON_TTL    = 60 * 24 * 365;   // 1 year (minutes)
    private const REF_TTL     = 60 * 24 * 90;    // 90 days (minutes)

    /**
     * GET /r/{slug}
     * Branded broker short link → 302 to frontend register page with ?ref=.
     */
    public function shortLink(Request $request, string $slug): RedirectResponse
    {
        $broker = Broker::where('slug', $slug)->where('status', Broker::STATUS_ACTIVE)->first();

        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');

        if (!$broker) {
            return redirect()->away("{$frontend}/register");
        }

        $broker->increment('referral_clicks');

        $anonId = $this->ensureAnonId($request);
        $context = $this->attribution->resolveContext(
            $request->merge(['ref' => $broker->referral_code])
        );
        $this->attribution->captureSession($request, $context, $anonId);

        $target = "{$frontend}/register?ref={$broker->referral_code}";

        return redirect()->away($target)
            ->withCookie($this->anonCookie($anonId))
            ->withCookie(Cookie::make(self::REF_COOKIE, $broker->referral_code, self::REF_TTL, null, null, true, true));
    }

    /**
     * GET /api/v1/track/qr/{qr_token}
     * QR resolution → 302 with ref (same flow as short link).
     */
    public function qr(Request $request, string $qrToken): RedirectResponse
    {
        $broker = Broker::where('qr_token', $qrToken)->where('status', Broker::STATUS_ACTIVE)->first();
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');

        if (!$broker) {
            return redirect()->away("{$frontend}/register");
        }

        $broker->increment('referral_clicks');
        $anonId = $this->ensureAnonId($request);
        $context = $this->attribution->resolveContext($request->merge(['qr' => $qrToken]));
        $this->attribution->captureSession($request, $context, $anonId);

        return redirect()->away("{$frontend}/register?ref={$broker->referral_code}")
            ->withCookie($this->anonCookie($anonId))
            ->withCookie(Cookie::make(self::REF_COOKIE, $broker->referral_code, self::REF_TTL, null, null, true, true));
    }

    /**
     * GET /api/v1/track/resolve
     * Front-end SDK calls this on first load. Resolves attribution,
     * creates a session, returns the anon id + session token, sets cookie.
     */
    public function resolve(Request $request): JsonResponse
    {
        $anonId = $this->ensureAnonId($request);
        $context = $this->attribution->resolveContext($request);
        $session = $this->attribution->captureSession($request, $context, $anonId);

        $response = response()->json([
            'success' => true,
            'data'    => [
                'anon_id'       => $anonId,
                'session_token' => $session->session_token,
                'source_key'    => $context['source_key'],
                'broker_id'     => $context['broker']?->id,
                'suspicious'    => $context['suspicious'],
            ],
        ]);

        $response->withCookie($this->anonCookie($anonId));
        if ($context['broker']) {
            $response->withCookie(Cookie::make(self::REF_COOKIE, $context['broker']->referral_code, self::REF_TTL, null, null, true, true));
        }

        return $response;
    }

    /**
     * POST /api/v1/track/event
     * Ingest a funnel/page-view event. Lead linkage is resolved if the
     * visitor has already been identified (anon_id back-filled).
     */
    public function event(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'event_type' => 'required|string|in:page_view,visitor,lead,registered,eoi_paid,unit_reserved,contract_signed,completed_sale,custom',
            'anon_id'    => 'nullable|string|max:64',
            'event_id'   => 'nullable|string|max:80',
            'properties' => 'nullable|array',
        ]);

        $anonId  = $fields['anon_id'] ?? $this->ensureAnonId($request);
        $session = CustomerSession::where('anon_id', $anonId)->latest()->first();
        $lead    = $session?->lead_id ? Lead::find($session->lead_id) : Lead::where('anon_id', $anonId)->first();

        $event = $this->attribution->recordEvent(
            $fields['event_type'],
            $lead,
            $session,
            $anonId,
            $fields['properties'] ?? [],
            $fields['event_id'] ?? null
        );

        if ($session) {
            $session->forceFill(['last_seen_at' => now()])->save();
        }

        return response()->json([
            'success' => true,
            'data'    => ['event_id' => $event->id],
        ], 201)->withCookie($this->anonCookie($anonId));
    }

    // ───────────────────────── helpers ─────────────────────────

    private function ensureAnonId(Request $request): string
    {
        return $request->cookie(self::ANON_COOKIE)
            ?? $request->input('anon_id')
            ?? (string) Str::uuid();
    }

    private function anonCookie(string $anonId): \Symfony\Component\HttpFoundation\Cookie
    {
        // http-only + signed (via EncryptCookies) to resist manual tampering.
        return Cookie::make(self::ANON_COOKIE, $anonId, self::ANON_TTL, null, null, true, true);
    }
}
