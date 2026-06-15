<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    /**
     * GET /api/v1/acquisition/appointments
     * List all appointments with their associated leads and client users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['lead', 'user']);

        if ($request->has('lead_id')) {
            $query->where('lead_id', $request->input('lead_id'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $appointments = $query->orderBy('booking_date', 'asc')
                              ->orderBy('booking_time', 'asc')
                              ->get();

        return response()->json([
            'success' => true,
            'data'    => $appointments,
        ]);
    }

    /**
     * POST /api/v1/acquisition/appointments
     * Create/schedule a new appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id'          => 'nullable|uuid|exists:leads,id',
            'user_id'          => 'nullable|uuid|exists:users,id',
            'booking_date'     => 'required|date|after_or_equal:today',
            'booking_time'     => 'required|string', // HH:MM
            'booking_type'     => 'required|string|in:online,in_company',
            'type'             => 'nullable|string', // e.g. 'Consultation', 'Site Visit'
            'remind_email'     => 'boolean',
            'remind_sms'       => 'boolean',
            'remind_whatsapp'  => 'boolean',
        ]);

        // Validate that either lead_id or user_id is provided
        if (empty($fields['lead_id']) && empty($fields['user_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Either lead_id or user_id must be provided to schedule an appointment.',
            ], 422);
        }

        // Combine date and time to create scheduled_at timestamp
        try {
            $scheduledAt = Carbon::parse($fields['booking_date'] . ' ' . $fields['booking_time']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid date or time format.',
            ], 422);
        }

        $appointment = Appointment::create([
            'id'              => (string) Str::uuid(),
            'lead_id'         => $fields['lead_id'] ?? null,
            'user_id'         => $fields['user_id'] ?? null,
            'booking_date'    => $fields['booking_date'],
            'booking_time'    => $fields['booking_time'],
            'booking_type'    => $fields['booking_type'],
            'type'            => $fields['type'] ?? 'Consultation',
            'scheduled_at'    => $scheduledAt,
            'status'          => 'pending',
            'remind_email'    => $fields['remind_email'] ?? true,
            'remind_sms'      => $fields['remind_sms'] ?? false,
            'remind_whatsapp' => $fields['remind_whatsapp'] ?? false,
            'email_sent'      => false,
            'sms_sent'        => false,
            'whatsapp_sent'   => false,
        ]);

        // If this is scheduled for a Lead, log an interaction and record journey
        if ($appointment->lead_id) {
            $lead = Lead::find($appointment->lead_id);
            if ($lead) {
                // Update stage to visit_scheduled
                $lead->update(['status' => Lead::STATUS_VISIT_SCHEDULED]);

                $lead->interactions()->create([
                    'id'             => (string) Str::uuid(),
                    'type'           => 'meeting',
                    'notes'          => "Appointment scheduled as " . strtoupper($fields['booking_type']) . " (Type: " . ($fields['type'] ?? 'Consultation') . "). Reminders: Email: " . ($appointment->remind_email ? 'YES' : 'NO') . ", SMS: " . ($appointment->remind_sms ? 'YES' : 'NO') . ", WA: " . ($appointment->remind_whatsapp ? 'YES' : 'NO') . ".",
                    'follow_up_date' => $scheduledAt,
                    'logged_by'      => $request->user()?->id ?? null,
                ]);

                \App\Services\AuditLogService::recordJourney(
                    $lead->id,
                    ClientJourneyLog::STAGE_MEETING_SCHEDULED,
                    $request->user(),
                    [
                        'meeting_date' => $scheduledAt->toDateTimeString(),
                        'location'     => $fields['booking_type'] === 'in_company' ? 'Company Office' : 'Online',
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment scheduled successfully.',
            'data'    => $appointment->load(['lead', 'user']),
        ], 201);
    }

    /**
     * PUT /api/v1/acquisition/appointments/{id}
     * Update an appointment.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $fields = $request->validate([
            'booking_date'     => 'required|date|after_or_equal:today',
            'booking_time'     => 'required|string',
            'booking_type'     => 'required|string|in:online,in_company',
            'type'             => 'nullable|string',
            'status'           => 'required|string|in:pending,confirmed,cancelled',
            'remind_email'     => 'boolean',
            'remind_sms'       => 'boolean',
            'remind_whatsapp'  => 'boolean',
        ]);

        try {
            $scheduledAt = Carbon::parse($fields['booking_date'] . ' ' . $fields['booking_time']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid date or time format.',
            ], 422);
        }

        // Reset sent flags if the time is changed, so reminders get re-evaluated if needed
        $timeChanged = $appointment->scheduled_at && !$appointment->scheduled_at->equalTo($scheduledAt);

        $appointment->update([
            'booking_date'    => $fields['booking_date'],
            'booking_time'    => $fields['booking_time'],
            'booking_type'    => $fields['booking_type'],
            'type'            => $fields['type'] ?? $appointment->type,
            'scheduled_at'    => $scheduledAt,
            'status'          => $fields['status'],
            'remind_email'    => $fields['remind_email'] ?? $appointment->remind_email,
            'remind_sms'      => $fields['remind_sms'] ?? $appointment->remind_sms,
            'remind_whatsapp' => $fields['remind_whatsapp'] ?? $appointment->remind_whatsapp,
            'email_sent'      => $timeChanged ? false : $appointment->email_sent,
            'sms_sent'        => $timeChanged ? false : $appointment->sms_sent,
            'whatsapp_sent'   => $timeChanged ? false : $appointment->whatsapp_sent,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment updated successfully.',
            'data'    => $appointment->load(['lead', 'user']),
        ]);
    }

    /**
     * DELETE /api/v1/acquisition/appointments/{id}
     * Cancel/delete an appointment.
     */
    public function destroy(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled/deleted successfully.',
        ]);
    }
}
