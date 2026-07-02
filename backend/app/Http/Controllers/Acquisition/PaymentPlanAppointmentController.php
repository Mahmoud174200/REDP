<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Services\Acquisition\PaymentPlanAppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Payment-Plan Appointment
 * Controller: PaymentPlanAppointmentController
 *
 * Books the developer-office meeting that follows unit selection,
 * where the customer sits with an assigned developer rep to set up
 * the payment plan. The rep's name / phone / title are returned so
 * the client knows exactly who they will meet.
 * ─────────────────────────────────────────────────────────
 */
class PaymentPlanAppointmentController extends Controller
{
    public function __construct(private PaymentPlanAppointmentService $service) {}

    /**
     * GET /v1/acquisition/payment-plan-appointments
     * Company queue of payment-plan meetings.
     */
    public function index(Request $request): JsonResponse
    {
        $appointments = Appointment::paymentPlan()
            ->with(['assignedRep:id,name,phone', 'unit:id,unit_number,project_id', 'lead:id,first_name,last_name,phone', 'user:id,name,phone'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('assigned_rep_id'), fn ($q) => $q->where('assigned_rep_id', $request->input('assigned_rep_id')))
            ->when($request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->input('unit_id')))
            ->orderByRaw('scheduled_at IS NULL DESC') // unassigned/unscheduled first
            ->orderBy('scheduled_at')
            ->paginate($request->input('per_page', 25));

        return response()->json(['success' => true, 'data' => $appointments]);
    }

    /**
     * POST /v1/acquisition/payment-plan-appointments
     * Schedule the meeting: assign a rep + date/time after unit selection.
     */
    public function store(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'appointment_id'     => 'nullable|uuid|exists:appointments,id',
            'lead_id'            => 'nullable|uuid|exists:leads,id',
            'user_id'            => 'nullable|uuid|exists:users,id',
            'project_id'         => 'nullable|uuid',
            'unit_id'            => 'nullable|uuid',
            'reservation_id'     => 'nullable|uuid',
            'eoi_reservation_id' => 'nullable|uuid',
            'rep_id'             => 'required|uuid|exists:users,id',
            'booking_date'       => 'required|date|after_or_equal:today',
            'booking_time'       => 'required|string',
            'booking_type'       => 'nullable|string|in:online,in_company',
            'location'           => 'nullable|string|max:255',
            'notes'              => 'nullable|string|max:2000',
        ]);

        if (empty($fields['appointment_id']) && empty($fields['unit_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Provide either an existing appointment_id or the selected unit_id.',
            ], 422);
        }

        $appointment = $this->service->schedule($fields);

        return response()->json([
            'success' => true,
            'message' => 'Payment-plan meeting scheduled. The client has been notified of the rep and time.',
            'data'    => $appointment,
        ], 201);
    }

    /**
     * PUT /v1/acquisition/payment-plan-appointments/{id}/assign-rep
     * Assign or change the developer rep (re-snapshots name/phone/title).
     */
    public function assignRep(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate(['rep_id' => 'required|uuid|exists:users,id']);

        $appointment = Appointment::findOrFail($id);
        $appointment = $this->service->assignRep($appointment, $fields['rep_id']);

        return response()->json([
            'success' => true,
            'message' => 'Representative assigned.',
            'data'    => $appointment->load('assignedRep:id,name,phone'),
        ]);
    }

    /**
     * GET /v1/acquisition/payment-plan-appointments/{id}
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::paymentPlan()
            ->with(['assignedRep:id,name,phone', 'unit', 'project:id,name', 'lead', 'user:id,name,phone'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $appointment]);
    }

    /**
     * GET /v1/acquisition/payment-plan-appointments/mine
     * Client-facing: the authenticated customer's payment-plan meeting(s),
     * including who they will meet (name / phone / title).
     */
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();

        $appointments = Appointment::paymentPlan()
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if ($user->email) {
                    $q->orWhereHas('lead', fn ($l) => $l->where('email', $user->email)->orWhere('phone', $user->phone));
                }
            })
            ->with(['assignedRep:id,name,phone', 'unit:id,unit_number,project_id', 'project:id,name'])
            ->orderByDesc('scheduled_at')
            ->get()
            ->map(fn ($a) => [
                'id'           => $a->id,
                'status'       => $a->status,
                'scheduled_at' => $a->scheduled_at,
                'booking_type' => $a->booking_type,
                'location'     => $a->location,
                'unit'         => $a->unit,
                'project'      => $a->project,
                'meeting_with' => [
                    'name'  => $a->rep_name,
                    'phone' => $a->rep_phone,
                    'title' => $a->rep_title,
                ],
            ]);

        return response()->json(['success' => true, 'data' => $appointments]);
    }

    /**
     * GET /v1/acquisition/payment-plan-appointments/reps
     * Developer reps that can be assigned (for the assignment dropdown).
     */
    public function availableReps(): JsonResponse
    {
        $reps = User::with('position:id,title')
            ->whereIn('role', ['company_sales', 'sales_agent', 'finance_officer'])
            ->where('status', 'active')
            ->get(['id', 'name', 'phone', 'role', 'position_id'])
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'phone' => $u->phone,
                'title' => $u->position?->title ?? ucwords(str_replace('_', ' ', $u->role)),
            ]);

        return response()->json(['success' => true, 'data' => $reps]);
    }
}
