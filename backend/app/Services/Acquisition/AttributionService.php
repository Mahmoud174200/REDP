<?php

namespace App\Services\Acquisition;

use App\Models\Broker;
use App\Models\Campaign;
use App\Models\CustomerEvent;
use App\Models\CustomerSession;
use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadSource;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Service: AttributionService
 *
 * Responsible for:
 *  - Resolving a channel/broker from ?ref / ?qr / ?promo / UTM
 *  - Capturing anonymous visitor sessions (pre-lead)
 *  - Recording immutable attribution touches on a lead
 *  - Recording funnel events
 *  - Back-filling anonymous history onto a lead at identification
 * ─────────────────────────────────────────────────────────
 */
class AttributionService
{
    /**
     * Resolve marketing context from request inputs.
     * Validates broker referral ownership (broker must be active);
     * forged/invalid codes degrade gracefully to organic and are flagged.
     *
     * @return array{
     *   source_key: string, broker: ?Broker, campaign: ?Campaign,
     *   promo_code: ?string, utm: array, suspicious: bool
     * }
     */
    public function resolveContext(Request $request): array
    {
        $ref   = $request->query('ref') ?? $request->input('ref');
        $promo = $request->query('promo') ?? $request->input('promo');
        $qr    = $request->query('qr') ?? $request->input('qr');

        $utm = [
            'utm_source'   => $request->input('utm_source'),
            'utm_medium'   => $request->input('utm_medium'),
            'utm_campaign' => $request->input('utm_campaign'),
            'utm_content'  => $request->input('utm_content'),
            'utm_term'     => $request->input('utm_term'),
        ];

        $broker = null;
        $sourceKey = null;
        $suspicious = false;

        if ($ref) {
            $broker = Broker::where('referral_code', $ref)->first();
            $sourceKey = LeadSource::BROKER_REFERRAL;
        } elseif ($qr) {
            $broker = Broker::where('qr_token', $qr)->first();
            $sourceKey = LeadSource::BROKER_QR;
        } elseif ($promo) {
            $broker = Broker::where('promo_code', $promo)->first();
            $sourceKey = LeadSource::PROMO_CODE;
        }

        // Referral was supplied but did not resolve to an ACTIVE broker → degrade + flag.
        if ($sourceKey && (!$broker || $broker->status !== Broker::STATUS_ACTIVE)) {
            $suspicious = true;
            AuditLogService::log('SUSPICIOUS_REFERRAL', auth()->id(), [
                'ref' => $ref, 'qr' => $qr, 'promo' => $promo,
                'reason' => $broker ? 'broker_not_active' : 'broker_not_found',
            ]);
            $broker = null;
            $sourceKey = null;
        }

        // No broker context → derive from UTM / referrer.
        if (!$sourceKey) {
            $sourceKey = $this->deriveSourceFromUtm($utm, $request);
        }

        $campaign = $this->resolveCampaign($utm);

        return [
            'source_key' => $sourceKey,
            'broker'     => $broker,
            'campaign'   => $campaign,
            'promo_code' => $promo,
            'utm'        => $utm,
            'suspicious' => $suspicious,
        ];
    }

    /**
     * Create/update an anonymous visitor session from resolved context.
     */
    public function captureSession(Request $request, array $context, string $anonId): CustomerSession
    {
        $ua = $request->userAgent();
        [$device, $os, $browser] = $this->parseUserAgent($ua);

        $broker = $context['broker'];
        $campaign = $context['campaign'];

        return CustomerSession::create([
            'anon_id'       => $anonId,
            'session_token' => (string) Str::uuid(),
            'source_key'    => $context['source_key'],
            'broker_id'     => $broker?->id,
            'campaign_id'   => $campaign?->id,
            'promo_code'    => $context['promo_code'],
            'utm_source'    => $context['utm']['utm_source'],
            'utm_medium'    => $context['utm']['utm_medium'],
            'utm_campaign'  => $context['utm']['utm_campaign'],
            'utm_content'   => $context['utm']['utm_content'],
            'utm_term'      => $context['utm']['utm_term'],
            'landing_page'  => $request->input('landing_page') ?? $request->fullUrl(),
            'referrer'      => $request->input('referrer') ?? $request->header('referer'),
            'ip_address'    => $request->ip(),
            'device'        => $device,
            'os'            => $os,
            'browser'       => $browser,
            'user_agent'    => $ua,
            'started_at'    => now(),
            'last_seen_at'  => now(),
        ]);
    }

