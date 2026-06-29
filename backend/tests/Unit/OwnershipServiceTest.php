<?php

namespace Tests\Unit;

use App\Models\Broker;
use App\Models\Lead;
use App\Models\User;
use App\Services\Acquisition\OwnershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Lead Attribution System — ownership state machine guarantees.
 */
class OwnershipServiceTest extends TestCase
{
    use RefreshDatabase;

    private OwnershipService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = app(OwnershipService::class);
    }

    private function broker(string $status = Broker::STATUS_ACTIVE): Broker
    {
        return Broker::create([
            'agency_name'   => 'Agency ' . Str::random(4),
            'agent_name'    => 'Agent ' . Str::random(4),
            'phone'         => '0100' . rand(1000000, 9999999),
            'status'        => $status,
            'referral_code' => strtoupper(Str::random(8)),
        ]);
    }

    private function lead(): Lead
    {
        return Lead::create([
            'first_name' => 'Test',
            'last_name'  => 'Lead',
            'phone'      => '0111' . rand(1000000, 9999999),
            'status'     => Lead::STATUS_NEW,
        ]);
    }

    private function ctx(?Broker $broker, string $sourceKey = 'broker_referral'): array
    {
        return ['source_key' => $sourceKey, 'broker' => $broker, 'campaign' => null, 'promo_code' => null, 'utm' => []];
    }

    private function admin(): User
    {
        return User::create([
            'id'       => (string) Str::uuid(),
            'name'     => 'Admin ' . Str::random(4),
            'email'    => 'admin' . Str::random(6) . '@example.com',
            'password' => bcrypt('secret'),
            'role'     => 'admin',
            'status'   => 'active',
        ]);
    }

    /** @test */
    public function first_broker_wins_and_locks_ownership(): void
    {
        $broker = $this->broker();
        $lead = $this->lead();

        $result = $this->svc->resolveOwner($lead, $this->ctx($broker));

        $this->assertTrue($result['changed']);
        $lead->refresh();
        $this->assertSame(Lead::OWNER_BROKER, $lead->owner_type);
        $this->assertSame($broker->id, $lead->owner_id);
        $this->assertSame($broker->id, $lead->broker_id);
        $this->assertNotNull($lead->ownership_locked_at);
        $this->assertTrue($lead->isOwnershipLocked());
    }

    /** @test */
    public function second_broker_cannot_override_owned_lead(): void
    {
        $brokerA = $this->broker();
        $brokerB = $this->broker();
        $lead = $this->lead();

        $this->svc->resolveOwner($lead, $this->ctx($brokerA));
        $lead->refresh();

        $result = $this->svc->resolveOwner($lead, $this->ctx($brokerB));

        $this->assertFalse($result['changed']);
        $this->assertSame('already_owned', $result['reason']);
        $lead->refresh();
        $this->assertSame($brokerA->id, $lead->owner_id, 'Owner must remain the first broker.');
    }

    /** @test */
    public function ads_or_organic_touch_does_not_assign_owner(): void
    {
        $lead = $this->lead();

        $result = $this->svc->resolveOwner($lead, $this->ctx(null, 'facebook_ads'));

        $this->assertFalse($result['changed']);
        $this->assertSame('unowned_no_broker', $result['reason']);
        $lead->refresh();
        $this->assertNull($lead->owner_type);
        $this->assertFalse($lead->isOwnershipLocked());
    }

    /** @test */
    public function direct_ownership_is_assigned_when_unowned(): void
    {
        $lead = $this->lead();

        $result = $this->svc->assignDirectIfUnowned($lead, 'direct');

        $this->assertTrue($result['changed']);
        $lead->refresh();
        $this->assertSame(Lead::OWNER_DIRECT, $lead->owner_type);
        $this->assertNull($lead->owner_id);
        $this->assertTrue($lead->isOwnershipLocked());
    }

    /** @test */
    public function broker_cannot_claim_a_lead_already_owned_as_direct(): void
    {
        $lead = $this->lead();
        $this->svc->assignDirectIfUnowned($lead, 'direct');
        $lead->refresh();

        $result = $this->svc->resolveOwner($lead, $this->ctx($this->broker()));

        $this->assertFalse($result['changed']);
        $lead->refresh();
        $this->assertSame(Lead::OWNER_DIRECT, $lead->owner_type);
    }

    /** @test */
    public function admin_transfer_changes_owner_and_writes_ledger(): void
    {
        $lead = $this->lead();
        $this->svc->assignDirectIfUnowned($lead, 'direct');
        $targetBroker = $this->broker();
        $adminId = $this->admin()->id;

        $transfer = $this->svc->transfer($lead, Lead::OWNER_BROKER, $targetBroker->id, 'Customer complaint filed.', $adminId);

        $lead->refresh();
        $this->assertSame(Lead::OWNER_BROKER, $lead->owner_type);
        $this->assertSame($targetBroker->id, $lead->owner_id);
        $this->assertDatabaseHas('ownership_transfers', [
            'id'              => $transfer->id,
            'lead_id'         => $lead->id,
            'from_owner_type' => Lead::OWNER_DIRECT,
            'to_owner_type'   => Lead::OWNER_BROKER,
            'to_owner_id'     => $targetBroker->id,
            'transferred_by'  => $adminId,
        ]);
    }

    /** @test */
    public function transfer_requires_a_reason(): void
    {
        $lead = $this->lead();
        $this->expectException(\InvalidArgumentException::class);
        $this->svc->transfer($lead, Lead::OWNER_DIRECT, null, '   ', (string) Str::uuid());
    }

    /** @test */
    public function cannot_transfer_to_an_inactive_broker(): void
    {
        $lead = $this->lead();
        $suspended = $this->broker(Broker::STATUS_SUSPENDED);
        $this->expectException(\InvalidArgumentException::class);
        $this->svc->transfer($lead, Lead::OWNER_BROKER, $suspended->id, 'Reassign', (string) Str::uuid());
    }
}
