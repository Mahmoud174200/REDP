<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Interaction;
use App\Events\Acquisition\LeadCreated;
use App\Events\Acquisition\ReservationConfirmed;
use App\Services\Acquisition\LeadAssignmentService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Controller: LeadController
 * Blueprint Sections: H.1 KYC, H.9 CRM Pipeline, H.11 Webhooks
 * ─────────────────────────────────────────────────────────
 */
class LeadController extends Controller
{
    private LeadAssignmentService $assignmentService;

    public function __construct(LeadAssignmentService $assignmentService)
    {
        $this->assignmentService = $assignmentService;
    }

    /**
     * GET /api/v1/acquisition/leads
     * Retrieve paginated list of leads with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Lead::with(['agent', 'interactions', 'broker']);

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->input('status'));
        }

        // Filter by assigned agent
        if ($request->has('agent_id')) {
            $query->assignedTo($request->input('agent_id'));
        }

        // Filter by source
        if ($request->has('source')) {
            $query->where('source', $request->input('source'));
        }

        // Search by name, phone, email
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('national_id', 'LIKE', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $leads = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $leads,
        ]);
    }

    /**
     * POST /api/v1/acquisition/leads
     * Create a new lead with Round-Robin agent assignment.
     */
    public function store(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'email'       => 'nullable|email|max:255',
            'phone'       => 'required|string|max:20',
            'national_id' => 'nullable|string|max:30',
            'passport_no' => 'nullable|string|max:30',
            'source'      => 'nullable|string|in:facebook,google,tiktok,direct,referral,broker',
            'campaign_id' => 'nullable|uuid',
            'lead_score'  => 'nullable|integer|min:0|max:100',
            'is_vip'      => 'nullable|boolean',
        ]);

        $lead = Lead::create([
            'id'          => (string) Str::uuid(),
            'first_name'  => $fields['first_name'],
            'last_name'   => $fields['last_name'],
            'email'       => $fields['email'] ?? null,
            'phone'       => $fields['phone'],
            'national_id' => $fields['national_id'] ?? null,
            'passport_no' => $fields['passport_no'] ?? null,
            'status'      => Lead::STATUS_NEW,
            'lead_score'  => $fields['lead_score'] ?? 0,
            'source'      => $fields['source'] ?? 'direct',
            'campaign_id' => $fields['campaign_id'] ?? null,
            'kyc_status'  => 'none',
            'is_vip'      => $fields['is_vip'] ?? false,
        ]);

        // Auto-assign via Round-Robin
        $agent = $this->assignmentService->assignLeadRoundRobin($lead);

        // Dispatch domain event
        LeadCreated::dispatch($lead->id, $lead->source);

        // Audit trail
        AuditLogService::log('LEAD_CREATE', $request->user()?->id, [
            'lead_id'    => $lead->id,
            'agent_id'   => $agent?->id,
            'source'     => $lead->source,
        ]);

        // ── Lead Attribution System: record first touch for a manually entered lead ──
        try {
            $srcMap = [
                'facebook' => \App\Models\LeadSource::FACEBOOK_ADS,
                'google'   => \App\Models\LeadSource::GOOGLE_ADS,
                'tiktok'   => \App\Models\LeadSource::TIKTOK_ADS,
                'referral' => \App\Models\LeadSource::BROKER_REFERRAL,
                'broker'   => \App\Models\LeadSource::BROKER_REFERRAL,
                'direct'   => \App\Models\LeadSource::DIRECT,
            ];
            $attribution = app(\App\Services\Acquisition\AttributionService::class);
            $ctx = [
                'source_key' => $srcMap[$lead->source] ?? \App\Models\LeadSource::MANUAL_ENTRY,
                'broker'     => null,
                'campaign'   => $lead->campaign_id ? \App\Models\Campaign::find($lead->campaign_id) : null,
                'promo_code' => null,
                'utm'        => [],
            ];
            $attribution->recordTouch($lead, $ctx);
            $attribution->recordEvent(\App\Models\CustomerEvent::LEAD, $lead, null, null, ['entry' => 'manual']);
        } catch (\Throwable $attrEx) {
            \Illuminate\Support\Facades\Log::warning('[Attribution] manual lead wiring failed: ' . $attrEx->getMessage());
        }

        return response()->json([
            'success'        => true,
            'message'        => 'Lead captured successfully and auto-assigned.',
            'data'           => $lead->load('agent'),
            'assigned_agent' => $agent ? [
                'id'   => $agent->id,
                'name' => $agent->name ?? 'N/A',
            ] : null,
        ], 201);
    }

    /**
     * GET /api/v1/acquisition/leads/{id}
     * Retrieve a single lead with full relationships.
     */
    public function show(string $id): JsonResponse
    {
        $lead = Lead::with([
            'agent',
            'interactions' => fn($q) => $q->latest()->limit(20),
            'callLogs' => fn($q) => $q->latest()->limit(10),
            'commissions',
            'broker',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $lead,
        ]);
    }

    /**
     * PUT /api/v1/acquisition/leads/{id}/status
     * Update lead pipeline status (drag-and-drop Kanban endpoint).
     * Fires ReservationConfirmed event when status becomes 'reserved'.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate([
            'status'  => 'required|string|in:' . implode(',', Lead::STATUSES),
            'unit_id' => 'nullable|uuid', // Required when moving to 'reserved'
        ]);

        $lead = Lead::findOrFail($id);
        $previousStatus = $lead->status;

        // Validate status transition for reserved state
        if ($fields['status'] === Lead::STATUS_RESERVED && empty($fields['unit_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'unit_id is required when reserving a lead.',
            ], 422);
        }

        $lead->update(['status' => $fields['status']]);

        // Fire ReservationConfirmed event when transitioning to reserved
        if ($fields['status'] === Lead::STATUS_RESERVED && $previousStatus !== Lead::STATUS_RESERVED) {
            ReservationConfirmed::dispatch($lead->id, $fields['unit_id']);

            // ── Lead Attribution System: funnel event ──
            try {
                app(\App\Services\Acquisition\AttributionService::class)
                    ->recordEvent(\App\Models\CustomerEvent::UNIT_RESERVED, $lead, null, $lead->anon_id, ['unit_id' => $fields['unit_id']]);
            } catch (\Throwable $attrEx) {
                \Illuminate\Support\Facades\Log::warning('[Attribution] reserved event failed: ' . $attrEx->getMessage());
            }
        }

        AuditLogService::log('LEAD_STATUS_UPDATE', $request->user()?->id, [
            'lead_id'         => $lead->id,
            'previous_status' => $previousStatus,
            'new_status'      => $fields['status'],
        ]);

        return response()->json([
            'success'         => true,
            'message'         => "Lead status updated from '{$previousStatus}' to '{$fields['status']}'.",
            'data'            => $lead->fresh(),
            'event_dispatched' => $fields['status'] === Lead::STATUS_RESERVED ? 'ReservationConfirmed' : null,
        ]);
    }

    /**
     * PUT /api/v1/acquisition/leads/{id}/toggle-vip
     * Toggle VIP status of a lead.
     */
    public function toggleVip(Request $request, string $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);
        $lead->is_vip = !$lead->is_vip;
        $lead->save();

        AuditLogService::log('LEAD_VIP_TOGGLE', $request->user()?->id, [
            'lead_id' => $lead->id,
            'is_vip'  => $lead->is_vip,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead VIP status updated successfully.',
            'data'    => $lead,
        ]);
    }
}
