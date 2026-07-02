<?php

namespace Tests\Feature;

use App\Models\BookingPriority;
use App\Models\EoiReservation;
use App\Models\Lead;
use App\Models\User;
use App\Services\Acquisition\BookingPriorityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Booking Priority Board (Head of Sales) — AI scoring, role-gated access,
 * giant filtering and manual override.
 */
class BookingPriorityTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create([
            'id' => (string) Str::uuid(), 'name' => ucfirst($role),
            'email' => $role . Str::random(6) . '@example.com', 'password' => bcrypt('x'),
            'role' => $role, 'status' => 'active',
        ]);
    }

    private function eoi(array $o = [], bool $vip = false): EoiReservation
    {
        $lead = Lead::create([
            'first_name' => 'C', 'last_name' => 'L',
            'phone' => '0111' . rand(1000000, 9999999), 'status' => Lead::STATUS_NEW, 'is_vip' => $vip,
        ]);

        return EoiReservation::create(array_merge([
            'id'              => (string) Str::uuid(),
            'lead_id'         => $lead->id,
            'project_id'      => (string) Str::uuid(),
            'client_name'     => 'Client ' . Str::random(4),
            'client_email'    => Str::random(6) . '@e.com',
            'client_phone'    => $lead->phone,
            'client_location' => EoiReservation::LOCATION_INSIDE_EGYPT,
            'payment_method'  => EoiReservation::PAYMENT_CASH,
            'payment_amount'  => 50000,
            'receipt_path'    => 'receipts/r.jpg',
            'status'          => EoiReservation::STATUS_APPROVED,
        ], $o));
    }

    /** @test */
    public function cash_vip_high_income_scores_higher_than_a_basic_applicant(): void
    {
        $svc = app(BookingPriorityService::class);

        $strong = $this->eoi([
            'payment_method' => EoiReservation::PAYMENT_CASH,
            'monthly_income' => 150000, 'payment_amount' => 120000,
            'education' => 'PhD', 'job_title' => 'CEO', 'marital_status' => 'married',
            'residence_type' => 'owned', 'cars_owned' => 2, 'club_memberships' => '["Gezira"]',
        ], vip: true);

        $weak = $this->eoi([
            'payment_method' => EoiReservation::PAYMENT_BANK_TRANSFER,
            'monthly_income' => 8000, 'payment_amount' => 20000,
        ]);

        $strongScore = $svc->score($strong->fresh('lead'))['score'];
        $weakScore   = $svc->score($weak->fresh('lead'))['score'];

        $this->assertGreaterThan($weakScore, $strongScore);
        $reasons = collect($svc->score($strong->fresh('lead'))['reasons'])->pluck('factor');
        $this->assertContains('vip', $reasons);
        $this->assertContains('payment_method', $reasons);
        $this->assertContains('monthly_income', $reasons);
    }

    /** @test */
    public function recompute_persists_ai_scores(): void
    {
        $a = $this->eoi(['monthly_income' => 90000]);
        $b = $this->eoi(['monthly_income' => 12000]);

        $count = app(BookingPriorityService::class)->recompute(EoiReservation::with('lead')->get());

        $this->assertSame(2, $count);
        $this->assertDatabaseHas('booking_priorities', ['eoi_reservation_id' => $a->id]);
        $this->assertNotNull(BookingPriority::where('eoi_reservation_id', $b->id)->value('computed_at'));
    }

    /** @test */
    public function head_of_sales_can_list_but_other_roles_cannot(): void
    {
        $this->eoi();

        $hos = $this->user('head_of_sales');
        $this->actingAs($hos, 'sanctum')
            ->getJson('/api/v1/acquisition/booking-priorities')
            ->assertOk()
            ->assertJsonPath('success', true);

        $agent = $this->user('sales_agent');
        $this->actingAs($agent, 'sanctum')
            ->getJson('/api/v1/acquisition/booking-priorities')
            ->assertStatus(403);
    }

    /** @test */
    public function giant_filter_narrows_by_payment_method_and_income(): void
    {
        $this->eoi(['payment_method' => EoiReservation::PAYMENT_CASH, 'monthly_income' => 100000]);
        $this->eoi(['payment_method' => EoiReservation::PAYMENT_BANK_TRANSFER, 'monthly_income' => 5000]);

        $hos = $this->user('head_of_sales');
        $res = $this->actingAs($hos, 'sanctum')
            ->getJson('/api/v1/acquisition/booking-priorities?payment_method=cash&min_income=50000');

        $res->assertOk();
        $this->assertSame(1, $res->json('data.total'));
    }

    /** @test */
    public function head_of_sales_defined_criteria_change_the_ai_score(): void
    {
        $svc = app(BookingPriorityService::class);
        $cashLead = $this->eoi(['payment_method' => EoiReservation::PAYMENT_CASH, 'monthly_income' => 0]);

        // default cash weight = 25
        $defaultScore = $svc->score($cashLead->fresh('lead'))['score'];

        // Head of Sales raises the cash weight to 90
        $svc->saveWeights(array_merge(\App\Services\Acquisition\BookingPriorityService::DEFAULT_WEIGHTS, ['cash' => 90, 'ai_blend' => 0]));
        $boostedScore = app(BookingPriorityService::class)->score($cashLead->fresh('lead'))['score'];

        $this->assertGreaterThan($defaultScore, $boostedScore);
    }

    /** @test */
    public function custom_rule_adds_points_when_it_matches(): void
    {
        $svc = app(BookingPriorityService::class);
        $rich = $this->eoi(['monthly_income' => 250000, 'payment_method' => EoiReservation::PAYMENT_BANK_TRANSFER]);

        $svc->saveWeights(array_merge(
            \App\Services\Acquisition\BookingPriorityService::DEFAULT_WEIGHTS,
            ['ai_blend' => 0, 'custom_rules' => [
                ['field' => 'monthly_income', 'operator' => '>', 'value' => 200000, 'weight' => 40, 'label' => 'High earner'],
            ]]
        ));

        $result = app(BookingPriorityService::class)->score($rich->fresh('lead'));
        $factors = collect($result['reasons'])->pluck('factor');
        $this->assertContains('custom', $factors);
    }

    /** @test */
    public function head_of_sales_can_read_and_save_criteria_via_api(): void
    {
        $hos = $this->user('head_of_sales');

        $this->actingAs($hos, 'sanctum')
            ->getJson('/api/v1/acquisition/booking-priorities/criteria')
            ->assertOk()
            ->assertJsonPath('data.weights.cash', 25);

        $res = $this->actingAs($hos, 'sanctum')
            ->putJson('/api/v1/acquisition/booking-priorities/criteria', ['cash' => 80, 'ai_blend' => 0])
            ->assertOk();
        $this->assertEquals(80, $res->json('data.cash'));
    }

    /** @test */
    public function head_of_sales_can_manually_override_and_reorder(): void
    {
        $a = $this->eoi();
        $b = $this->eoi();
        $hos = $this->user('head_of_sales');

        // manual decision + note
        $this->actingAs($hos, 'sanctum')
            ->putJson("/api/v1/acquisition/booking-priorities/{$a->id}", [
                'decision' => 'shortlisted', 'note' => 'Strong cash buyer',
            ])->assertOk();

        $this->assertDatabaseHas('booking_priorities', [
            'eoi_reservation_id' => $a->id, 'decision' => 'shortlisted', 'set_by' => $hos->id,
        ]);

        // full reorder: b first, a second
        $this->actingAs($hos, 'sanctum')
            ->postJson('/api/v1/acquisition/booking-priorities/reorder', [
                'ordered_ids' => [$b->id, $a->id],
            ])->assertOk();

        $this->assertSame(1, BookingPriority::where('eoi_reservation_id', $b->id)->value('manual_rank'));
        $this->assertSame(2, BookingPriority::where('eoi_reservation_id', $a->id)->value('manual_rank'));
    }
}
