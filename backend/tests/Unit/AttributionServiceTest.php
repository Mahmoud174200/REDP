<?php

namespace Tests\Unit;

use App\Models\Broker;
use App\Models\CustomerEvent;
use App\Models\CustomerSession;
use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Services\Acquisition\AttributionService;
use Database\Seeders\LeadSourceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Lead Attribution System — touch recording, event idempotency,
 * context resolution and anonymous-history binding.
 */
class AttributionServiceTest extends TestCase
{
    use RefreshDatabase;

    private AttributionService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(LeadSourceSeeder::class);
        $this->svc = app(AttributionService::class);
    }

    private function broker(): Broker
    {
        return Broker::create([
            'agency_name'   => 'Agency',
            'agent_name'    => 'Agent',
            'phone'         => '0100' . rand(1000000, 9999999),
            'status'        => Broker::STATUS_ACTIVE,
            'referral_code' => strtoupper(Str::random(8)),
        ]);
    }

    private function lead(): Lead
    {
        return Lead::create([
            'first_name' => 'Test', 'last_name' => 'Lead',
            'phone' => '0111' . rand(1000000, 9999999), 'status' => Lead::STATUS_NEW,
        ]);
    }

    private function ctx(?Broker $broker, string $sourceKey): array
    {
        return ['source_key' => $sourceKey, 'broker' => $broker, 'campaign' => null, 'promo_code' => null, 'utm' => []];
    }

    /** @test */
    public function records_first_and_last_touches_and_demotes_previous_last(): void
    {
        $lead = $this->lead();
        $broker = $this->broker();

        $t1 = $this->svc->recordTouch($lead, $this->ctx($broker, 'broker_referral'));
        $t2 = $this->svc->recordTouch($lead, $this->ctx(null, 'google_ads'));
        $t3 = $this->svc->recordTouch($lead, $this->ctx(null, 'facebook_ads'));

        $this->assertSame(LeadAttribution::TOUCH_FIRST, $t1->fresh()->touch_type);
        $this->assertSame(LeadAttribution::TOUCH_INTERMEDIATE, $t2->fresh()->touch_type);
        $this->assertSame(LeadAttribution::TOUCH_LAST, $t3->fresh()->touch_type);

        $lead->refresh();
        $this->assertNotNull($lead->first_touch_at);
        $this->assertNotNull($lead->last_touch_at);
        $this->assertNotNull($lead->original_source_id, 'first-touch source should be denormalized onto the lead');
        $this->assertNotNull($lead->current_source_id);
    }

    /** @test */
    public function record_event_is_idempotent_on_event_id(): void
    {
        $lead = $this->lead();

        $e1 = $this->svc->recordEvent(CustomerEvent::LEAD, $lead, null, null, [], 'evt-123');
        $e2 = $this->svc->recordEvent(CustomerEvent::LEAD, $lead, null, null, [], 'evt-123');

        $this->assertSame($e1->id, $e2->id);
        $this->assertSame(1, CustomerEvent::where('event_id', 'evt-123')->count());
    }

    /** @test */
    public function resolves_active_broker_from_ref(): void
    {
        $broker = $this->broker();
        $request = Request::create('/api/v1/track/resolve', 'GET', ['ref' => $broker->referral_code]);

        $context = $this->svc->resolveContext($request);

        $this->assertSame($broker->id, $context['broker']?->id);
        $this->assertSame('broker_referral', $context['source_key']);
        $this->assertFalse($context['suspicious']);
    }

    /** @test */
    public function flags_unknown_referral_as_suspicious_and_degrades_to_no_broker(): void
    {
        $request = Request::create('/api/v1/track/resolve', 'GET', ['ref' => 'NONEXIST']);

        $context = $this->svc->resolveContext($request);

        $this->assertNull($context['broker']);
        $this->assertTrue($context['suspicious']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'SUSPICIOUS_REFERRAL']);
    }

    /** @test */
    public function binds_anonymous_sessions_and_events_to_a_lead(): void
    {
        $lead = $this->lead();
        $anon = 'anon-' . Str::random(8);

        $session = CustomerSession::create([
            'anon_id' => $anon, 'session_token' => (string) Str::uuid(), 'started_at' => now(), 'last_seen_at' => now(),
        ]);
        $event = CustomerEvent::create([
            'anon_id' => $anon, 'event_type' => CustomerEvent::PAGE_VIEW, 'occurred_at' => now(),
        ]);

        $this->svc->bindAnonToLead($lead, $anon);

        $this->assertSame($lead->id, $session->fresh()->lead_id);
        $this->assertSame($lead->id, $event->fresh()->lead_id);
        $this->assertSame($anon, $lead->fresh()->anon_id);
    }
}
