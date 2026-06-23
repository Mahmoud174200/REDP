<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceTicket;
use App\Models\Notification;
use App\Models\Appointment;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientPortalController extends Controller
{
    /**
     * Get owner dashboard overview metrics.
     * Section H.2/H.8: Displays visitor counts, pending snags, tickets, and notifications.
     */
    public function getOverview(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'handover_officer' || $user->role === 'delivery_engineer' || $user->role === 'project_manager' || $user->role === 'admin') {
            $totalProjects = \App\Models\Project::count();
            $totalUnits = \App\Models\Unit::count();
            $completedHandovers = \App\Models\Unit::where('status', 'sold')->count();
            $pendingHandovers = \App\Models\Unit::where('status', '!=', 'sold')->count();
            $activeSnags = \App\Models\DefectsSnag::where('status', 'pending')->count();
            $totalSnags = \App\Models\DefectsSnag::count();

            $scheduledHandoversQuery = \App\Models\Unit::whereNotNull('handover_date')
                ->with(['project', 'assignedEngineer']);

            if ($user->role === 'delivery_engineer') {
                $scheduledHandoversQuery->where('assigned_engineer_id', $user->id);
            }

            $scheduledHandovers = $scheduledHandoversQuery->orderBy('handover_date', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($unit) {
                    return [
                        'id' => $unit->id,
                        'unit_number' => $unit->unit_number,
                        'project_name' => $unit->project?->name ?? 'N/A',
                        'handover_date' => $unit->handover_date,
                        'status' => $unit->status,
                        'assigned_engineer_id' => $unit->assigned_engineer_id,
                        'assigned_engineer_name' => $unit->assignedEngineer?->name ?? null,
                    ];
                });

            $engineers = [];
            if ($user->role === 'handover_officer' || $user->role === 'admin' || $user->role === 'project_manager') {
                $engineers = \App\Models\User::where('role', 'delivery_engineer')
                    ->select('id', 'name', 'email')
                    ->get();
            }

            return response()->json([
                'success' => true,
                'role' => $user->role,
                'metrics' => [
                    'total_projects' => $totalProjects,
                    'total_units' => $totalUnits,
                    'completed_handovers' => $completedHandovers,
                    'pending_handovers' => $pendingHandovers,
                    'active_snags' => $activeSnags,
                    'total_snags' => $totalSnags
                ],
                'scheduled_handovers' => $scheduledHandovers,
                'engineers' => $engineers,
                'recent_snags' => \App\Models\DefectsSnag::with('unit')->latest()->limit(5)->get()
            ]);
        }

        $clientId = $user->id;

        // Fetch counts for this client
        $ticketsCount = MaintenanceTicket::where('client_id', $clientId)->count();
        $pendingTickets = MaintenanceTicket::where('client_id', $clientId)->where('status', 'open')->count();
        $appointmentsCount = Appointment::where('user_id', $clientId)->count();
        
        // Fetch active notifications
        $notifications = Notification::where('user_id', $clientId)
            ->latest()
            ->limit(5)
            ->get();

        // Fetch EOI reservation of the logged-in client (by email or phone)
        $eoiReservation = \App\Models\EoiReservation::where('client_email', $user->email)
            ->orWhere('client_phone', $user->phone)
            ->with(['unit.project'])
            ->first();

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'metrics' => [
                'total_tickets' => $ticketsCount,
                'open_tickets' => $pendingTickets,
                'scheduled_appointments' => $appointmentsCount,
                'active_visitor_passes' => 3 // Simulated count for visitor passes
            ],
            'recent_notifications' => $notifications,
            'eoi_reservation' => $eoiReservation,
            'compound_status' => [
                'water_supply' => 'Normal',
                'power_grid' => 'Stable',
                'gate_security' => 'Fully Operational',
                'next_maintenance_sweep' => '2026-06-05'
            ]
        ], 200);
    }

    /**
     * Submit visitor gate code request.
     * Section H.8: Generates a simulated guest QR entry code.
     */
    public function requestGateCode(Request $request)
    {
        $request->validate([
            'visitor_name' => 'required|string|max:255',
            'visit_date' => 'required|date',
            'car_plate' => 'nullable|string|max:20',
        ]);

        $clientId = $request->user()->id;
        $guestId = (string) Str::uuid();

        // Simulated QR Code Payload containing security signature
        $qrPayload = [
            'guest_id' => $guestId,
            'visitor' => $request->visitor_name,
            'host_id' => $clientId,
            'date' => $request->visit_date,
            'plate' => $request->car_plate ?: 'None',
            'signature' => hash_hmac('sha256', $guestId, 'redp-secret-key-gate')
        ];

        AuditLogService::log('VISITOR_PASS_CREATE', $clientId, ['guest_id' => $guestId, 'visitor' => $request->visitor_name]);

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Visitor gate entry code generated successfully.',
            'visitor_details' => [
                'pass_id' => $guestId,
                'name' => $request->visitor_name,
                'plate' => $request->car_plate ?: 'None',
                'date' => $request->visit_date,
            ],
            // Simulated Base64 QR Code string for scanning
            'qr_code_data' => 'data:image/png;base64,' . base64_encode(json_encode($qrPayload))
        ], 201);
    }

    /**
     * Get visual workflow automation templates list.
     * Section H.19: Automation rules registry.
     */
    public function getWorkflows(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'data' => \App\Models\WorkflowTemplate::latest()->get()
        ], 200);
    }

    /**
     * Store a visual workflow rule template.
     */
    public function storeWorkflow(Request $request)
    {
        $request->validate([
            'trigger_name' => 'required|string',
            'action_name' => 'required|string',
            'rules_payload' => 'nullable|array'
        ]);

        $wfId = (string) Str::uuid();

        $wf = \App\Models\WorkflowTemplate::create([
            'id' => $wfId,
            'trigger_name' => $request->trigger_name,
            'action_name' => $request->action_name,
            'rules_payload' => $request->rules_payload ?? [],
            'active' => true
        ]);

        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'message' => 'Workflow rule compiled and stored in active runtime templates.',
            'data' => $wf
        ], 201);
    }

    /**
     * Submit 5% down payment receipt for EOI reservation.
     */
    public function payFivePercent(Request $request, string $id)
    {
        $request->validate([
            'receipt' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf',
        ]);

        $reservation = \App\Models\EoiReservation::findOrFail($id);

        // Handle receipt upload
        $receiptPath = $request->file('receipt')->store('eoi-receipts', 'public');

        // Calculate 5% amount if unit exists
        $amount = 0.00;
        if ($reservation->unit) {
            $amount = (float) $reservation->unit->price * 0.05;
        }

        $reservation->update([
            'five_percent_paid' => false,
            'five_percent_status' => 'pending_review',
            'five_percent_amount' => $amount,
            'five_percent_receipt_path' => $receiptPath,
        ]);

        // Log audit trail
        AuditLogService::log('EOI_FIVE_PERCENT_SUBMIT', $request->user()->id, [
            'eoi_reservation_id' => $reservation->id,
            'amount' => $amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => '5% down payment receipt uploaded successfully and is pending review.',
            'data' => $reservation->fresh()->load('unit.project'),
        ]);
    }
}