    /**
     * Record an immutable attribution touch on a lead and refresh the
     * lead's first/last-touch summary. Does NOT change ownership.
     */
    public function recordTouch(Lead $lead, array $context, ?CustomerSession $session = null): LeadAttribution
    {
        $isFirst = !$lead->attributions()->exists();
        $broker = $context['broker'] ?? null;
        $campaign = $context['campaign'] ?? null;

        $touch = LeadAttribution::create([
            'lead_id'      => $lead->id,
            'session_id'   => $session?->id,
            'touch_type'   => $isFirst ? LeadAttribution::TOUCH_FIRST : LeadAttribution::TOUCH_LAST,
            'source_key'   => $context['source_key'] ?? LeadSource::DIRECT,
            'broker_id'    => $broker?->id,
            'campaign_id'  => $campaign?->id,
            'promo_code'   => $context['promo_code'] ?? null,
            'utm_source'   => $context['utm']['utm_source'] ?? null,
            'utm_medium'   => $context['utm']['utm_medium'] ?? null,
            'utm_campaign' => $context['utm']['utm_campaign'] ?? null,
            'utm_content'  => $context['utm']['utm_content'] ?? null,
            'utm_term'     => $context['utm']['utm_term'] ?? null,
            'landing_page' => $session?->landing_page,
            'referrer'     => $session?->referrer,
            'ip_address'   => $session?->ip_address ?? request()->ip(),
            'country'      => $session?->country,
            'city'         => $session?->city,
            'device'       => $session?->device,
            'os'           => $session?->os,
            'browser'      => $session?->browser,
            'occurred_at'  => now(),
            'tenant_id'    => $lead->tenant_id,
        ]);

        // Demote any previous "last" touch to intermediate.
        if (!$isFirst) {
            LeadAttribution::where('lead_id', $lead->id)
                ->where('id', '!=', $touch->id)
                ->where('touch_type', LeadAttribution::TOUCH_LAST)
                ->update(['touch_type' => LeadAttribution::TOUCH_INTERMEDIATE]);
        }

        // Refresh denormalized summary on the lead.
        $sourceModel = $this->sourceIdFor($context['source_key'] ?? LeadSource::DIRECT);
        $patch = [
            'current_source_id' => $sourceModel,
            'last_touch_at'     => $touch->occurred_at,
        ];
        if ($isFirst) {
            $patch['original_source_id'] = $sourceModel;
            $patch['first_touch_at']     = $touch->occurred_at;
        }
        $lead->forceFill($patch)->save();

        return $touch;
    }

    /**
     * Record a funnel/journey event. Idempotent when $eventId provided.
     */
    public function recordEvent(
        string $eventType,
        ?Lead $lead = null,
        ?CustomerSession $session = null,
        ?string $anonId = null,
        array $properties = [],
        ?string $eventId = null
    ): CustomerEvent {
        if ($eventId) {
            $existing = CustomerEvent::where('event_id', $eventId)->first();
            if ($existing) {
                return $existing;
            }
        }

        return CustomerEvent::create([
            'lead_id'     => $lead?->id,
            'session_id'  => $session?->id,
            'anon_id'     => $anonId ?? $session?->anon_id ?? $lead?->anon_id,
            'event_id'    => $eventId,
            'event_type'  => $eventType,
            'stage'       => $properties['stage'] ?? null,
            'properties'  => $properties,
            'occurred_at' => now(),
            'tenant_id'   => $lead?->tenant_id,
        ]);
    }

