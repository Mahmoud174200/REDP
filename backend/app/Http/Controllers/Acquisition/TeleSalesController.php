<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Project;
use App\Models\ClientJourneyLog;
use App\Services\AuditLogService;
use App\Services\TierAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Controller: TeleSalesController (Tier 1)
 *
 * Handles tele-sales agent workflows:
 * - Create and manage leads (basic contact information)
 * - Schedule client meetings/viewings at company office
 * - Read-only access to project names and basic categories
 * - Transfer leads to company sales team
 *
 * RESTRICTIONS:
 * - Cannot access pricing, payment plans, or unit details
 * - Cannot see other agents' leads
 * - Workflow ends when lead is transferred
 * ─────────────────────────────────────────────────────────
 */
class TeleSalesController extends Controller
{
    // ════════════════════════════════════════════════
    // LEAD MANAGEMENT
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/tele/leads
     * List leads assigned to the current tele-sales agent only.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Lead::forTier($user)
            ->with(['interactions' => fn($q) => $q->latest()->limit(5)]);

        // Status filter
        if ($request->has('status')) {
            $query->byStatus($request->input('status'));
        }

        // Search by name/phone
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $leads = $query->orderBy('created_at', 'desc')
                       ->paginate($request->input('per_page', 25));

        // Field-level filtering: strip sensitive data
        $filtered = $leads->toArray();
        $filtered['data'] = TierAccessService::filterLeadsCollection($filtered['data'], $user);

