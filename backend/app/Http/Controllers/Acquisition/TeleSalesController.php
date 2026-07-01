<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Unit;
use App\Models\ClientJourneyLog;
use App\Services\AuditLogService;
use App\Services\TierAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\User;

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
            ->with(['interactions' => fn($q) => $q->latest()->limit(5), 'interestedProject']);

        // Status filter
        if ($request->has('status') && $request->input('status') !== 'all') {
            $status = $request->input('status');
            if ($status === 'transferred') {
                $query->where('current_tier', '!=', 'tier_1');
            } else {
                $query->byStatus($status);
            }
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
            'first_name'            => 'required|string|max:100',
            'last_name'             => 'required|string|max:100',
            'email'                 => 'nullable|email|max:255',
            'phone'                 => 'required|string|max:20',
            'source'                => 'nullable|string|in:facebook,google,tiktok,direct,referral',
            'notes'                 => 'nullable|string|max:1000',
            'budget'                => 'nullable|numeric|min:0',
            'payment_method'        => 'nullable|string|in:cash,installment',
            'interested_project_id' => 'nullable|uuid|exists:projects,id',
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
            'budget'                => $fields['budget'] ?? null,
            'payment_method'        => $fields['payment_method'] ?? 'installment',
            'interested_project_id' => $fields['interested_project_id'] ?? null,
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
     * PUT /api/v1/sales/tele/leads/{id}
     * Update lead details (only if assigned to current agent).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $lead = Lead::forTier($user)->findOrFail($id);

        $fields = $request->validate([
            'first_name'            => 'required|string|max:100',
            'last_name'             => 'required|string|max:100',
            'email'                 => 'nullable|email|max:255',
            'phone'                 => 'required|string|max:20',
            'source'                => 'nullable|string|in:facebook,google,tiktok,direct,referral',
            'budget'                => 'nullable|numeric|min:0',
            'payment_method'        => 'nullable|string|in:cash,installment',
            'interested_project_id' => 'nullable|uuid|exists:projects,id',
        ]);

        if ($fields['phone'] !== $lead->phone) {
            $existing = Lead::where('phone', $fields['phone'])->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'A lead with this phone number already exists.',
                ], 409);
            }
        }

        $lead->update([
            'first_name'            => $fields['first_name'],
            'last_name'             => $fields['last_name'],
            'email'                 => $fields['email'] ?? null,
            'phone'                 => $fields['phone'],
            'source'                => $fields['source'] ?? 'direct',
            'budget'                => $fields['budget'] ?? null,
            'payment_method'        => $fields['payment_method'] ?? 'installment',
            'interested_project_id' => $fields['interested_project_id'] ?? null,
        ]);

        AuditLogService::log('LEAD_UPDATE', $user->id, [
            'lead_id' => $lead->id,
            'tier'    => 'tier_1',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully.',
            'data'    => TierAccessService::filterLeadForRole($lead->fresh()->toArray(), $user),
        ]);
    }

    /**
     * GET /api/v1/sales/tele/leads/{id}
     * View a single lead (only if assigned to current agent).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $lead = Lead::forTier($user)
            ->with(['interactions' => fn($q) => $q->latest()->limit(10), 'interestedProject'])
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

        // Claim from the shared inbound pool: once an agent actually works a lead
        // it becomes theirs and leaves the unassigned pool.
        if (!$lead->tele_sales_agent_id) {
            $lead->tele_sales_agent_id = $user->id;
            $lead->current_tier = $lead->current_tier ?: 'tier_1';
            $lead->save();
        }

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

        // Claim from the shared inbound pool when the agent schedules a meeting.
        $claim = $lead->tele_sales_agent_id ? [] : ['tele_sales_agent_id' => $user->id];
        $lead->update(['status' => Lead::STATUS_VISIT_SCHEDULED] + $claim);

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
    // PROJECT & INVENTORY BROWSING
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/tele/projects
     * Returns projects with summary stats (unit counts, price range, types).
     */
    public function listProjects(Request $request): JsonResponse
    {
        $projects = Project::orderBy('name')->get();

        $data = $projects->map(function ($project) {
            $units = Unit::where('project_id', $project->id)->get();
            $availableUnits = $units->where('status', 'available');

            return [
                'id'             => $project->id,
                'name'           => $project->name,
                'location'       => $project->location,
                'status'         => $project->status,
                'delivery_date'  => $project->delivery_date,
                'total_units'    => $units->count(),
                'available_units'=> $availableUnits->count(),
                'sold_units'     => $units->whereIn('status', ['sold', 'reserved'])->count(),
                'price_min'      => $units->min('price'),
                'price_max'      => $units->max('price'),
                'unit_types'     => $units->pluck('type')->unique()->values()->toArray(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * GET /api/v1/sales/tele/projects/{projectId}
     * Returns full project details with all units.
     */
    public function showProject(Request $request, string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $units = Unit::where('project_id', $projectId)
            ->orderBy('floor')
            ->orderBy('unit_number')
            ->get();

        // Group units by type for summary
        $unitsByType = $units->groupBy('type')->map(function ($group, $type) {
            return [
                'type'           => $type,
                'count'          => $group->count(),
                'available'      => $group->where('status', 'available')->count(),
                'price_min'      => $group->min('price'),
                'price_max'      => $group->max('price'),
                'area_min'       => $group->min('area'),
                'area_max'       => $group->max('area'),
                'bedrooms_range' => $group->pluck('bedrooms')->filter()->unique()->sort()->values()->toArray(),
            ];
        })->values();

        // Generate standard payment plan templates based on unit prices
        $avgPrice = $units->avg('price') ?? 0;
        
        $dbPlans = \App\Models\ProjectPaymentPlan::where('project_id', $projectId)->get();
        if ($dbPlans->isNotEmpty()) {
            $paymentPlans = $dbPlans->map(function ($pp) use ($avgPrice) {
                $remPct = 1 - ($pp->down_payment_pct / 100);
                return [
                    'name'              => $pp->name,
                    'name_ar'           => $pp->name_ar,
                    'down_payment_pct'  => (float) $pp->down_payment_pct,
                    'installments'      => (int) $pp->installments,
                    'duration_months'   => (int) $pp->installments,
                    'monthly_amount'    => $pp->installments > 0 ? round($avgPrice * $remPct / $pp->installments, 2) : 0,
                    'discount_pct'      => (float) $pp->discount_pct,
                    'description'       => $pp->description,
                ];
            })->toArray();
        } else {
            $paymentPlans = [
                [
                    'name'              => 'Cash Payment',
                    'name_ar'           => 'كاش',
                    'down_payment_pct'  => 100,
                    'installments'      => 0,
                    'duration_months'   => 0,
                    'monthly_amount'    => 0,
                    'discount_pct'      => 10,
                    'description'       => 'Full cash payment with 10% discount',
                ],
                [
                    'name'              => '5-Year Plan',
                    'name_ar'           => 'خطة 5 سنوات',
                    'down_payment_pct'  => 20,
                    'installments'      => 60,
                    'duration_months'   => 60,
                    'monthly_amount'    => round($avgPrice * 0.80 / 60, 2),
                    'discount_pct'      => 0,
                    'description'       => '20% down payment + 60 monthly installments',
                ],
                [
                    'name'              => '7-Year Plan',
                    'name_ar'           => 'خطة 7 سنوات',
                    'down_payment_pct'  => 15,
                    'installments'      => 84,
                    'duration_months'   => 84,
                    'monthly_amount'    => round($avgPrice * 0.85 / 84, 2),
                    'discount_pct'      => 0,
                    'description'       => '15% down payment + 84 monthly installments',
                ],
                [
                    'name'              => '10-Year Plan',
                    'name_ar'           => 'خطة 10 سنوات',
                    'down_payment_pct'  => 10,
                    'installments'      => 120,
                    'duration_months'   => 120,
                    'monthly_amount'    => round($avgPrice * 0.90 / 120, 2),
                    'discount_pct'      => 0,
                    'description'       => '10% down payment + 120 monthly installments',
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'project'        => [
                    'id'            => $project->id,
                    'name'          => $project->name,
                    'location'      => $project->location,
                    'status'        => $project->status,
                    'delivery_date' => $project->delivery_date,
                    'total_units'   => $units->count(),
                    'available_units' => $units->where('status', 'available')->count(),
                ],
                'units_summary'  => $unitsByType,
                'units'          => [],
                'payment_plans'  => $paymentPlans,
            ],
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

        // 1. Hierarchy / Subordinates Performance
        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $subordinatesPerformance = [];

        if (!empty($subordinateIds)) {
            $subordinateUsers = User::whereIn('id', $subordinateIds)
                ->with(['employeeHierarchy.position', 'employeeHierarchy.team'])
                ->get();

            foreach ($subordinateUsers as $subUser) {
                $leadQuery = Lead::where('tele_sales_agent_id', $subUser->id);

                $total = $leadQuery->count();
                $new = (clone $leadQuery)->byStatus('new')->count();
                $contacted = (clone $leadQuery)->byStatus('contacted')->count();
                $scheduled = (clone $leadQuery)->byStatus('visit_scheduled')->count();
                $subTransferred = Lead::where('tele_sales_agent_id', $subUser->id)
                    ->where('current_tier', '!=', 'tier_1')
                    ->count();

                $commEarned = \App\Models\CommissionCalculation::where('user_id', $subUser->id)
                    ->where('status', 'approved')
                    ->sum('calculated_amount');

                $subordinatesPerformance[] = [
                    'user_id' => $subUser->id,
                    'name' => $subUser->name,
                    'role' => $subUser->role,
                    'position' => $subUser->employeeHierarchy?->position?->title ?? 'TeleSales Agent',
                    'team' => $subUser->employeeHierarchy?->team?->name ?? 'No Team',
                    'status' => $subUser->status,
                    'stats' => [
                        'total_leads' => $total,
                        'new' => $new,
                        'contacted' => $contacted,
                        'meetings' => $scheduled,
                        'transferred' => $subTransferred,
                        'commissions_earned' => (float) $commEarned,
                    ]
                ];
            }
        }

        // 2. Personal Commissions ledger summary
        $pendingComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'pending')->sum('calculated_amount');
        $approvedComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'approved')->sum('calculated_amount');
        $paidComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'paid')->sum('calculated_amount');

        $commCalculations = \App\Models\CommissionCalculation::where('user_id', $user->id)
            ->with(['contract.unit.project'])
            ->latest()
            ->limit(10)
            ->get();

        // 3. Active Commission Rules for Tier 1
        $commRules = \App\Models\CommissionRule::where('tier_type', 'tier_1')
            ->where('status', 'active')
            ->get();

        $actionNeeded = $this->buildActionNeeded($user);

        return response()->json([
            'success' => true,
            'stats'   => [
                'total_leads'       => $totalLeads,
                'new_leads'         => $newLeads,
                'contacted'         => $contacted,
                'meetings_scheduled'=> $scheduled,
                'transferred'       => $transferred,
                'action_needed'     => count($actionNeeded),
                'pending_commission'=> $pendingComm,
                'approved_commission'=> $approvedComm,
                'paid_commission'   => $paidComm,
                'total_commission'  => $pendingComm + $approvedComm + $paidComm,
            ],
            'action_needed'             => $actionNeeded,
            'subordinates_performance' => $subordinatesPerformance,
            'commissions_history'       => $commCalculations,
            'commission_rules'          => $commRules,
        ]);
    }

    /**
     * GET /api/v1/sales/tele/follow-ups
     * Standalone feed of leads that need an action (same logic as the dashboard
     * card) so the portal can refresh it independently.
     */
    public function followUps(Request $request): JsonResponse
    {
        return response()->json([
            'success'       => true,
            'action_needed' => $this->buildActionNeeded($request->user()),
        ]);
    }

    /**
     * Builds the prioritised "needs action" work-list for a tele-sales agent:
     *  - overdue_followup: a follow-up date was set and has now passed
     *  - never_contacted : still 'new' (inbound pool leads never called)
     *  - stale           : contacted but gone quiet with no follow-up planned
     * Leads that already have a FUTURE follow-up/meeting are on track and excluded.
     */
    private function buildActionNeeded(User $user, int $staleDays = 3): array
    {
        $now = now();

        $leads = Lead::forTier($user)
            ->where('current_tier', 'tier_1')
            ->whereNotIn('status', [Lead::STATUS_RESERVED, Lead::STATUS_CONTRACTED])
            ->with(['interestedProject', 'interactions'])
            ->get();

        $actions = [];

        foreach ($leads as $lead) {
            $interactions   = $lead->interactions;
            $futureFollowUp = $interactions->first(fn($i) => $i->follow_up_date && $i->follow_up_date->isFuture());
            if ($futureFollowUp) {
                continue; // on track — a follow-up/meeting is already booked
            }

            $dueFollowUp = $interactions
                ->filter(fn($i) => $i->follow_up_date && $i->follow_up_date->isPast())
                ->sortByDesc('follow_up_date')
                ->first();
            $lastActivity = $interactions->max('created_at') ?? $lead->created_at;
            $daysSince    = $lastActivity ? (int) floor($lastActivity->diffInDays($now)) : 0;

            $reason = null;
            $severity = 'low';
            $detailEn = '';
            $detailAr = '';
            $days = 0;

            if ($dueFollowUp) {
                $days     = (int) floor($dueFollowUp->follow_up_date->diffInDays($now));
                $reason   = 'overdue_followup';
                $severity = $days >= 2 ? 'high' : 'medium';
                $detailEn = "Follow-up was due " . ($days <= 0 ? 'today' : "{$days} day(s) ago");
                $detailAr = "متابعة مستحقة " . ($days <= 0 ? 'اليوم' : "من {$days} يوم");
            } elseif ($lead->status === Lead::STATUS_NEW) {
                $days     = (int) floor(($lead->created_at ?? $now)->diffInDays($now));
                $reason   = 'never_contacted';
                $severity = $days >= 1 ? 'high' : 'medium';
                $detailEn = $days <= 0 ? 'New lead — call for the first time' : "New lead waiting {$days} day(s) — not contacted yet";
                $detailAr = $days <= 0 ? 'عميل جديد — اتصل به لأول مرة' : "عميل جديد منتظر {$days} يوم — لم يتم التواصل بعد";
            } elseif ($daysSince >= $staleDays) {
                $days     = $daysSince;
                $reason   = 'stale';
                $severity = $days >= 7 ? 'high' : 'medium';
                $detailEn = "No contact for {$days} day(s) and no follow-up planned";
                $detailAr = "بدون تواصل منذ {$days} يوم ولا توجد متابعة مجدولة";
            }

            if (!$reason) {
                continue;
            }

            $actions[] = [
                'lead_id'      => $lead->id,
                'name'         => trim($lead->first_name . ' ' . $lead->last_name),
                'phone'        => $lead->phone,
                'status'       => $lead->status,
                'source'       => $lead->source,
                'is_pool'      => $lead->tele_sales_agent_id === null,
                'project'      => $lead->interestedProject?->name,
                'reason'       => $reason,
                'severity'     => $severity,
                'days'         => $days,
                'detail_en'    => $detailEn,
                'detail_ar'    => $detailAr,
                'last_activity'=> $lastActivity?->toDateTimeString(),
            ];
        }

        // High severity first, then the longest-waiting.
        $rank = ['high' => 0, 'medium' => 1, 'low' => 2];
        usort($actions, fn($a, $b) => [$rank[$a['severity']], -$a['days']] <=> [$rank[$b['severity']], -$b['days']]);

        return $actions;
    }
}
