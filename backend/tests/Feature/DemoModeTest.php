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

        // idempotent — calling again reuses the same pending EOI
        $res2 = $this->postJson('/api/v1/demo/seed-eoi')->assertOk();
        $this->assertSame($eoiId, $res2->json('data.id'));
    }

    /** @test */
    public function seed_eoi_is_blocked_when_demo_off(): void
    {
        $this->postJson('/api/v1/demo/seed-eoi')->assertStatus(403);
    }
}