        return response()->json([
            'success' => true,
            'data'    => $filtered,
        ]);
    }

    /**
     * POST /api/v1/sales/tele/leads
     * Create a new lead with basic contact info.
     * Auto-assigns the current tele-sales agent.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $fields = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'required|string|max:20',
            'source'     => 'nullable|string|in:facebook,google,tiktok,direct,referral',
            'notes'      => 'nullable|string|max:1000',
        ]);

        // Check for duplicate phone
        $existing = Lead::where('phone', $fields['phone'])->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A lead with this phone number already exists.',
                'existing_lead_id' => $existing->id,
            ], 409);
        }

        $lead = Lead::create([
            'id'                    => (string) Str::uuid(),
            'first_name'            => $fields['first_name'],
            'last_name'             => $fields['last_name'],
            'email'                 => $fields['email'] ?? null,
            'phone'                 => $fields['phone'],
            'status'                => Lead::STATUS_NEW,
            'lead_score'            => 0,
            'source'                => $fields['source'] ?? 'direct',
            'kyc_status'            => 'none',
            'tele_sales_agent_id'   => $user->id,
            'current_tier'          => 'tier_1',
        ]);

        // Record journey
        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_LEAD_CREATED,
            $user,
            ['source' => $lead->source, 'notes' => $fields['notes'] ?? null]
        );

        AuditLogService::log('LEAD_CREATE', $user->id, [
            'lead_id' => $lead->id,
            'tier'    => 'tier_1',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead created and assigned to you.',
            'data'    => TierAccessService::filterLeadForRole($lead->toArray(), $user),
        ], 201);
    }

    /**
     * GET /api/v1/sales/tele/leads/{id}
     * View a single lead (only if assigned to current agent).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $lead = Lead::forTier($user)
            ->with(['interactions' => fn($q) => $q->latest()->limit(10)])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => TierAccessService::filterLeadForRole($lead->toArray(), $user),
        ]);
    }

    /**
     * PUT /api/v1/sales/tele/leads/{id}/contact
     * Log a contact interaction with the lead.
     */
    public function logContact(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $lead = Lead::forTier($user)->findOrFail($id);

        $fields = $request->validate([
            'type'           => 'required|string|in:call,whatsapp,email',
            'notes'          => 'required|string|max:2000',
            'follow_up_date' => 'nullable|date|after:today',
        ]);

        $interaction = $lead->interactions()->create([
            'id'             => (string) Str::uuid(),
            'type'           => $fields['type'],
            'notes'          => $fields['notes'],
            'follow_up_date' => $fields['follow_up_date'] ?? null,
            'logged_by'      => $user->id,
        ]);

        // Update lead status if still "new"
        if ($lead->status === Lead::STATUS_NEW) {
            $lead->update(['status' => Lead::STATUS_CONTACTED]);
        }

        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_TELE_SALES_CONTACT,
            $user,
            ['interaction_type' => $fields['type']]
        );

        return response()->json([
            'success'     => true,
            'message'     => 'Contact logged successfully.',
            'interaction' => $interaction,
        ]);
    }

    /**
     * PUT /api/v1/sales/tele/leads/{id}/schedule-meeting
     * Mark lead as "scheduled for company viewing".
     */
    public function scheduleMeeting(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $lead = Lead::forTier($user)->findOrFail($id);

        $fields = $request->validate([
            'meeting_date' => 'required|date|after:now',
            'location'     => 'nullable|string|max:255',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $lead->update(['status' => Lead::STATUS_VISIT_SCHEDULED]);

        // Log interaction for the meeting
        $lead->interactions()->create([
            'id'             => (string) Str::uuid(),
            'type'           => 'meeting',
            'notes'          => "Meeting scheduled at " . ($fields['location'] ?? 'company office') . ". " . ($fields['notes'] ?? ''),
            'follow_up_date' => $fields['meeting_date'],
            'logged_by'      => $user->id,
        ]);

        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_MEETING_SCHEDULED,
            $user,
            [
                'meeting_date' => $fields['meeting_date'],
                'location'     => $fields['location'] ?? 'company office',
            ]
        );

        AuditLogService::log('MEETING_SCHEDULED', $user->id, [
            'lead_id'      => $lead->id,
            'meeting_date' => $fields['meeting_date'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Meeting scheduled successfully. Lead marked as visit_scheduled.',
            'data'    => TierAccessService::filterLeadForRole($lead->fresh()->toArray(), $user),
        ]);
    }

    /**
     * PUT /api/v1/sales/tele/leads/{id}/transfer
     * Transfer lead to company sales team (Tier 3).
     * This is the endpoint of the tele-sales workflow.
     */
    public function transfer(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $lead = Lead::forTier($user)->findOrFail($id);

        $fields = $request->validate([
            'notes'                   => 'nullable|string|max:1000',
            'company_sales_agent_id'  => 'nullable|uuid|exists:users,id',
        ]);

        // Validate tier transition
        if (!TierAccessService::isValidTierTransition($lead->current_tier, 'tier_3')) {
            return response()->json([
                'success' => false,
                'message' => "Cannot transfer: lead is already at {$lead->current_tier}.",
            ], 422);
        }

        $previousTier = $lead->current_tier;

        $lead->update([
            'current_tier'            => 'tier_3',
            'company_sales_agent_id'  => $fields['company_sales_agent_id'] ?? null,
        ]);

        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_ESCALATED_TO_SALES,
            $user,
            [
                'from_tier' => $previousTier,
                'to_tier'   => 'tier_3',
                'notes'     => $fields['notes'] ?? null,
            ]
        );

        AuditLogService::logTierTransition(
            $lead->id,
            $previousTier,
            'tier_3',
            $user->id,
            ['transfer_notes' => $fields['notes'] ?? null]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lead transferred to company sales team.',
            'data'    => TierAccessService::filterLeadForRole($lead->fresh()->toArray(), $user),
        ]);
    }

    // ════════════════════════════════════════════════
    // PROJECT BROWSING (READ-ONLY, BASIC INFO)
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/tele/projects
     * Returns project names and basic categories only.
     * NO pricing, NO unit details, NO payment plans.
     */
    public function listProjects(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::select('id', 'name', 'location', 'status')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        // Extra safety: run through tier filter
        $filtered = $projects->map(fn($p) =>
            TierAccessService::filterProjectForRole($p->toArray(), $user)
        );

        return response()->json([
            'success' => true,
            'data'    => $filtered,
        ]);
    }

    // ════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/tele/dashboard
     * Tele-sales agent personal dashboard stats.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalLeads    = Lead::forTier($user)->count();
        $newLeads      = Lead::forTier($user)->byStatus('new')->count();
        $contacted     = Lead::forTier($user)->byStatus('contacted')->count();
        $scheduled     = Lead::forTier($user)->byStatus('visit_scheduled')->count();
        $transferred   = Lead::where('tele_sales_agent_id', $user->id)
                             ->where('current_tier', '!=', 'tier_1')
                             ->count();

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_leads'       => $totalLeads,
                'new_leads'         => $newLeads,
                'contacted'         => $contacted,
                'meetings_scheduled'=> $scheduled,
                'transferred'       => $transferred,
            ],
        ]);
    }
}
