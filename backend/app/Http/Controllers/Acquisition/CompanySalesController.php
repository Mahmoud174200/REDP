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
            'status' => 'required|string|in:available,reserved,sold,blocked',
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
            'contract',
        ]);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $transactions = $query->orderBy('created_at', 'desc')
                              ->paginate($request->input('per_page', 25));

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
            ],
            'recent_escalations' => $recentEscalations,
            'pending_actions'    => $pendingActions,
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
     * GET /api/v1/sales/company/projects/{projectId}/payment-plans
     * Get standard project payment plans.
     */
    public function getProjectPaymentPlans(string $projectId): JsonResponse
    {
        $plans = \App\Models\ProjectPaymentPlan::where('project_id', $projectId)->get();
        return response()->json([
            'success' => true,
            'data'    => $plans,
        ]);
    }
}
