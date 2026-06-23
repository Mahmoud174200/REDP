<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\ClientJourneyLog;
use App\Models\ClientPresentation;
use App\Models\Lead;
use App\Models\PaymentPlan;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Reservation;
use App\Models\Commission;
use App\Models\CommissionPayoutRequest;
use App\Models\User;
use App\Services\Acquisition\AntiPoachingService;
use App\Services\AuditLogService;
use App\Services\TierAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Controller: BrokerSalesController (Tier 2)
 *
 * Handles broker workflows:
 * - Full read access to projects, units, pricing, payment plans
 * - Can present information to clients and log presentations
 * - Cannot execute transactions or create bookings
 * - Can escalate to company sales for final implementation
 *
 * RESTRICTIONS:
 * - Cannot see other brokers' presentations or leads
 * - Cannot execute bookings/transactions
 * - Read-only access to inventory data
 * ─────────────────────────────────────────────────────────
 */
class BrokerSalesController extends Controller
{
    // ════════════════════════════════════════════════
    // PROJECT & UNIT BROWSING (FULL READ ACCESS)
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/broker/projects
     * Full project details including pricing structures.
     */
    public function listProjects(Request $request): JsonResponse
    {
        $projects = Project::withCount('units')
            ->with(['paymentPlans'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $projects,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/projects/{projectId}/units
     * All available units with pricing and specifications.
     */
    public function listProjectUnits(Request $request, string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $query = Unit::where('project_id', $projectId)
            ->with('project');

        // Filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->has('type') && $request->type !== 'all') {
            $query->byType($request->type);
        }
        if ($request->has('min_price') && $request->has('max_price')) {
            $query->priceRange((float) $request->min_price, (float) $request->max_price);
        }
        if ($request->has('bedrooms')) {
            $query->where('bedrooms', $request->bedrooms);
        }

        $units = $query->orderBy('unit_number')->get();

        return response()->json([
            'success' => true,
            'project' => $project,
            'data'    => $units,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/units/{id}
     * Detailed unit information with pricing.
     */
    public function showUnit(string $id): JsonResponse
    {
        $unit = Unit::with(['project'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $unit,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/payment-plans/{projectId}
     * View installment plan structures for a project.
     */
    public function listPaymentPlans(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        // Get payment plans from contracts linked to this project's units
        $paymentPlans = PaymentPlan::whereHas('contract', function ($q) use ($projectId) {
            $q->whereHas('unit', function ($q2) use ($projectId) {
                $q2->where('project_id', $projectId);
            });
        })->with('contract.unit:id,unit_number,type,price')
          ->get();

        return response()->json([
            'success' => true,
            'project' => $project->only(['id', 'name', 'location']),
            'data'    => $paymentPlans,
        ]);
    }

    // ════════════════════════════════════════════════
    // LEAD ACCESS (OWN BROKER LEADS ONLY)
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/broker/leads
     * Only returns leads linked to this broker.
     * Strict data isolation: cannot see other brokers' leads.
     */
    public function listLeads(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json([
                'success' => false,
                'message' => 'No broker profile linked to your user account. Contact admin.',
            ], 403);
        }

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $query = Lead::whereIn('broker_id', $agencyBrokerIds)
            ->with(['interactions' => fn($q) => $q->with('logger:id,name')->latest()->limit(5), 'interestedProject']);

        if ($request->has('status')) {
            $query->byStatus($request->input('status'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        $leads = $query->orderBy('created_at', 'desc')
                       ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'broker'  => $broker->only(['id', 'agency_name', 'agent_name']),
            'data'    => $leads,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/leads/{id}
     * View a single lead (if belongs to broker or subordinates).
     */
    public function showLead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->firstOrFail();

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $lead = Lead::whereIn('broker_id', $agencyBrokerIds)
            ->with(['interactions' => fn($q) => $q->with('logger:id,name')->latest()->limit(10), 'interestedProject'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $lead,
        ]);
    }

    /**
     * PUT /api/v1/sales/broker/leads/{id}/contact
     * Log a contact interaction with the lead.
     */
    public function logContact(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json([
                'success' => false,
                'message' => 'No broker profile linked to your user account.',
            ], 403);
        }

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $lead = Lead::whereIn('broker_id', $agencyBrokerIds)->findOrFail($id);

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

        \App\Services\AuditLogService::recordJourney(
            $lead->id,
            \App\Models\ClientJourneyLog::STAGE_TELE_SALES_CONTACT,
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
     * PUT /api/v1/sales/broker/leads/{id}/schedule-meeting
     * Mark lead as "scheduled for company viewing".
     */
    public function scheduleMeeting(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json([
                'success' => false,
                'message' => 'No broker profile linked to your user account.',
            ], 403);
        }

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $lead = Lead::whereIn('broker_id', $agencyBrokerIds)->findOrFail($id);

        $fields = $request->validate([
            'meeting_date' => 'required|date|after:now',
            'location'     => 'nullable|string|max:255',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $lead->update(['status' => Lead::STATUS_VISIT_SCHEDULED]);

        $interaction = $lead->interactions()->create([
            'id'             => (string) Str::uuid(),
            'type'           => 'meeting',
            'notes'          => "Meeting scheduled at " . ($fields['location'] ?? 'company office') . ". " . ($fields['notes'] ?? ''),
            'follow_up_date' => $fields['meeting_date'],
            'logged_by'      => $user->id,
        ]);

        \App\Services\AuditLogService::recordJourney(
            $lead->id,
            \App\Models\ClientJourneyLog::STAGE_MEETING_SCHEDULED,
            $user,
            [
                'meeting_date' => $fields['meeting_date'],
                'location'     => $fields['location'] ?? 'company office',
            ]
        );

        \App\Services\AuditLogService::log('MEETING_SCHEDULED', $user->id, [
            'lead_id'      => $lead->id,
            'meeting_date' => $fields['meeting_date'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Meeting scheduled successfully. Lead marked as visit_scheduled.',
            'interaction' => $interaction,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/commissions/settings
     * Fetch the commission splits for the owner's company.
     */
    public function getCommissionSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $company = \App\Models\Company::find($user->company_id);
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No brokerage company found for your user account.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'company_name'             => $company->name,
                'developer_brokerage_rate' => (float) $company->developer_brokerage_rate,
                'owner_commission_rate'    => (float) $company->owner_commission_rate,
                'leader_commission_rate'   => (float) $company->leader_commission_rate,
                'agent_commission_rate'    => (float) $company->agent_commission_rate,
            ],
        ]);
    }

    /**
     * PUT /api/v1/sales/broker/commissions/settings
     * Update splits for the company (Owner only).
     */
    public function updateCommissionSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $company = \App\Models\Company::find($user->company_id);
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No brokerage company found for your user account.',
            ], 404);
        }

        $positionCode = $user->employeeHierarchy?->position?->code ?? $user->position?->code;
        $positionTitle = $user->employeeHierarchy?->position?->title ?? $user->position?->title ?? '';

        $isOwner = ($positionCode === 'POS-DH' || str_contains($positionTitle, 'Owner') || str_contains($positionTitle, 'Head') || str_contains($positionTitle, 'CEO'));

        if (!$isOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Only the Broker Owner is authorized to modify split commission rates.',
            ], 403);
        }

        $fields = $request->validate([
            'owner_commission_rate'  => 'required|numeric|min:0|max:100',
            'leader_commission_rate' => 'required|numeric|min:0|max:100',
            'agent_commission_rate'  => 'required|numeric|min:0|max:100',
        ]);

        $sum = (float)$fields['owner_commission_rate'] + (float)$fields['leader_commission_rate'] + (float)$fields['agent_commission_rate'];
        $devRate = (float)$company->developer_brokerage_rate;

        if ($sum > $devRate) {
            return response()->json([
                'success' => false,
                'message' => "The sum of splits ({$sum}%) cannot exceed the company total brokerage rate set by the developer ({$devRate}%).",
            ], 422);
        }

        $company->update([
            'owner_commission_rate'  => $fields['owner_commission_rate'],
            'leader_commission_rate' => $fields['leader_commission_rate'],
            'agent_commission_rate'  => $fields['agent_commission_rate'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commission split rates updated successfully.',
            'data'    => $company->fresh()->only(['owner_commission_rate', 'leader_commission_rate', 'agent_commission_rate']),
        ]);
    }

    // ════════════════════════════════════════════════
    // PRESENTATIONS (AUDIT TRAIL)
    // ════════════════════════════════════════════════

    /**
     * POST /api/v1/sales/broker/presentations
     * Log a client presentation.
     */
    public function createPresentation(Request $request): JsonResponse
    {
        $user = $request->user();

        $fields = $request->validate([
            'lead_id'             => 'required|uuid|exists:leads,id',
            'project_id'          => 'required|uuid|exists:projects,id',
            'unit_ids'            => 'nullable|array',
            'unit_ids.*'          => 'uuid|exists:units,id',
            'presentation_notes'  => 'nullable|string|max:5000',
        ]);

        // Verify the lead belongs to this broker
        $broker = Broker::where('user_id', $user->id)->first();
        if (!$broker) {
            return response()->json([
                'success' => false,
                'message' => 'No broker profile linked to your account.',
            ], 403);
        }

        $lead = Lead::where('id', $fields['lead_id'])
            ->where('broker_id', $broker->id)
            ->first();

        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'This lead is not assigned to your broker account.',
            ], 403);
        }

        $presentation = ClientPresentation::create([
            'id'                  => (string) Str::uuid(),
            'broker_user_id'      => $user->id,
            'lead_id'             => $fields['lead_id'],
            'project_id'          => $fields['project_id'],
            'unit_ids'            => $fields['unit_ids'] ?? [],
            'presentation_notes'  => $fields['presentation_notes'] ?? null,
            'outcome'             => ClientPresentation::OUTCOME_PENDING,
            'presented_at'        => now(),
        ]);

        // Update lead tier if still at tier_1
        if ($lead->current_tier === 'tier_1') {
            $lead->update(['current_tier' => 'tier_2']);
        }

        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_BROKER_PRESENTATION,
            $user,
            [
                'presentation_id' => $presentation->id,
                'project_id'      => $fields['project_id'],
                'unit_ids'        => $fields['unit_ids'] ?? [],
            ]
        );

        AuditLogService::logPresentation(
            $presentation->id,
            $user->id,
            $fields['lead_id'],
            $fields['project_id'],
            $fields['unit_ids'] ?? []
        );

        return response()->json([
            'success' => true,
            'message' => 'Presentation logged successfully.',
            'data'    => $presentation->load(['lead', 'project']),
        ], 201);
    }

    /**
     * GET /api/v1/sales/broker/presentations
     * List only THIS broker's presentations.
     * Strict isolation: cannot see other brokers' presentations.
     */
    public function listPresentations(Request $request): JsonResponse
    {
        $user = $request->user();
        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $allAgentUserIds = array_merge([$user->id], $subordinateIds);

        $query = ClientPresentation::whereIn('broker_user_id', $allAgentUserIds)
            ->with(['lead:id,first_name,last_name,phone,email,status', 'project:id,name,location']);

        if ($request->has('outcome')) {
            $query->byOutcome($request->input('outcome'));
        }

        $presentations = $query->orderBy('presented_at', 'desc')
                               ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $presentations,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/presentations/{id}
     * View a single presentation (own only).
     */
    public function showPresentation(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $presentation = ClientPresentation::byBroker($user->id)
            ->with(['lead', 'project'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $presentation,
        ]);
    }

    /**
     * PUT /api/v1/sales/broker/presentations/{id}/outcome
     * Update the outcome of a presentation.
     */
    public function updateOutcome(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $presentation = ClientPresentation::byBroker($user->id)->findOrFail($id);

        $fields = $request->validate([
            'outcome' => 'required|string|in:' . implode(',', ClientPresentation::OUTCOMES),
        ]);

        // Don't allow changing already-escalated presentations
        if ($presentation->isEscalated()) {
            return response()->json([
                'success' => false,
                'message' => 'This presentation has already been escalated and cannot be modified.',
            ], 422);
        }

        $presentation->update(['outcome' => $fields['outcome']]);

        return response()->json([
            'success' => true,
            'message' => 'Presentation outcome updated.',
            'data'    => $presentation->fresh(),
        ]);
    }

    /**
     * PUT /api/v1/sales/broker/presentations/{id}/escalate
     * Escalate to company sales for final implementation.
     * This is the broker's way of saying "client is ready to buy,
     * please handle the transaction".
     */
    public function escalate(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $presentation = ClientPresentation::byBroker($user->id)
            ->with('lead')
            ->findOrFail($id);

        if ($presentation->isEscalated()) {
            return response()->json([
                'success' => false,
                'message' => 'This presentation has already been escalated.',
            ], 422);
        }

        $fields = $request->validate([
            'company_sales_agent_id' => 'nullable|uuid|exists:users,id',
            'notes'                  => 'nullable|string|max:2000',
        ]);

        $presentation->update([
            'outcome'              => ClientPresentation::OUTCOME_ESCALATED_TO_SALES,
            'escalated_to_user_id' => $fields['company_sales_agent_id'] ?? null,
        ]);

        // Update lead tier
        $lead = $presentation->lead;
        if ($lead && TierAccessService::isValidTierTransition($lead->current_tier, 'tier_3')) {
            $lead->update([
                'current_tier'           => 'tier_3',
                'company_sales_agent_id' => $fields['company_sales_agent_id'] ?? null,
            ]);

            AuditLogService::logTierTransition(
                $lead->id,
                'tier_2',
                'tier_3',
                $user->id,
                ['presentation_id' => $presentation->id]
            );
        }

        AuditLogService::recordJourney(
            $lead->id,
            ClientJourneyLog::STAGE_ESCALATED_TO_SALES,
            $user,
            [
                'presentation_id'       => $presentation->id,
                'escalated_to_agent_id' => $fields['company_sales_agent_id'] ?? null,
                'notes'                 => $fields['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Presentation escalated to company sales team.',
            'data'    => $presentation->fresh()->load(['lead', 'project', 'escalatedTo']),
        ]);
    }

    // ════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/broker/dashboard
     * Broker personal dashboard stats.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        // Resolve subordinates hierarchy for aggregation
        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $allAgentUserIds = array_merge([$user->id], $subordinateIds);
        $agencyBrokerIds = Broker::whereIn('user_id', $allAgentUserIds)->pluck('id')->toArray();
        if (empty($agencyBrokerIds) && $broker) {
            $agencyBrokerIds = [$broker->id];
        }

        $brokerLeadsCount  = Lead::whereIn('broker_id', $agencyBrokerIds)->count();
        $totalPresentations = ClientPresentation::whereIn('broker_user_id', $allAgentUserIds)->count();
        $pendingPresentations = ClientPresentation::whereIn('broker_user_id', $allAgentUserIds)->pending()->count();
        $escalatedCount    = ClientPresentation::whereIn('broker_user_id', $allAgentUserIds)->escalated()->count();

        // Aggregate Calls, Meetings, and Sales
        $callsCount = \App\Models\Interaction::whereIn('logged_by', $allAgentUserIds)
            ->whereIn('type', ['call', 'whatsapp', 'email'])
            ->count();

        $meetingsCount = \App\Models\Interaction::whereIn('logged_by', $allAgentUserIds)
            ->where('type', 'meeting')
            ->count();

        $closedSalesCount = Reservation::whereIn('broker_id', $agencyBrokerIds)
            ->where('status', 'confirmed')
            ->count();

        // Subordinates Performance
        $subordinatesPerformance = [];

        if (!empty($subordinateIds)) {
            $subordinateUsers = User::whereIn('id', $subordinateIds)
                ->with(['employeeHierarchy.position', 'employeeHierarchy.team'])
                ->get();

            foreach ($subordinateUsers as $subUser) {
                $subBroker = Broker::where('user_id', $subUser->id)->first();
                if ($subBroker) {
                    $leadQuery = Lead::where('broker_id', $subBroker->id);

                    $total = $leadQuery->count();
                    $new = (clone $leadQuery)->byStatus('new')->count();
                    $contacted = (clone $leadQuery)->byStatus('contacted')->count();
                    $meetings = (clone $leadQuery)->byStatus('visit_scheduled')->count();
                    $reservationsCount = Reservation::where('broker_id', $subBroker->id)->count();

                    // Subordinate interaction stats
                    $subCallsCount = \App\Models\Interaction::where('logged_by', $subUser->id)
                        ->whereIn('type', ['call', 'whatsapp', 'email'])
                        ->count();

                    $subMeetingsCount = \App\Models\Interaction::where('logged_by', $subUser->id)
                        ->where('type', 'meeting')
                        ->count();

                    $subClosedSalesCount = Reservation::where('broker_id', $subBroker->id)
                        ->where('status', 'confirmed')
                        ->count();

                    $commEarned = Commission::where('broker_id', $subBroker->id)
                        ->where('status', 'approved')
                        ->sum('gross_amount');

                    $subordinatesPerformance[] = [
                        'user_id' => $subUser->id,
                        'name' => $subUser->name,
                        'role' => $subUser->role,
                        'position' => $subUser->employeeHierarchy?->position?->title ?? 'Broker Agent',
                        'team' => $subUser->employeeHierarchy?->team?->name ?? 'No Team',
                        'status' => $subUser->status,
                        'stats' => [
                            'total_leads' => $total,
                            'new' => $new,
                            'contacted' => $contacted,
                            'meetings' => $meetings,
                            'reservations' => $reservationsCount,
                            'commissions_earned' => (float) $commEarned,
                            'total_calls' => $subCallsCount,
                            'total_meetings' => $subMeetingsCount,
                            'closed_sales' => $subClosedSalesCount,
                        ]
                    ];
                }
            }
        }

        // Personal Commissions
        $pendingComm = 0.0;
        $approvedComm = 0.0;
        $paidComm = 0.0;
        $commCalculations = [];

        if ($broker) {
            $pendingComm = (float) Commission::whereIn('broker_id', $agencyBrokerIds)->where('status', 'pending')->sum('gross_amount');
            $approvedComm = (float) Commission::whereIn('broker_id', $agencyBrokerIds)->where('status', 'approved')->sum('gross_amount');
            $paidComm = (float) Commission::whereIn('broker_id', $agencyBrokerIds)->where('status', 'paid')->sum('gross_amount');

            $commCalculations = Commission::whereIn('broker_id', $agencyBrokerIds)
                ->with(['lead', 'unit.project'])
                ->latest()
                ->limit(10)
                ->get();
        }

        // Active Commission Rules for Tier 2
        $commRules = \App\Models\CommissionRule::where('tier_type', 'tier_2')
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_leads'          => $brokerLeadsCount,
                'total_presentations'  => $totalPresentations,
                'pending_presentations'=> $pendingPresentations,
                'escalated_to_sales'   => $escalatedCount,
                'conversion_rate'      => $totalPresentations > 0
                    ? round(($escalatedCount / $totalPresentations) * 100, 1)
                    : 0,
                'pending_commission'   => $pendingComm,
                'approved_commission'  => $approvedComm,
                'paid_commission'      => $paidComm,
                'total_commission'     => $pendingComm + $approvedComm + $paidComm,
                'total_calls'          => $callsCount,
                'total_meetings'       => $meetingsCount,
                'closed_sales'         => $closedSalesCount,
            ],
            'subordinates_performance' => $subordinatesPerformance,
            'commissions_history'       => $commCalculations,
            'commission_rules'          => $commRules,
        ]);
    }

    /**
     * POST /api/v1/sales/broker/leads
     * Register a new lead under the broker's portfolio with anti-poaching lock.
     */
    public function registerLead(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker || $broker->status !== Broker::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => 'No active broker profile linked to your account.',
            ], 403);
        }

        $fields = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'required|string|max:20',
            'national_id'   => 'nullable|string|max:30',
            'passport_no'   => 'nullable|string|max:30',
            'budget'        => 'nullable|numeric',
            'payment_method'=> 'nullable|string|in:cash,installments',
            'interested_project_id' => 'nullable|uuid|exists:projects,id',
        ]);

        try {
            $antiPoaching = app(AntiPoachingService::class);
            $result = $antiPoaching->registerBrokerLead(
                $broker,
                $fields['phone'],
                $fields['national_id'] ?? null,
                [
                    'id'                    => (string) Str::uuid(),
                    'first_name'            => $fields['first_name'],
                    'last_name'             => $fields['last_name'],
                    'email'                 => $fields['email'] ?? null,
                    'passport_no'           => $fields['passport_no'] ?? null,
                    'budget'                => $fields['budget'] ?? null,
                    'payment_method'        => $fields['payment_method'] ?? 'installments',
                    'interested_project_id' => $fields['interested_project_id'] ?? null,
                    'status'                => Lead::STATUS_NEW,
                    'current_tier'          => 'tier_2',
                ]
            );

            return response()->json([
                'success'      => true,
                'message'      => "Client registered and locked under your agency for 90 days.",
                'data'         => $result['lead'],
                'lock_expires' => $result['lock']->locked_until->toDateString(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    /**
     * POST /api/v1/sales/broker/reservations
     * Submit a unit reservation request awaiting admin approval.
     */
    public function submitReservation(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker || $broker->status !== Broker::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => 'No active broker profile linked to your account.',
            ], 403);
        }

        $fields = $request->validate([
            'unit_id'    => 'required|uuid|exists:units,id',
            'client_id'  => 'required|uuid|exists:leads,id', // lead_id in request
            'eoi_amount' => 'nullable|numeric|min:0',
        ]);

        $lead = Lead::where('id', $fields['client_id'])
            ->where('broker_id', $broker->id)
            ->first();

        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'This client is not registered under your broker portfolio or lock expired.',
            ], 403);
        }

        try {
            $reservation = DB::transaction(function () use ($fields, $lead, $broker, $request) {
                // Row-level lock unit to prevent double-booking
                $unit = Unit::where('id', $fields['unit_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                // Check availability
                if ($unit->status !== 'available' && $unit->status !== 'pending_reservation') {
                    throw new \Exception("Unit {$unit->unit_number} is already fully reserved or sold.");
                }

                // If other brokers have a pending reservation request on it, block this broker
                $existingHold = Reservation::where('unit_id', $unit->id)
                    ->where('status', 'pending')
                    ->where('broker_id', '!=', $broker->id)
                    ->exists();

                if ($existingHold) {
                    throw new \Exception("Unit {$unit->unit_number} has an active pending hold from another broker agency.");
                }

                // Update unit status to pending_reservation
                $unit->update(['status' => 'pending_reservation']);

                // Find or create client User account for the customer lead
                $clientUser = null;
                if ($lead->email) {
                    $clientUser = User::where('email', $lead->email)->first();
                }
                if (!$clientUser && $lead->phone) {
                    $clientUser = User::where('phone', $lead->phone)->first();
                }

                if (!$clientUser) {
                    $email = $lead->email;
                    if (empty($email)) {
                        $phoneClean = preg_replace('/[^0-9]/', '', $lead->phone);
                        $email = ($phoneClean ? $phoneClean : (string)Str::random(10)) . '@redp-client.com';
                    }

                    // Check email duplicate
                    $baseEmail = $email;
                    $counter = 1;
                    while (User::where('email', $email)->exists()) {
                        $parts = explode('@', $baseEmail);
                        $email = $parts[0] . '_' . $counter . '@' . ($parts[1] ?? 'redp-client.com');
                        $counter++;
                    }

                    $clientUser = User::create([
                        'id'       => (string) Str::uuid(),
                        'name'     => $lead->full_name,
                        'email'    => $email,
                        'phone'    => $lead->phone,
                        'role'     => 'client',
                        'password' => Hash::make('changeme'),
                        'status'   => 'active',
                    ]);
                }

                $eoiAmount = $fields['eoi_amount'] ?? 0.00;

                // Create reservation in pending status
                $reservation = Reservation::create([
                    'id'                   => (string) Str::uuid(),
                    'unit_id'              => $unit->id,
                    'client_id'            => $clientUser->id,
                    'broker_id'            => $broker->id,
                    'eoi_amount'           => $eoiAmount,
                    'status'               => 'pending',
                    'expires_at'           => now()->addDays(3),
                    'payment_receipt_path' => null, // No bank receipt required for interest request
                ]);

                // Emit status change event
                event(new \App\Events\Finance\UnitStatusChanged($unit->id, 'available', 'pending_reservation', $clientUser->id));

                return $reservation;
            });

            return response()->json([
                'success'     => true,
                'message'     => 'Reservation hold request submitted. Awaiting sales team approval.',
                'reservation' => $reservation->load(['unit.project', 'client']),
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /api/v1/sales/broker/reservations
     */
    public function listReservations(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json(['success' => false, 'message' => 'Broker profile not found.'], 404);
        }

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $reservations = Reservation::whereIn('broker_id', $agencyBrokerIds)
            ->with(['unit.project', 'client'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $reservations,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/reservations/{id}
     */
    public function showReservation(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json(['success' => false, 'message' => 'Broker profile not found.'], 404);
        }

        $reservation = Reservation::where('broker_id', $broker->id)
            ->with(['unit.project', 'client'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $reservation,
        ]);
    }

    /**
     * POST /api/v1/sales/broker/payout-requests
     */
    public function submitPayoutRequest(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker || $broker->status !== Broker::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => 'No active broker profile linked to your account.',
            ], 403);
        }

        $fields = $request->validate([
            'amount' => 'required|numeric|min:100',
        ]);

        // Calculate available balance
        $totalCommissioned = Commission::where('broker_id', $broker->id)->sum('gross_amount');
        $approvedAmount    = Commission::where('broker_id', $broker->id)->approved()->sum('gross_amount');
        $paidAmount        = Commission::where('broker_id', $broker->id)->paid()->sum('gross_amount');

        // Sum of all payout requests that are approved or pending
        $payoutRequested = CommissionPayoutRequest::where('broker_id', $broker->id)
            ->whereIn('status', ['pending_review', 'approved', 'paid'])
            ->sum('amount');

        $availableBalance = max(0, $approvedAmount - $payoutRequested);

        if ($fields['amount'] > $availableBalance) {
            return response()->json([
                'success' => false,
                'message' => "Insufficient approved commission balance. Available: " . number_format($availableBalance) . " EGP.",
            ], 422);
        }

        $payout = CommissionPayoutRequest::create([
            'id'           => (string) Str::uuid(),
            'broker_id'    => $broker->id,
            'amount'       => $fields['amount'],
            'invoice_path' => 'invoices/mock_invoice_' . time() . '.pdf', // Mock uploaded path
            'status'       => 'pending_review',
        ]);

        AuditLogService::log('BROKER_PAYOUT_REQUEST', $user->id, [
            'broker_id' => $broker->id,
            'payout_id' => $payout->id,
            'amount'    => $fields['amount'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payout request submitted successfully. Awaiting invoice verification.',
            'data'    => $payout,
        ], 201);
    }

    /**
     * GET /api/v1/sales/broker/payout-requests
     */
    public function listPayoutRequests(Request $request): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->first();

        if (!$broker) {
            return response()->json(['success' => false, 'message' => 'Broker profile not found.'], 404);
        }

        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $agencyBrokerIds = Broker::whereIn('user_id', array_merge([$user->id], $subordinateIds))->pluck('id')->toArray();
        if (empty($agencyBrokerIds)) {
            $agencyBrokerIds = [$broker->id];
        }

        $payouts = CommissionPayoutRequest::whereIn('broker_id', $agencyBrokerIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $payouts,
        ]);
    }

    /**
     * GET /api/v1/sales/broker/leaderboard
     */
    public function leaderboard(Request $request): JsonResponse
    {
        // Get rankings of top performing active brokers based on commission sum
        $leaderboard = Broker::active()
            ->withSum('commissions', 'gross_amount')
            ->withCount('commissions')
            ->orderBy('commissions_sum_gross_amount', 'desc')
            ->limit(10)
            ->get();

        // Map ranking sequence
        $rankings = $leaderboard->map(function ($broker, $index) {
            return [
                'rank'         => $index + 1,
                'agency_name'  => $broker->agency_name,
                'agent_name'   => $broker->agent_name,
                'total_deals'  => $broker->commissions_count,
                'total_volume' => (float) ($broker->commissions_sum_gross_amount ?? 0.00),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $rankings,
        ]);
    }
}