    /**
     * Attach all anonymous pre-lead history to a freshly identified lead.
     */
    public function bindAnonToLead(Lead $lead, string $anonId): void
    {
        $lead->forceFill(['anon_id' => $anonId])->save();

        CustomerSession::where('anon_id', $anonId)->whereNull('lead_id')
            ->update(['lead_id' => $lead->id]);

        CustomerEvent::where('anon_id', $anonId)->whereNull('lead_id')
            ->update(['lead_id' => $lead->id]);
    }

    // ───────────────────────── helpers ─────────────────────────

    private function resolveCampaign(array $utm): ?Campaign
    {
        if (empty($utm['utm_source']) && empty($utm['utm_campaign'])) {
            return null;
        }

        try {
            return Campaign::firstOrCreate(
                [
                    'utm_source'   => $utm['utm_source'],
                    'utm_campaign' => $utm['utm_campaign'],
                ],
                [
                    'name'   => $utm['utm_campaign'] ?? ($utm['utm_source'] . ' campaign'),
                    'source' => $this->campaignSourceFromUtm($utm['utm_source'] ?? 'direct'),
                    'utm_medium' => $utm['utm_medium'] ?? null,
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('[Attribution] campaign resolve failed: ' . $e->getMessage());
            return null;
        }
    }

    private function campaignSourceFromUtm(string $utmSource): string
    {
        $s = strtolower($utmSource);
        foreach (['facebook', 'google', 'tiktok'] as $known) {
            if (str_contains($s, $known)) {
                return $known;
            }
        }
        return 'direct';
    }

    private function deriveSourceFromUtm(array $utm, Request $request): string
    {
        $s = strtolower((string) ($utm['utm_source'] ?? ''));
        $map = [
            'facebook'  => LeadSource::FACEBOOK_ADS,
            'instagram' => LeadSource::INSTAGRAM_ADS,
            'google'    => LeadSource::GOOGLE_ADS,
            'tiktok'    => LeadSource::TIKTOK_ADS,
            'whatsapp'  => LeadSource::WHATSAPP,
        ];
        foreach ($map as $needle => $key) {
            if (str_contains($s, $needle)) {
                return $key;
            }
        }

        $referrer = $request->input('referrer') ?? $request->header('referer');
        if ($referrer) {
            if (preg_match('/google|bing|yahoo|duckduckgo/i', $referrer)) {
                return LeadSource::ORGANIC_SEARCH;
            }
            return LeadSource::ORGANIC_SEARCH;
        }

        return LeadSource::DIRECT;
    }

    private function sourceIdFor(string $key): ?string
    {
        return LeadSource::where('key', $key)->value('id');
    }

    /**
     * Minimal UA parsing (consistent with AuditLogService heuristics).
     *
     * @return array{0:string,1:string,2:string} [device, os, browser]
     */
    private function parseUserAgent(?string $ua): array
    {
        if (!$ua) {
            return ['Desktop', 'Unknown', 'Unknown'];
        }

        $device = 'Desktop';
        if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
            $device = 'Tablet';
        } elseif (preg_match('/(mobi|opera mini|iphone|android|blackberry|nokia)/i', $ua)) {
            $device = 'Mobile';
        }

        $os = 'Unknown';
        foreach (['Windows' => 'Windows', 'Mac OS' => 'macOS', 'Android' => 'Android', 'iPhone' => 'iOS', 'iPad' => 'iOS', 'Linux' => 'Linux'] as $needle => $label) {
            if (str_contains($ua, $needle)) { $os = $label; break; }
        }

        $browser = 'Unknown';
        if (str_contains($ua, 'Edg')) $browser = 'Edge';
        elseif (str_contains($ua, 'OPR') || str_contains($ua, 'Opera')) $browser = 'Opera';
        elseif (str_contains($ua, 'Chrome')) $browser = 'Chrome';
        elseif (str_contains($ua, 'Firefox')) $browser = 'Firefox';
        elseif (str_contains($ua, 'Safari')) $browser = 'Safari';

        return [$device, $os, $browser];
    }
}
