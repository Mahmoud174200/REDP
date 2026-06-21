<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\ClientJourneyLog;
use App\Models\ClientPresentation;
use App\Models\Contract;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Reservation;
use App\Models\Unit;
use App\Models\Commission;
use App\Models\CommissionPayoutRequest;
use App\Models\User;
use App\Events\ReservationConfirmed;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Controller: CompanySalesController (Tier 3)
 *
 * Handles company sales representative workflows:
 * - Complete access to all units, pricing, payment plans,
 *   client details, and transaction history
 * - Execute final booking/purchase transactions
 * - View complete client journey (sourcing → presentation → sale)
 * - Modify unit availability and booking status
 * - Full transaction management
 * ─────────────────────────────────────────────────────────
 */
class CompanySalesController extends Controller
{
    // ════════════════════════════════════════════════
    // LEAD MANAGEMENT (FULL ACCESS)
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/company/leads
     * Full lead list with complete journey history.
     * Company sales can see ALL leads.
     */
    public function listLeads(Request $request): JsonResponse
    {
        $query = Lead::with([
            'teleSalesAgent:id,name,email',
            'companySalesAgent:id,name,email',
            'broker:id,agency_name,agent_name',
            'interactions' => fn($q) => $q->latest()->limit(5),
            'interestedProject',
        ]);

        // Optional: filter only leads assigned to this agent
        if ($request->boolean('mine_only')) {
            $query->where('company_sales_agent_id', $request->user()->id);
        }

        // Filter by tier
        if ($request->has('current_tier')) {
            $query->where('current_tier', $request->input('current_tier'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->input('status'));
        }

        // Search
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

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $leads = $query->orderBy($sortBy, $sortDir)
                       ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $leads,
        ]);
    }

    /**
     * GET /api/v1/sales/company/leads/{id}
     * Full lead details including complete journey.
     */
    public function showLead(string $id): JsonResponse
    {
        $lead = Lead::with([
            'teleSalesAgent:id,name,email,phone',
            'companySalesAgent:id,name,email,phone',
            'broker:id,agency_name,agent_name,email,phone',
            'interactions' => fn($q) => $q->latest()->limit(20),
            'presentations' => fn($q) => $q->with(['broker:id,name', 'project:id,name'])->latest(),
            'journeyLogs' => fn($q) => $q->with('actor:id,name,role')->oldest(),
            'commissions',
            'interestedProject',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $lead,
        ]);
    }

    /**
     * GET /api/v1/sales/company/leads/{id}/journey
     * Complete client journey from source to current state.
     */
    public function getJourney(string $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $journey = ClientJourneyLog::forLead($id)
            ->with('actor:id,name,role')
            ->get();

        $presentations = ClientPresentation::where('lead_id', $id)
            ->with(['broker:id,name', 'project:id,name', 'escalatedTo:id,name'])
            ->orderBy('presented_at')
            ->get();

        return response()->json([
            'success' => true,
            'lead'    => $lead->only(['id', 'first_name', 'last_name', 'phone', 'email', 'status', 'current_tier', 'source']),
            'journey' => $journey,
            'presentations' => $presentations,
            'summary' => [
                'total_stages'        => $journey->count(),
                'current_tier'        => $lead->current_tier,
                'source'              => $lead->source,
                'days_in_pipeline'    => $lead->created_at->diffInDays(now()),
                'total_presentations' => $presentations->count(),
            ],
        ]);
    }

    /**
     * PUT /api/v1/sales/company/leads/{id}/assign
     * Assign a lead to the current company sales agent.
     */
    public function assignToSelf(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $lead = Lead::findOrFail($id);

        $lead->update([
            'company_sales_agent_id' => $user->id,
            'current_tier'           => 'tier_3',
        ]);

        AuditLogService::log('LEAD_ASSIGN_COMPANY_SALES', $user->id, [
            'lead_id' => $lead->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead assigned to you.',
            'data'    => $lead->fresh(),
        ]);
    }

    // ════════════════════════════════════════════════
    // BOOKING / TRANSACTION EXECUTION
    // ════════════════════════════════════════════════

    /**
     * POST /api/v1/sales/company/bookings
     * Execute final booking/purchase transaction.
     * Only company sales can execute this.
     */
    public function createBooking(Request $request): JsonResponse
    {
        $user = $request->user();

        $fields = $request->validate([
            'lead_id'      => 'required|uuid|exists:leads,id',
            'unit_id'      => 'required|uuid|exists:units,id',
            'eoi_amount'   => 'nullable|numeric|min:1000',
            'holding_days' => 'nullable|integer|min:1|max:90',
            'notes'        => 'nullable|string|max:2000',
        ]);

        $lead = Lead::findOrFail($fields['lead_id']);
        $eoiAmount = $fields['eoi_amount'] ?? 50000.00;
        $holdingDays = $fields['holding_days'] ?? 7;

        try {
            $reservation = DB::transaction(function () use ($fields, $lead, $user, $eoiAmount, $holdingDays) {
                // Row-level locking to prevent double-booking
                $unit = Unit::where('id', $fields['unit_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$unit->isAvailable()) {
                    throw new \Exception("Unit {$unit->unit_number} is not available (status: {$unit->status}).");
                }

                // 1. Lock the unit
                $unit->update(['status' => 'reserved']);

                // 2. Find or create client user from lead (checking phone/email to avoid duplication/null email errors)
                $clientUser = null;
                if ($lead->email) {
                    $clientUser = \App\Models\User::where('email', $lead->email)->first();
                }
                if (!$clientUser && $lead->phone) {
                    $clientUser = \App\Models\User::where('phone', $lead->phone)->first();
                }

                if (!$clientUser) {
                    $email = $lead->email;
                    if (empty($email)) {
                        $phoneClean = preg_replace('/[^0-9]/', '', $lead->phone);
                        $email = ($phoneClean ? $phoneClean : (string)Str::random(10)) . '@redp-client.com';
                    }

                    // Make sure the email is unique
                    $baseEmail = $email;
                    $counter = 1;
                    while (\App\Models\User::where('email', $email)->exists()) {
                        $parts = explode('@', $baseEmail);
                        $email = $parts[0] . '_' . $counter . '@' . ($parts[1] ?? 'redp-client.com');
                        $counter++;
                    }

                    $clientUser = \App\Models\User::create([
                        'id'       => (string) Str::uuid(),
                        'name'     => $lead->full_name,
                        'email'    => $email,
                        'phone'    => $lead->phone,
                        'role'     => 'client',
                        'password' => \Illuminate\Support\Facades\Hash::make('changeme'),
                        'status'   => 'active',
                    ]);
                }

                // 3. Create reservation with custom holding duration
                $reservation = Reservation::create([
                    'id'         => (string) Str::uuid(),
                    'unit_id'    => $unit->id,
                    'client_id'  => $clientUser->id,
                    'eoi_amount' => $eoiAmount,
                    'status'     => 'confirmed',
                    'expires_at' => now()->addDays($holdingDays),
                ]);

                // 4. Update lead status
                $lead->update([
                    'status'                => Lead::STATUS_RESERVED,
                    'company_sales_agent_id'=> $user->id,
                    'current_tier'          => 'tier_3',
                ]);

                return $reservation;
            });

            // 5. Fire domain event
            event(new ReservationConfirmed(
                $reservation->id,
                $reservation->unit_id,
                $reservation->client_id
            ));

            // 6. Record journey
            AuditLogService::recordJourney(
                $lead->id,
                ClientJourneyLog::STAGE_BOOKING_INITIATED,
                $user,
                [
                    'unit_id'        => $fields['unit_id'],
                    'reservation_id' => $reservation->id,
                    'eoi_amount'     => $eoiAmount,
                    'holding_days'   => $holdingDays,
                ]
            );

            AuditLogService::logBooking($user->id, $lead->id, $fields['unit_id'], [
                'reservation_id' => $reservation->id,
                'notes'          => $fields['notes'] ?? null,
            ]);

            return response()->json([
                'success'     => true,
                'message'     => 'Booking executed successfully. Unit reserved and client account created.',
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
     * POST /api/v1/sales/company/bookings/{id}/cancel
     * Cancel an active booking reservation hold.
     */
    public function cancelBooking(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $reservation = Reservation::findOrFail($id);

        if ($reservation->status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'Only active confirmed reservations can be cancelled.',
            ], 400);
        }

        if ($reservation->contract()->exists()) {
            $contract = $reservation->contract;
            if ($contract && $contract->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel a reservation that already has an active contract.',
                ], 400);
            }
        }

        try {
            DB::transaction(function () use ($reservation, $user) {
                // 1. Delete associated draft contract, payment plan, and payments
                $contract = $reservation->contract;
                if ($contract && $contract->status === 'draft') {
                    if ($contract->paymentPlan) {
                        \App\Models\Payment::where('payment_plan_id', $contract->paymentPlan->id)->delete();
                        $contract->paymentPlan->delete();
                    }
                    \App\Models\Payment::where('contract_id', $contract->id)->delete();
                    $contract->delete();
                }

                // 2. Mark reservation as cancelled
                $reservation->update(['status' => 'cancelled']);

                // 3. Set unit back to available
                $unit = $reservation->unit;
                if ($unit && $unit->status === 'reserved') {
                    $unit->update(['status' => 'available']);
                    
                    event(new \App\Events\Finance\UnitStatusChanged(
                        $unit->id,
                        'reserved',
                        'available',
                        null
                    ));
                }

                // 3. Reset associated lead back to negotiation stage
                if ($reservation->client) {
                    $lead = Lead::where('email', $reservation->client->email)
                        ->orWhere('phone', $reservation->client->phone)
                        ->first();
                    if ($lead && $lead->status === Lead::STATUS_RESERVED) {
                        $lead->update(['status' => Lead::STATUS_NEGOTIATION]);
                    }
                }

                // 4. Record audit log
                AuditLogService::log('RESERVATION_CANCELLED', $user->id, [
                    'reservation_id' => $reservation->id,
                    'unit_id'        => $reservation->unit_id,
                    'client_id'      => $reservation->client_id,
                    'refund_amount'  => (float) $reservation->eoi_amount,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Reservation hold cancelled successfully. Unit is now available and EOI marked for refund.',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }


    // ════════════════════════════════════════════════
    // UNIT MANAGEMENT
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/company/units
     * Full inventory view with all details.
     */
    public function listUnits(Request $request): JsonResponse
    {
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

        $query = Unit::with('project');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->has('project_id')) {
            $query->byProject($request->project_id);
        }
        if ($request->has('type') && $request->type !== 'all') {
            $query->byType($request->type);
        }

        $units = $query->orderBy('unit_number')->get();

        return response()->json([
            'success' => true,
            'data'    => $units,
        ]);
    }

    /**
     * PUT /api/v1/sales/company/units/{id}/status
     * Modify unit availability and booking status.
     */
    public function updateUnitStatus(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $fields = $request->validate([
            'status' => 'required|string|in:available,reserved,sold,hidden,coming_soon,frozen',
            'reason' => 'nullable|string|max:500',
        ]);

        $unit = Unit::findOrFail($id);
        $previousStatus = $unit->status;

        $unit->update(['status' => $fields['status']]);

        AuditLogService::log('UNIT_STATUS_CHANGE', $user->id, [
            'unit_id'         => $id,
            'previous_status' => $previousStatus,
            'new_status'      => $fields['status'],
            'reason'          => $fields['reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Unit status changed from '{$previousStatus}' to '{$fields['status']}'.",
            'data'    => $unit->fresh()->load('project'),
        ]);
    }

    /**
     * POST /api/v1/sales/company/units
     * Create a new unit.
     */
    public function storeUnit(Request $request): JsonResponse
    {
        $user = $request->user();

        $fields = $request->validate([
            'project_id'         => 'required|uuid|exists:projects,id',
            'unit_number'        => 'required|string|max:255',
            'floor'              => 'required|integer',
            'type'               => 'required|string|in:apartment,villa,commercial,office,duplex,penthouse',
            'area'               => 'required|numeric|min:0',
            'bedrooms'           => 'nullable|integer|min:0',
            'bathrooms'          => 'nullable|integer|min:0',
            'view_type'          => 'nullable|string|max:255',
            'building'           => 'nullable|string|max:255',
            'layout_description' => 'nullable|string|max:1000',
            'price'              => 'required|numeric|min:0',
            'status'             => 'required|string|in:available,reserved,sold,hidden,coming_soon,frozen',
            'phase'              => 'required|string|in:Phase 1,Phase 2,Phase 3',
            'handover_date'      => 'nullable|date',
        ]);

        $fields['id'] = (string) Str::uuid();

        $unit = Unit::create($fields);

        // Update project total_units count
        $project = Project::find($fields['project_id']);
        if ($project) {
            $project->increment('total_units');
        }

        AuditLogService::log('UNIT_CREATED', $user->id, [
            'unit_id'    => $unit->id,
            'project_id' => $unit->project_id,
            'unit_number'=> $unit->unit_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully.',
            'data'    => $unit->load('project'),
        ], 201);
    }

    /**
     * PUT /api/v1/sales/company/units/{id}
     * Update an existing unit's details.
     */
    public function updateUnit(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $unit = Unit::findOrFail($id);

        $fields = $request->validate([
            'unit_number'        => 'required|string|max:255',
            'floor'              => 'required|integer',
            'type'               => 'required|string|in:apartment,villa,commercial,office,duplex,penthouse',
            'area'               => 'required|numeric|min:0',
            'bedrooms'           => 'nullable|integer|min:0',
            'bathrooms'          => 'nullable|integer|min:0',
            'view_type'          => 'nullable|string|max:255',
            'building'           => 'nullable|string|max:255',
            'layout_description' => 'nullable|string|max:1000',
            'price'              => 'required|numeric|min:0',
            'status'             => 'required|string|in:available,reserved,sold,hidden,coming_soon,frozen',
            'phase'              => 'required|string|in:Phase 1,Phase 2,Phase 3',
            'handover_date'      => 'nullable|date',
        ]);

        $previousStatus = $unit->status;
        $unit->update($fields);

        if ($previousStatus !== $fields['status']) {
            AuditLogService::log('UNIT_STATUS_CHANGE', $user->id, [
                'unit_id'         => $id,
                'previous_status' => $previousStatus,
                'new_status'      => $fields['status'],
                'reason'          => 'Full unit update',
            ]);
        }

        AuditLogService::log('UNIT_UPDATED', $user->id, [
            'unit_id' => $id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully.',
            'data'    => $unit->fresh()->load('project'),
        ]);
    }

    /**
     * PUT /api/v1/sales/company/projects/{projectId}/phases
     * Update project's released phases.
     */
    public function updateProjectPhases(Request $request, string $projectId): JsonResponse
    {
        $user = $request->user();
        $project = Project::findOrFail($projectId);

        $fields = $request->validate([
            'released_phases' => 'required|array',
            'released_phases.*' => 'required|string|in:Phase 1,Phase 2,Phase 3',
        ]);

        $project->update([
            'released_phases' => $fields['released_phases'],
        ]);

        AuditLogService::log('PROJECT_PHASES_UPDATED', $user->id, [
            'project_id'      => $projectId,
            'released_phases' => $fields['released_phases'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project selling phases updated successfully.',
            'data'    => $project->fresh(),
        ]);
    }

    // ════════════════════════════════════════════════
    // TRANSACTIONS & HISTORY
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/company/transactions
     * Full transaction history.
     */
    public function listTransactions(Request $request): JsonResponse
    {
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

        $query = Reservation::with([
            'unit.project',
            'client:id,name,email,phone',
            'broker:id,agency_name,agent_name',
            'contract.paymentPlan',
            'contract.payments' => fn($q) => $q->orderBy('installment_number'),
        ]);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $transactions = $query->orderBy('created_at', 'desc')
                              ->paginate($request->input('per_page', 25));

        $transactions->getCollection()->transform(function ($txn) {
            $eoi = null;
            if ($txn->client) {
                $eoi = \App\Models\EoiReservation::where(function ($q) use ($txn) {
                    if ($txn->client->email) {
                        $q->where('client_email', $txn->client->email);
                    }
                    if ($txn->client->phone) {
                        $q->orWhere('client_phone', $txn->client->phone);
                    }
                })
                ->where('unit_id', $txn->unit_id)
                ->first();
            }
            $txn->eoi_reservation = $eoi;
            return $txn;
        });

        return response()->json([
            'success' => true,
            'data'    => $transactions,
        ]);
    }

    /**
     * GET /api/v1/sales/company/transactions/{id}
     * Single transaction with full details.
     */
    public function showTransaction(string $id): JsonResponse
    {
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

        $reservation = Reservation::with([
            'unit.project',
            'client',
            'contract.paymentPlan',
            'contract.payments',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $reservation,
        ]);
    }

    // ════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/company/dashboard
     * Company sales dashboard with pipeline metrics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // Lead pipeline stats
        $totalLeads       = Lead::count();
        $tier1Leads       = Lead::where('current_tier', 'tier_1')->count();
        $tier2Leads       = Lead::where('current_tier', 'tier_2')->count();
        $tier3Leads       = Lead::where('current_tier', 'tier_3')->count();
        $myLeads          = Lead::where('company_sales_agent_id', $user->id)->count();

        // Booking stats
        $totalBookings    = Reservation::where('status', 'confirmed')->count();
        $myBookings       = Reservation::where('status', 'confirmed')
            ->whereHas('client', function ($q) use ($user) {
                // Bookings created from leads assigned to this agent
            })->count();

        // Revenue stats
        $totalSoldValue   = Unit::where('status', 'sold')->sum('price');
        $totalReservedValue = Unit::where('status', 'reserved')->sum('price');

        // Recent escalations from brokers
        $recentEscalations = ClientPresentation::escalated()
            ->with(['broker:id,name', 'lead:id,first_name,last_name,phone', 'project:id,name'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        // Pending leads to action (assigned to me, tier 3, not yet reserved)
        $pendingActions = Lead::where('company_sales_agent_id', $user->id)
            ->where('current_tier', 'tier_3')
            ->whereNotIn('status', [Lead::STATUS_RESERVED, Lead::STATUS_CONTRACTED])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get(['id', 'first_name', 'last_name', 'phone', 'status', 'current_tier', 'updated_at']);

        // Subordinates Performance
        $subordinateIds = $user->employeeHierarchy ? $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray() : [];
        $subordinatesPerformance = [];

        if (!empty($subordinateIds)) {
            $subordinateUsers = User::whereIn('id', $subordinateIds)
                ->with(['employeeHierarchy.position', 'employeeHierarchy.team'])
                ->get();

            foreach ($subordinateUsers as $subUser) {
                $leadQuery = Lead::where('company_sales_agent_id', $subUser->id);

                $total = $leadQuery->count();
                $new = (clone $leadQuery)->byStatus('new')->count();
                $contacted = (clone $leadQuery)->byStatus('contacted')->count();
                $reserved = (clone $leadQuery)->byStatus('reserved')->count();

                $subReservationsCount = Reservation::whereIn('client_id', function ($q) use ($subUser) {
                    $q->select('id')->from('users')->whereIn('phone', function ($q2) use ($subUser) {
                        $q2->select('phone')->from('leads')->where('company_sales_agent_id', $subUser->id);
                    });
                })->count();

                $commEarned = \App\Models\CommissionCalculation::where('user_id', $subUser->id)
                    ->where('status', 'approved')
                    ->sum('calculated_amount');

                $subordinatesPerformance[] = [
                    'user_id' => $subUser->id,
                    'name' => $subUser->name,
                    'role' => $subUser->role,
                    'position' => $subUser->employeeHierarchy?->position?->title ?? 'Sales Agent',
                    'team' => $subUser->employeeHierarchy?->team?->name ?? 'No Team',
                    'status' => $subUser->status,
                    'stats' => [
                        'total_leads' => $total,
                        'new' => $new,
                        'contacted' => $contacted,
                        'reserved' => $reserved,
                        'reservations' => $subReservationsCount,
                        'commissions_earned' => (float) $commEarned,
                    ]
                ];
            }
        }

        // Personal Commissions
        $pendingComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'pending')->sum('calculated_amount');
        $approvedComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'approved')->sum('calculated_amount');
        $paidComm = (float) \App\Models\CommissionCalculation::where('user_id', $user->id)->where('status', 'paid')->sum('calculated_amount');

        $commCalculations = \App\Models\CommissionCalculation::where('user_id', $user->id)
            ->with(['contract.unit.project'])
            ->latest()
            ->limit(10)
            ->get();

        // Active Commission Rules for Tier 3
        $commRules = \App\Models\CommissionRule::where('tier_type', 'tier_3')
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'stats'   => [
                'pipeline' => [
                    'total_leads'  => $totalLeads,
                    'tier_1'       => $tier1Leads,
                    'tier_2'       => $tier2Leads,
                    'tier_3'       => $tier3Leads,
                    'my_leads'     => $myLeads,
                ],
                'bookings' => [
                    'total_confirmed' => $totalBookings,
                ],
                'revenue' => [
                    'sold_value'     => (float) $totalSoldValue,
                    'reserved_value' => (float) $totalReservedValue,
                ],
                'pending_commission' => $pendingComm,
                'approved_commission'=> $approvedComm,
                'paid_commission'    => $paidComm,
                'total_commission'   => $pendingComm + $approvedComm + $paidComm,
            ],
            'recent_escalations' => $recentEscalations,
            'pending_actions'    => $pendingActions,
            'subordinates_performance' => $subordinatesPerformance,
            'commissions_history'       => $commCalculations,
            'commission_rules'          => $commRules,
        ]);
    }

    // ════════════════════════════════════════════════
    // PROJECTS & INVENTORY (FULL ACCESS)
    // ════════════════════════════════════════════════

    /**
     * GET /api/v1/sales/company/projects
     * Full project listing with unit counts.
     */
    public function listProjects(): JsonResponse
    {
        $projects = Project::withCount('units')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $projects,
        ]);
    }

    /**
     * GET /api/v1/sales/company/reservations
     * List all broker reservation requests.
     */
    public function listBrokerReservations(Request $request): JsonResponse
    {
        $reservations = Reservation::whereNotNull('broker_id')
            ->with(['unit.project', 'client', 'broker'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $reservations,
        ]);
    }

    /**
     * POST /api/v1/sales/company/reservations/{id}/approve
     * Approve a pending broker reservation.
     */
    public function approveBrokerReservation(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $reservation = Reservation::with(['unit', 'client', 'broker'])->findOrFail($id);

        if ($reservation->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending reservation requests can be approved.',
            ], 400);
        }

        try {
            DB::transaction(function () use ($reservation, $user) {
                // 1. Confirm reservation
                $reservation->update([
                    'status'     => 'confirmed',
                    'expires_at' => now()->addDays(7),
                ]);

                // 2. Lock unit to reserved
                $unit = $reservation->unit;
                $previousStatus = $unit->status;
                $unit->update(['status' => 'reserved']);

                // 3. Cancel other pending reservations for this unit
                Reservation::where('unit_id', $reservation->unit_id)
                    ->where('id', '!=', $reservation->id)
                    ->where('status', 'pending')
                    ->update([
                        'status'               => 'cancelled',
                        'cancellation_reason'  => 'Unit reserved by another approved hold request.',
                    ]);

                // 4. Update lead status to Reserved
                $lead = Lead::where('phone', $reservation->client->phone)
                    ->orWhere('email', $reservation->client->email)
                    ->first();

                if ($lead) {
                    $lead->update([
                        'status'                 => Lead::STATUS_RESERVED,
                        'company_sales_agent_id' => $user->id,
                        'current_tier'           => 'tier_3',
                    ]);

                    // 5. Generate commission pending ledger
                    Commission::create([
                        'id'           => (string) Str::uuid(),
                        'broker_id'    => $reservation->broker_id,
                        'lead_id'      => $lead->id,
                        'unit_id'      => $reservation->unit_id,
                        'rate_percent' => 2.50, // Standard 2.50% commission rate
                        'gross_amount' => $unit->price * 0.025,
                        'status'       => 'pending',
                    ]);

                    // Record journey
                    AuditLogService::recordJourney(
                        $lead->id,
                        ClientJourneyLog::STAGE_BOOKING_INITIATED,
                        $user,
                        [
                            'unit_id'        => $reservation->unit_id,
                            'reservation_id' => $reservation->id,
                            'eoi_amount'     => $reservation->eoi_amount,
                        ]
                    );
                }

                // Emit event
                event(new \App\Events\Finance\UnitStatusChanged($unit->id, $previousStatus, 'reserved', $reservation->client_id));
            });

            // Emit decoupled notification event
            event(new ReservationConfirmed($reservation->id, $reservation->unit_id, $reservation->client_id));

            return response()->json([
                'success' => true,
                'message' => 'Broker reservation hold approved. Unit is locked and commission ledger registered.',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * POST /api/v1/sales/company/reservations/{id}/cancel
     * Cancel a broker reservation.
     */
    public function cancelBrokerReservation(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $reservation = Reservation::findOrFail($id);

        $fields = $request->validate([
            'cancellation_reason' => 'required|string|max:1000',
        ]);

        try {
            DB::transaction(function () use ($reservation, $fields, $user) {
                $previousStatus = $reservation->unit->status;

                // 1. Mark reservation as cancelled
                $reservation->update([
                    'status'              => 'cancelled',
                    'cancelled_by'        => $user->id,
                    'cancellation_reason' => $fields['cancellation_reason'],
                ]);

                // 2. Set unit back to available if it is currently reserved or pending_reservation
                $unit = $reservation->unit;
                if ($unit && ($unit->status === 'reserved' || $unit->status === 'pending_reservation')) {
                    // Check if there are other pending holds on this unit
                    $hasOtherHolds = Reservation::where('unit_id', $unit->id)
                        ->where('status', 'pending')
                        ->exists();

                    $newStatus = $hasOtherHolds ? 'pending_reservation' : 'available';
                    $unit->update(['status' => $newStatus]);
                    
                    event(new \App\Events\Finance\UnitStatusChanged($unit->id, $previousStatus, $newStatus, null));
                }

                // 3. Reset associated lead back to negotiation stage
                if ($reservation->client) {
                    $lead = Lead::where('email', $reservation->client->email)
                        ->orWhere('phone', $reservation->client->phone)
                        ->first();
                    if ($lead && $lead->status === Lead::STATUS_RESERVED) {
                        $lead->update(['status' => Lead::STATUS_NEGOTIATION]);
                    }

                    // Void any pending commission record
                    if ($lead) {
                        Commission::where('unit_id', $reservation->unit_id)
                            ->where('broker_id', $reservation->broker_id)
                            ->delete();
                    }
                }

                // 4. Record audit log
                AuditLogService::log('RESERVATION_CANCELLED', $user->id, [
                    'reservation_id' => $reservation->id,
                    'unit_id'        => $reservation->unit_id,
                    'client_id'      => $reservation->client_id,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Broker reservation cancelled successfully. Inventory released and commission voided.',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /api/v1/sales/company/payout-requests
     */
    public function listPayoutRequests(Request $request): JsonResponse
    {
        $payouts = CommissionPayoutRequest::with('broker')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $payouts,
        ]);
    }

    /**
     * POST /api/v1/sales/company/payout-requests/{id}/approve
     */
    public function approvePayoutRequest(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $payout = CommissionPayoutRequest::findOrFail($id);

        if ($payout->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'This payout request has already been processed.',
            ], 400);
        }

        try {
            DB::transaction(function () use ($payout, $user) {
                // 1. Mark payout as paid
                $payout->update([
                    'status'      => 'paid',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);

                // 2. Mark corresponding commissions of this broker as paid up to the payout amount
                $commissions = Commission::where('broker_id', $payout->broker_id)
                    ->approved()
                    ->orderBy('created_at', 'asc')
                    ->get();

                $remainingAmount = $payout->amount;
                foreach ($commissions as $comm) {
                    if ($remainingAmount <= 0) break;
                    if ($comm->gross_amount <= $remainingAmount) {
                        $comm->update(['status' => 'paid']);
                        $remainingAmount -= $comm->gross_amount;
                    } else {
                        $comm->update(['status' => 'paid']); // Mark paid for simple resolution
                        break;
                    }
                }

                AuditLogService::log('BROKER_PAYOUT_APPROVED', $user->id, [
                    'payout_id' => $payout->id,
                    'broker_id' => $payout->broker_id,
                    'amount'    => $payout->amount,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Payout request approved and marked as paid.',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * POST /api/v1/sales/company/payout-requests/{id}/reject
     */
    public function rejectPayoutRequest(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $payout = CommissionPayoutRequest::findOrFail($id);

        if ($payout->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'This payout request has already been processed.',
            ], 400);
        }

        $fields = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $payout->update([
            'status'           => 'rejected',
            'rejection_reason' => $fields['rejection_reason'],
        ]);

        AuditLogService::log('BROKER_PAYOUT_REJECTED', $user->id, [
            'payout_id' => $payout->id,
            'broker_id' => $payout->broker_id,
            'reason'    => $fields['rejection_reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payout request rejected.',
        ]);
    }
}
