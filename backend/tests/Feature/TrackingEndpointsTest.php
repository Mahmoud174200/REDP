<?php

namespace Tests\Feature;

use App\Models\Broker;
use App\Models\CustomerEvent;
use Database\Seeders\LeadSourceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Lead Attribution System — public tracking surface (no auth).
 */
class TrackingEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LeadSourceSeeder::class);
    }

    private function broker(array $o = []): Broker
    {
        return Broker::create(array_merge([
            'agency_name'   => 'Elite Realty',
            'agent_name'    => 'Agent',
            'phone'         => '0100' . rand(1000000, 9999999),
            'status'        => Broker::STATUS_ACTIVE,
            'referral_code' => strtoupper(Str::random(8)),
        ], $o));
    }

    /** @test */
    public function resolve_returns_attribution_for_a_valid_referral(): void
    {
        $broker = $this->broker();

        $res = $this->getJson('/api/v1/track/resolve?ref=' . $broker->referral_code);

        $res->assertOk()
            ->assertJsonPath('data.source_key', 'broker_referral')
            ->assertJsonPath('data.broker_id', $broker->id)
            ->assertJsonPath('data.suspicious', false);

        $this->assertDatabaseHas('customer_sessions', ['broker_id' => $broker->id, 'source_key' => 'broker_referral']);
    }

    /** @test */
    public function event_endpoint_records_a_funnel_event(): void
    {
        $res = $this->postJson('/api/v1/track/event', [
            'event_type' => 'page_view',
            'anon_id'    => 'anon-' . Str::random(6),
            'properties' => ['path' => '/projects/nile-towers'],
        ]);

        $res->assertCreated()->assertJsonPath('success', true);
        $this->assertSame(1, CustomerEvent::where('event_type', 'page_view')->count());
    }

    /** @test */
    public function short_link_redirects_for_an_active_broker(): void
    {
        $broker = $this->broker(['slug' => 'elite-realty']);

        $res = $this->get('/api/r/elite-realty');

        $res->assertStatus(302);
        $this->assertStringContainsString('ref=' . $broker->referral_code, $res->headers->get('Location'));
        $this->assertSame(1, $broker->fresh()->referral_clicks);
    }
}
