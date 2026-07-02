<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Document;
use App\Models\Project;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Handover unit-delivery receipt: the officer uploads + signs it, and it
 * surfaces in the homeowner's portal documents.
 */
class HandoverReceiptTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, array $o = []): User
    {
        return User::create(array_merge([
            'id' => (string) Str::uuid(), 'name' => ucfirst($role),
            'email' => $role . Str::random(6) . '@example.com', 'password' => bcrypt('x'),
            'role' => $role, 'status' => 'active',
        ], $o));
    }

    private function unit(): Unit
    {
        $project = Project::create(['id' => (string) Str::uuid(), 'name' => 'Creekview', 'location' => 'New Cairo']);
        return Unit::create([
            'id' => (string) Str::uuid(), 'project_id' => $project->id,
            'unit_number' => 'W-01', 'floor' => 1, 'type' => 'townhouse', 'price' => 8000000,
        ]);
    }

    /** @test */
    public function officer_uploads_and_signs_the_delivery_receipt(): void
    {
        Storage::fake('public');

        $client = $this->user('client');
        $unit = $this->unit();
        Contract::create([
            'id' => (string) Str::uuid(), 'unit_id' => $unit->id, 'client_id' => $client->id,
            'contract_number' => 'CTR-'.Str::random(6), 'total_amount' => 8000000, 'status' => 'active',
        ]);
        $officer = $this->user('handover_officer');

        $res = $this->actingAs($officer, 'sanctum')->post(
            "/api/v1/delivery/units/{$unit->id}/handover-receipt",
            [
                'receipt' => UploadedFile::fake()->create('delivery-receipt.pdf', 120, 'application/pdf'),
                'signature_data' => 'data:image/png;base64,AAAA',
            ]
        );

        $res->assertCreated()->assertJsonPath('success', true);

        // Document created, tagged, linked to unit, signed, and discoverable by owner id
        $doc = Document::where('unit_id', $unit->id)->first();
        $this->assertNotNull($doc);
        $this->assertSame(Document::TYPE_DELIVERY_RECEIPT, $doc->document_type);
        $this->assertNotNull($doc->signed_at);
        $this->assertSame($officer->id, $doc->signed_by);
        $this->assertStringContainsString($client->id, $doc->ocr_content);

        // Unit marked handed over
        $this->assertSame('signed_off', $unit->fresh()->handover_status);
    }

    /** @test */
    public function signed_receipt_appears_in_the_homeowner_documents(): void
    {
        Storage::fake('public');

        $client = $this->user('client');
        $unit = $this->unit();
        Contract::create([
            'id' => (string) Str::uuid(), 'unit_id' => $unit->id, 'client_id' => $client->id,
            'contract_number' => 'CTR-'.Str::random(6), 'total_amount' => 8000000, 'status' => 'active',
        ]);
        $officer = $this->user('handover_officer');

        $this->actingAs($officer, 'sanctum')->post(
            "/api/v1/delivery/units/{$unit->id}/handover-receipt",
            ['receipt' => UploadedFile::fake()->create('r.pdf', 50, 'application/pdf')]
        )->assertCreated();

        // Homeowner opens their dashboard — the signed receipt is listed
        $res = $this->actingAs($client, 'sanctum')->getJson('/api/v1/delivery/homeowner/dashboard')->assertOk();

        $files = collect($res->json('files'));
        $receipt = $files->firstWhere('type', 'delivery_receipt');
        $this->assertNotNull($receipt, 'Delivery receipt should be listed in homeowner documents.');
        $this->assertStringContainsString('Delivery Receipt', $receipt['title']);
    }
}
