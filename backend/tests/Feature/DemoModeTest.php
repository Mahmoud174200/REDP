<?php

namespace Tests\Feature;

use App\Models\Broker;
use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Demo Mode — admin toggle exposure + public walkthrough script.
 */
class DemoModeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function demo_mode_is_off_by_default(): void
    {
        $this->getJson('/api/v1/demo/status')
            ->assertOk()
            ->assertJsonPath('data.demo_mode', false);

        $this->getJson('/api/system-info')
            ->assertOk()
            ->assertJsonPath('data.demo_mode', false);
    }

    /** @test */
    public function enabling_demo_mode_is_reflected_publicly(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);

        $this->getJson('/api/v1/demo/status')->assertOk()->assertJsonPath('data.demo_mode', true);
        $this->getJson('/api/system-info')->assertOk()->assertJsonPath('data.demo_mode', true);
    }

    /** @test */
    public function tour_returns_the_full_ordered_bilingual_script(): void
    {
        $res = $this->getJson('/api/v1/demo/tour')->assertOk();

        $steps = $res->json('data.steps');
        $this->assertCount(15, $steps);

        // ordered ids 1..15
        $this->assertSame(range(1, 15), array_column($steps, 'id'));

        // each step is presentable + bilingual
        foreach ($steps as $s) {
            $this->assertArrayHasKey('narration_ar', $s);
            $this->assertArrayHasKey('title', $s);
            $this->assertContains($s['mode'], ['scroll', 'navigate']);
        }
    }

    /** @test */
    public function demo_login_is_blocked_when_demo_mode_is_off(): void
    {
        $this->postJson('/api/v1/demo/login', ['role' => 'broker'])->assertStatus(403);
    }

    /** @test */
    public function demo_login_issues_a_token_for_a_demo_role_when_on(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);

        $res = $this->postJson('/api/v1/demo/login', ['role' => 'broker'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'broker');

        $this->assertNotEmpty($res->json('token'));
        $this->assertDatabaseHas('users', ['email' => 'demo.broker@redp.test', 'role' => 'broker']);
        // demo broker gets a real referral profile so the dashboard is meaningful
        $brokerUser = User::where('email', 'demo.broker@redp.test')->first();
        $this->assertTrue(Broker::where('user_id', $brokerUser->id)->exists());
    }

    /** @test */
    public function demo_login_rejects_unknown_roles(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);
        $this->postJson('/api/v1/demo/login', ['role' => 'super_hacker'])->assertStatus(422);
    }

    /** @test */
    public function seed_eoi_creates_a_real_pending_reservation_when_demo_on(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);

        $res = $this->postJson('/api/v1/demo/seed-eoi')->assertOk()->assertJsonPath('success', true);

        $eoiId = $res->json('data.id');
        $this->assertNotEmpty($eoiId);
        $this->assertDatabaseHas('eoi_reservations', ['id' => $eoiId, 'status' => 'pending_review']);
        $this->assertDatabaseHas('leads', ['phone' => '01001234567']);

        // re-running resets: always exactly one fresh pending EOI for the demo customer
        $this->postJson('/api/v1/demo/seed-eoi')->assertOk();
        $lead = \App\Models\Lead::where('phone', '01001234567')->first();
        $this->assertSame(1, \App\Models\EoiReservation::where('lead_id', $lead->id)->where('status', 'pending_review')->count());
    }

    /** @test */
    public function finance_can_approve_the_demo_eoi_live(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);

        $this->postJson('/api/v1/demo/seed-eoi')->assertOk();
        $res = $this->postJson('/api/v1/demo/approve-eoi')->assertOk()->assertJsonPath('success', true);

        $this->assertSame('approved', $res->json('data.status'));
        $this->assertNotEmpty($res->json('data.order_number'));
    }

    /** @test */
    public function prioritize_client_creates_a_loginable_account(): void
    {
        SystemConfig::create(['key' => 'demo_mode', 'value' => 'true']);

        $this->postJson('/api/v1/demo/prioritize-client')->assertOk();
        $this->assertDatabaseHas('users', ['email' => 'ahmed.demo@example.com', 'role' => 'client']);
    }

    /** @test */
    public function seed_eoi_is_blocked_when_demo_off(): void
    {
        $this->postJson('/api/v1/demo/seed-eoi')->assertStatus(403);
    }
}
