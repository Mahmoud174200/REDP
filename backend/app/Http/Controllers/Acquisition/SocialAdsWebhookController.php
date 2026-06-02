<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Lead;
use App\Events\Acquisition\LeadCreated;
use App\Services\Acquisition\LeadAssignmentService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Controller: SocialAdsWebhookController
 * Blueprint Section: H.11 — Lead Ads Ingestion
 *
 * Ingests lead data from Facebook/TikTok Lead Ads API payloads,
 * auto-parses UTM tags, tracks Customer Acquisition Cost (CAC),
 * and writes to campaigns and leads tables.
 * ─────────────────────────────────────────────────────────
 */
class SocialAdsWebhookController extends Controller
{
    private LeadAssignmentService $assignmentService;

    public function __construct(LeadAssignmentService $assignmentService)
    {
        $this->assignmentService = $assignmentService;
    }

    /**
     * POST /api/v1/webhooks/facebook/leads
     * Facebook Lead Ads webhook ingestion.
     */
    public function handleFacebookLead(Request $request): JsonResponse
    {
        Log::info('[SocialAds] Facebook lead webhook received', $request->all());

        // Facebook Lead Ads payload structure
        $fields = $request->validate([
            'entry'                          => 'required|array',
            'entry.*.changes'                => 'required|array',
            'entry.*.changes.*.value'        => 'required|array',
            'entry.*.changes.*.value.leadgen_id' => 'required|string',
        ]);

        $results = [];

        foreach ($request->input('entry', []) as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $leadData = $change['value'] ?? [];

                $result = $this->ingestLeadFromAds(
                    source: Campaign::SOURCE_FACEBOOK,
                    externalId: $leadData['leadgen_id'] ?? Str::uuid(),
                    firstName: $leadData['first_name'] ?? $leadData['full_name'] ?? 'Facebook Lead',
                    lastName: $leadData['last_name'] ?? '',
                    email: $leadData['email'] ?? null,
                    phone: $leadData['phone_number'] ?? $leadData['phone'] ?? null,
                    utmSource: $leadData['utm_source'] ?? 'facebook',
                    utmMedium: $leadData['utm_medium'] ?? 'paid_social',
                    utmCampaign: $leadData['utm_campaign'] ?? $leadData['campaign_name'] ?? null,
                    adSpend: $leadData['ad_spend'] ?? null,
                );

                $results[] = $result;
            }
        }

        return response()->json([
            'success'  => true,
            'message'  => count($results) . ' lead(s) ingested from Facebook.',
            'results'  => $results,
        ]);
    }

    /**
     * POST /api/v1/webhooks/tiktok/leads
     * TikTok Lead Ads webhook ingestion.
     */
    public function handleTikTokLead(Request $request): JsonResponse
    {
        Log::info('[SocialAds] TikTok lead webhook received', $request->all());

        $fields = $request->validate([
            'leads'           => 'required|array',
            'leads.*.lead_id' => 'required|string',
        ]);

        $results = [];

        foreach ($request->input('leads', []) as $leadData) {
            $result = $this->ingestLeadFromAds(
                source: Campaign::SOURCE_TIKTOK,
                externalId: $leadData['lead_id'] ?? Str::uuid(),
                firstName: $leadData['first_name'] ?? $leadData['name'] ?? 'TikTok Lead',
                lastName: $leadData['last_name'] ?? '',
                email: $leadData['email'] ?? null,
                phone: $leadData['phone'] ?? $leadData['phone_number'] ?? null,
                utmSource: $leadData['utm_source'] ?? 'tiktok',
                utmMedium: $leadData['utm_medium'] ?? 'paid_social',
                utmCampaign: $leadData['utm_campaign'] ?? $leadData['campaign_name'] ?? null,
                adSpend: $leadData['ad_spend'] ?? null,
            );

            $results[] = $result;
        }

        return response()->json([
            'success' => true,
            'message' => count($results) . ' lead(s) ingested from TikTok.',
            'results' => $results,
        ]);
    }

    /**
     * GET /api/v1/acquisition/campaigns
     * Retrieve campaigns with metrics (authenticated).
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = Campaign::withCount('leads')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        // Enrich each campaign with CAC
        $campaigns->getCollection()->transform(function ($campaign) {
            $campaign->cac = $campaign->cac;
            return $campaign;
        });

        return response()->json([
            'success' => true,
            'data'    => $campaigns,
        ]);
    }

    /**
     * GET /api/v1/acquisition/campaigns/{id}
     * Retrieve single campaign with detailed metrics.
     */
    public function show(string $id): JsonResponse
    {
        $campaign = Campaign::withCount('leads')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $campaign,
            'metrics' => [
                'cac'           => $campaign->cac,
                'leads_count'   => $campaign->leads_count,
                'budget'        => $campaign->budget,
                'roi'           => $campaign->roi_percentage,
                'source'        => $campaign->source,
            ],
        ]);
    }

    // ── Private Helpers ──

    /**
     * Unified lead ingestion from social ad platforms.
     */
    private function ingestLeadFromAds(
        string $source,
        string $externalId,
        string $firstName,
        string $lastName,
        ?string $email,
        ?string $phone,
        ?string $utmSource,
        ?string $utmMedium,
        ?string $utmCampaign,
        ?float $adSpend,
    ): array {
        // Find or create campaign
        $campaign = Campaign::firstOrCreate(
            [
                'utm_source'   => $utmSource ?? $source,
                'utm_campaign' => $utmCampaign ?? "{$source}_default",
            ],
            [
                'id'         => (string) Str::uuid(),
                'name'       => $utmCampaign ?? ucfirst($source) . ' Campaign',
                'source'     => $source,
                'utm_medium' => $utmMedium ?? 'paid_social',
                'budget'     => 0,
            ]
        );

        // Check for duplicate lead by phone
        $existingLead = null;
        if ($phone) {
            $existingLead = Lead::where('phone', $phone)->first();
        }

        if ($existingLead) {
            return [
                'status'     => 'duplicate',
                'lead_id'    => $existingLead->id,
                'message'    => 'Lead with this phone already exists.',
                'campaign_id' => $campaign->id,
            ];
        }

        // Create lead
        $lead = Lead::create([
            'id'          => (string) Str::uuid(),
            'first_name'  => $firstName,
            'last_name'   => $lastName,
            'email'       => $email,
            'phone'       => $phone ?? 'N/A',
            'status'      => Lead::STATUS_NEW,
            'lead_score'  => 0,
            'source'      => $source,
            'campaign_id' => $campaign->id,
            'kyc_status'  => 'none',
        ]);

        // Update campaign metrics
        $campaign->increment('leads_count');
        if ($adSpend) {
            $campaign->increment('budget', $adSpend);
        }

        // Recalculate ROI (simplified: leads_count * avg_deal_value / budget)
        if ($campaign->budget > 0) {
            $avgDealValue = 500000; // placeholder avg deal value
            $estimatedRevenue = $campaign->leads_count * $avgDealValue * 0.03; // 3% conversion
            $roi = (($estimatedRevenue - $campaign->budget) / $campaign->budget) * 100;
            $campaign->update(['roi_percentage' => round($roi, 2)]);
        }

        // Auto-assign via Round-Robin
        $this->assignmentService->assignLeadRoundRobin($lead);

        // Dispatch event
        LeadCreated::dispatch($lead->id, $source);

        return [
            'status'      => 'created',
            'lead_id'     => $lead->id,
            'lead_name'   => "{$firstName} {$lastName}",
            'campaign_id' => $campaign->id,
            'campaign_cac' => $campaign->cac,
        ];
    }
}
