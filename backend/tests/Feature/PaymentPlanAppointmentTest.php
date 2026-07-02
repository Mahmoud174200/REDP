<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Position;
use App\Models\User;
use App\Services\Acquisition\PaymentPlanAppointmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Payment-Plan Appointment — book the developer-office meeting after
 * unit selection and surface WHO the client will meet (name/phone/title).
 */
class PaymentPlanAppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, ?string $positionId = null): User
    {
        return User::create([
            'id'          => (string) Str::uuid(),
            'name'        => ucfirst($role) . ' ' . Str::random(4),
            'email'       => $role . Str::random(6) . '@example.com',
            'password'    => bcrypt('secret'),
            'phone'       => '0100' . rand(1000000, 9999999),
            'role'        => $role,
            'status'      => 'active',
            'position_id' => $positionId,
        ]);
    }

    private function position(string $title): Position
    {
        $companyId = (string) Str::uuid();
        Company::create(['id' => $companyId, 'name' => 'Dev Co ' . Str::random(4)]);

        return Position::create([
            'id'         => (string) Str::uuid(),
            'title'      => $title,
            'code'       => 'P' . strtoupper(Str::random(6)),
            'company_id' => $companyId,
            'status'     => 'active',
        ]);
    }

    private function lead(): Lead
    {
        return Lead::create([
            'first_name' => 'Test', 'last_name' => 'Client',
            'phone' => '0111' . rand(1000000, 9999999), 'status' => Lead::STATUS_NEW,
        ]);
    }

    /** @test */
    public function scheduling_snapshots_the_rep_name_phone_and_title(): void
    {
        $position = $this->position('Senior Payment Plan Consultant');
        $rep = $this->user('company_sales', $position->id);
        $lead = $this->lead();

        $appointment = app(PaymentPlanAppointmentService::class)->schedule([
            'lead_id'      => $lead->id,
            'unit_id'      => (string) Str::uuid(),
            'rep_id'       => $rep->id,
            'booking_date' => now()->addDays(2)->toDateString(),
            'booking_time' => '14:30',
            'location'     => 'Developer HQ, 5th Settlement',
        ]);

        $this->assertSame(Appointment::TYPE_PAYMENT_PLAN, $appointment->type);
        $this->assertSame(Appointment::STATUS_CONFIRMED, $appointment->status);
        $this->assertSame($rep->id, $appointment->assigned_rep_id);
        $this->assertSame($rep->name, $appointment->rep_name);
        $this->assertSame($rep->phone, $appointment->rep_phone);
        $this->assertSame('Senior Payment Plan Consultant', $appointment->rep_title);
    }

    /** @test */
    public function title_falls_back_to_role_label_when_no_position(): void
    {
        $rep = $this->user('company_sales');
        $appt = app(PaymentPlanAppointmentService::class)->schedule([
            'lead_id' => $this->lead()->id,
            'unit_id' => (string) Str::uuid(),
            'rep_id'  => $rep->id,
            'booking_date' => now()->addDay()->toDateString(),
            'booking_time' => '10:00',
        ]);

        $this->assertSame('Company Sales Consultant', $appt->rep_title);
    }

    /** @test */
    public function client_can_see_who_they_will_meet(): void
    {
        $position = $this->position('Sales Director');
        $rep = $this->user('company_sales', $position->id);
        $client = $this->user('client');

        app(PaymentPlanAppointmentService::class)->schedule([
            'user_id' => $client->id,
            'unit_id' => (string) Str::uuid(),
            'rep_id'  => $rep->id,
            'booking_date' => now()->addDays(3)->toDateString(),
            'booking_time' => '12:00',
        ]);

        $res = $this->actingAs($client, 'sanctum')
            ->getJson('/api/v1/acquisition/payment-plan-appointments/mine');

        $res->assertOk()
            ->assertJsonPath('data.0.meeting_with.name', $rep->name)
            ->assertJsonPath('data.0.meeting_with.phone', $rep->phone)
            ->assertJsonPath('data.0.meeting_with.title', 'Sales Director');
    }

    /** @test */
    public function pending_appointment_is_created_once_per_unit_reservation(): void
    {
        $svc = app(PaymentPlanAppointmentService::class);
        $lead = $this->lead();
        $ctx = ['lead_id' => $lead->id, 'unit_id' => (string) Str::uuid()];

        $a = $svc->createPendingForReservation($ctx);
        $b = $svc->createPendingForReservation($ctx);

        $this->assertSame($a->id, $b->id, 'Must be idempotent per (lead, unit).');
        $this->assertSame(Appointment::STATUS_PENDING, $a->status);
        $this->assertSame(1, Appointment::paymentPlan()->where('unit_id', $ctx['unit_id'])->count());
    }
}
