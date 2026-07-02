<?php

namespace Tests\Feature;

use App\Models\Broker;
use App\Models\Lead;
use App\Models\User;
use App\Services\Acquisition\OwnershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Lead Attribution System — admin ownership transfer endpoint (protected).
 */
class OwnershipTransferEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::create([
            'id'       => (string) Str::uuid(),
            'name'     => ucfirst($role) . ' ' . Str::random(4),
            'email'    => $role . Str::random(6) . '@example.com',
            'password' => bcrypt('secret'),
            'role'     => $role,
            'status'   => 'active',
        ]);
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

    private function ownedLead(Broker $broker): Lead
    {
        $lead = Lead::create([
            'first_name' => 'Test', 'last_name' => 'Lead',
            'phone' => '0111' . rand(1000000, 9999999), 'status' => Lead::STATUS_NEW,
        ]);
        app(OwnershipService::class)->resolveOwner($lead, [
            'source_key' => 'broker_referral', 'broker' => $broker, 'campaign' => null, 'promo_code' => null, 'utm' => [],
        ]);
        return $lead->fresh();
    }

    /** @test */
    public function admin_can_transfer_ownership_with_a_reason(): void
    {
        $admin = $this->user('admin');
        $brokerA = $this->broker();
        $brokerB = $this->broker();
        $lead = $this->ownedLead($brokerA);

        $res = $this->actingAs($admin, 'sanctum')->postJson(
            "/api/v1/acquisition/leads/{$lead->id}/transfer-ownership",
            ['to_owner_type' => 'broker', 'to_owner_id' => $brokerB->id, 'reason' => 'Client requested broker change.']
        );

        $res->assertOk()->assertJsonPath('success', true);
        $this->assertSame($brokerB->id, $lead->fresh()->owner_id);
        $this->assertDatabaseHas('ownership_transfers', [
            'lead_id' => $lead->id, 'to_owner_id' => $brokerB->id, 'transferred_by' => $admin->id,
        ]);
    }

    /** @test */
    public function non_admin_cannot_transfer_ownership(): void
    {
        $agent = $this->user('sales_agent');
        $brokerA = $this->broker();
        $lead = $this->ownedLead($brokerA);

        $res = $this->actingAs($agent, 'sanctum')->postJson(
            "/api/v1/acquisition/leads/{$lead->id}/transfer-ownership",
            ['to_owner_type' => 'direct', 'reason' => 'Trying to steal.']
        );

        $res->assertStatus(403);
        $this->assertSame($brokerA->id, $lead->fresh()->owner_id, 'Owner must be unchanged after a forbidden transfer.');
    }

    /** @test */
    public function transfer_without_reason_is_rejected(): void
    {
        $admin = $this->user('admin');
        $lead = $this->ownedLead($this->broker());

        $res = $this->actingAs($admin, 'sanctum')->postJson(
            "/api/v1/acquisition/leads/{$lead->id}/transfer-ownership",
            ['to_owner_type' => 'direct']
        );

        $res->assertStatus(422);
    }
}
