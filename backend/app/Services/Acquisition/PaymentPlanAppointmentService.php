<?php

namespace App\Services\Acquisition;

use App\Models\Appointment;
use App\Models\Lead;
use App\Models\User;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Payment-Plan Appointment Service
 *
 * After a customer selects a unit, a meeting is booked at the
 * developer's office to set up the payment plan. The client is
 * told WHO they will meet — the rep's name, phone and title are
 * snapshotted onto the appointment for stable display.
 * ─────────────────────────────────────────────────────────
 */
class PaymentPlanAppointmentService
{
    /**
     * Auto-create a pending payment-plan appointment the moment a unit
     * is reserved. Rep + date/time are assigned later by the company.
     * Idempotent per (lead, unit).
     */
    public function createPendingForReservation(array $ctx): Appointment
    {
        $existing = Appointment::paymentPlan()
            ->where('unit_id', $ctx['unit_id'] ?? null)
            ->when(!empty($ctx['lead_id']), fn ($q) => $q->where('lead_id', $ctx['lead_id']))
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->first();

        if ($existing) {
            return $existing;
        }

        return Appointment::create([
            'id'                 => (string) Str::uuid(),
            'lead_id'            => $ctx['lead_id'] ?? null,
            'user_id'            => $ctx['user_id'] ?? null,
            'project_id'         => $ctx['project_id'] ?? null,
            'unit_id'            => $ctx['unit_id'] ?? null,
            'reservation_id'     => $ctx['reservation_id'] ?? null,
            'eoi_reservation_id' => $ctx['eoi_reservation_id'] ?? null,
            'type'               => Appointment::TYPE_PAYMENT_PLAN,
            'booking_type'       => 'in_company',
            'status'             => Appointment::STATUS_PENDING,
            'remind_email'       => true,
        ]);
    }

    /**
     * Assign (or change) the developer representative and snapshot their
     * name / phone / title for stable client-facing display.
     */
    public function assignRep(Appointment $appointment, string $repId): Appointment
    {
        $rep = User::with('position')->findOrFail($repId);

        $appointment->update([
            'assigned_rep_id' => $rep->id,
            'rep_name'        => $rep->name,
            'rep_phone'       => $rep->phone,
            'rep_title'       => $this->titleFor($rep),
        ]);

        AuditLogService::log('PAYMENT_PLAN_REP_ASSIGNED', auth()->id(), [
            'appointment_id' => $appointment->id,
            'rep_id'         => $rep->id,
            'rep_title'      => $appointment->rep_title,
        ]);

        return $appointment->fresh();
    }

    /**
     * Fully schedule the payment-plan meeting: assign rep, set date/time,
     * confirm, advance the lead and notify the client.
     *
     * @param array $data  unit/reservation context + rep_id + booking_date/time
     */
    public function schedule(array $data): Appointment
    {
        $appointment = !empty($data['appointment_id'])
            ? Appointment::findOrFail($data['appointment_id'])
            : $this->createPendingForReservation($data);

        if (!empty($data['rep_id'])) {
            $appointment = $this->assignRep($appointment, $data['rep_id']);
        }

        $scheduledAt = null;
        if (!empty($data['booking_date']) && !empty($data['booking_time'])) {
            $scheduledAt = Carbon::parse($data['booking_date'] . ' ' . $data['booking_time']);
        }

        $appointment->update([
            'booking_date' => $data['booking_date'] ?? $appointment->booking_date,
            'booking_time' => $data['booking_time'] ?? $appointment->booking_time,
            'booking_type' => $data['booking_type'] ?? 'in_company',
            'scheduled_at' => $scheduledAt ?? $appointment->scheduled_at,
            'location'     => $data['location'] ?? $appointment->location,
            'notes'        => $data['notes'] ?? $appointment->notes,
            'status'       => Appointment::STATUS_CONFIRMED,
            // a (re)scheduled meeting must re-trigger reminders
            'email_sent'   => false,
            'sms_sent'     => false,
            'whatsapp_sent'=> false,
        ]);

        $this->advanceLead($appointment);
        $this->notifyClient($appointment);

        AuditLogService::log('PAYMENT_PLAN_APPOINTMENT_SCHEDULED', auth()->id(), [
            'appointment_id' => $appointment->id,
            'unit_id'        => $appointment->unit_id,
            'rep_id'         => $appointment->assigned_rep_id,
            'scheduled_at'   => optional($appointment->scheduled_at)->toDateTimeString(),
        ]);

        return $appointment->fresh(['assignedRep', 'unit', 'lead', 'user']);
    }

    // ───────────────────────── helpers ─────────────────────────

    private function titleFor(User $rep): string
    {
        if ($rep->position && $rep->position->title) {
            return $rep->position->title;
        }

        return match ($rep->role) {
            'company_sales' => 'Company Sales Consultant',
            'sales_agent'   => 'Sales Consultant',
            'finance_officer' => 'Finance Officer',
            default         => 'Developer Representative',
        };
    }

    private function advanceLead(Appointment $appointment): void
    {
        if (!$appointment->lead_id) {
            return;
        }
        $lead = Lead::find($appointment->lead_id);
        if ($lead && $lead->status === Lead::STATUS_NEW) {
            $lead->update(['status' => Lead::STATUS_VISIT_SCHEDULED]);
        }
    }

    private function notifyClient(Appointment $appointment): void
    {
        $phone = $appointment->user?->phone
            ?? $appointment->lead?->phone
            ?? optional(\App\Models\Lead::find($appointment->lead_id))->phone;

        if (!$phone) {
            return;
        }

        $when = $appointment->scheduled_at
            ? $appointment->scheduled_at->format('D, d M Y - H:i')
            : 'a time to be confirmed';
        $rep = $appointment->rep_name
            ? "{$appointment->rep_name} ({$appointment->rep_title}), tel: {$appointment->rep_phone}"
            : 'our representative';

        try {
            \App\Services\NotificationService::send(
                $appointment->lead_id,
                'whatsapp',
                $phone,
                'Payment Plan Meeting Scheduled',
                "Your payment-plan meeting is set for {$when} at the developer office. "
                . "You will be meeting {$rep}."
            );
        } catch (\Throwable $e) {
            Log::warning('[PaymentPlanAppointment] client notification failed: ' . $e->getMessage());
        }
    }
}
