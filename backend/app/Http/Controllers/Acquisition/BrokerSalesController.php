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
use App\Services\AuditLogService;
use App\Services\TierAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
            ->where('status', 'active')
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

        $query = Lead::where('broker_id', $broker->id)
            ->with(['interactions' => fn($q) => $q->latest()->limit(5)]);

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
     * View a single lead (only if belongs to this broker).
     */
    public function showLead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $broker = Broker::where('user_id', $user->id)->firstOrFail();

        $lead = Lead::where('broker_id', $broker->id)
            ->with(['interactions' => fn($q) => $q->latest()->limit(10)])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $lead,
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

        $query = ClientPresentation::byBroker($user->id)
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

        $brokerLeadsCount  = $broker ? Lead::where('broker_id', $broker->id)->count() : 0;
        $totalPresentations = ClientPresentation::byBroker($user->id)->count();
        $pendingPresentations = ClientPresentation::byBroker($user->id)->pending()->count();
        $escalatedCount    = ClientPresentation::byBroker($user->id)->escalated()->count();

        $recentPresentations = ClientPresentation::byBroker($user->id)
            ->with(['lead:id,first_name,last_name', 'project:id,name'])
            ->orderBy('presented_at', 'desc')
            ->limit(5)
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
            ],
            'recent_presentations' => $recentPresentations,
        ]);
    }
}
