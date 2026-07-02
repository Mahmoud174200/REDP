<?php

namespace Tests\Unit;

use App\Models\Lead;
use App\Services\Acquisition\IdentityResolutionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Lead Attribution System — identity resolution (phone → NID → email),
 * guaranteeing no duplicate customers.
 */
class IdentityResolutionServiceTest extends TestCase
{
    use RefreshDatabase;

    private IdentityResolutionService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = app(IdentityResolutionService::class);
    }

    private function lead(array $o = []): Lead
    {
        return Lead::create(array_merge([
            'first_name' => 'Test',
            'last_name'  => 'Lead',
            'phone'      => '01000000001',
            'status'     => Lead::STATUS_NEW,
        ], $o));
    }

    /** @test */
    public function resolves_by_phone_first(): void
    {
        $lead = $this->lead(['phone' => '01000000123']);
        $found = $this->svc->resolve('01000000123', null, null);
        $this->assertNotNull($found);
        $this->assertSame($lead->id, $found->id);
    }

    /** @test */
    public function normalizes_phone_before_matching(): void
    {
        $lead = $this->lead(['phone' => '01000000123']);
        $found = $this->svc->resolve('0100-000 0123', null, null);
        $this->assertNotNull($found);
        $this->assertSame($lead->id, $found->id);
    }

    /** @test */
    public function falls_back_to_national_id_when_phone_does_not_match(): void
    {
        $lead = $this->lead(['phone' => '01000000123', 'national_id' => '29001011234567']);
        $found = $this->svc->resolve('09999999999', '29001011234567', null);
        $this->assertSame($lead->id, $found?->id);
    }

    /** @test */
    public function falls_back_to_email_case_insensitive(): void
    {
        $lead = $this->lead(['phone' => '01000000123', 'email' => 'client@example.com']);
        $found = $this->svc->resolve('09999999999', null, 'CLIENT@EXAMPLE.COM');
        $this->assertSame($lead->id, $found?->id);
    }

    /** @test */
    public function find_or_create_never_duplicates_an_existing_customer(): void
    {
        $existing = $this->lead(['phone' => '01000000555']);

        $result = $this->svc->findOrCreate('01000000555', null, null, ['first_name' => 'Should', 'last_name' => 'Ignore']);

        $this->assertFalse($result['created']);
        $this->assertSame($existing->id, $result['lead']->id);
        $this->assertSame(1, Lead::count());
    }

    /** @test */
    public function find_or_create_creates_when_no_match(): void
    {
        $this->lead(['phone' => '01000000555']);

        $result = $this->svc->findOrCreate('01000000999', null, null, ['first_name' => 'New', 'last_name' => 'Person']);

        $this->assertTrue($result['created']);
        $this->assertSame(2, Lead::count());
    }

    /** @test */
    public function find_or_create_backfills_missing_identifiers(): void
    {
        $existing = $this->lead(['phone' => '01000000555', 'email' => null]);

        $this->svc->findOrCreate('01000000555', null, 'late@example.com');

        $existing->refresh();
        $this->assertSame('late@example.com', $existing->email);
    }
}
