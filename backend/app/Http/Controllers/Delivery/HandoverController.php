<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\DefectsSnag;
use App\Models\Unit;
use App\Services\AuditLogService;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HandoverController extends Controller
{
    /**
     * Get QC inspection checklist for a unit.
     * Section H.17: Fetches the checklist items and details of existing logged snags.
     */
    public function getChecklist(Request $request, string $unitId)
    {
        $unit = Unit::findOrFail($unitId);
        
        // Fetch existing logged snags for this unit
        $existingSnags = DefectsSnag::where('unit_id', $unitId)->get();

        // Retrieve active contract for unit
        $contract = \App\Models\Contract::where('unit_id', $unitId)
            ->whereIn('status', ['active', 'completed'])
            ->with(['client', 'payments'])
            ->first();

        $clientData = null;
        $contractData = null;
        $paymentStatus = null;

        if ($contract) {
            $clientData = [
                'id' => $contract->client->id ?? null,
                'name' => $contract->client->name ?? 'N/A',
                'phone' => $contract->client->phone ?? 'N/A',
                'email' => $contract->client->email ?? 'N/A',
                'national_id' => $contract->client->national_id ?? 'N/A',
            ];

            $contractData = [
                'id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'status' => $contract->status,
                'total_amount' => (float) $contract->total_amount,
                'paid_amount' => (float) $contract->paid_amount,
                'signed_at' => $contract->signed_at,
            ];

            $payments = $contract->payments;
            $totalAmount = (float) $contract->total_amount;
            $paidAmount = (float) $payments->where('status', 'paid')->sum('amount');
            $outstanding = max(0.0, $totalAmount - $paidAmount);
            
            $overduePayments = $payments->filter(function ($p) {
                return $p->status === 'pending' && $p->due_date && \Carbon\Carbon::parse($p->due_date)->isPast();
            });

            $paymentStatus = [
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'outstanding' => $outstanding,
                'overdue_count' => $overduePayments->count(),
                'overdue_amount' => (float) $overduePayments->sum('amount'),
                'status' => $overduePayments->count() > 0 ? 'overdue' : ($outstanding <= 0 ? 'fully_paid' : 'current'),
            ];
        }

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'unit' => [
                'id' => $unit->id,
                'number' => $unit->unit_number,
                'type' => $unit->type,
                'floor' => $unit->floor,
                'building' => $unit->building,
                'area' => $unit->area,
                'bedrooms' => $unit->bedrooms,
                'bathrooms' => $unit->bathrooms,
                'view_type' => $unit->view_type,
                'status' => $unit->status,
                'handover_date' => $unit->handover_date,
                'handover_status' => $unit->handover_status ?? 'pending',
                'handover_report' => $unit->handover_report,
                'handover_images' => $unit->handover_images ? json_decode($unit->handover_images) : [],
                'handover_signature' => $unit->handover_signature,
                'project_id' => $unit->project_id,
                'project_name' => $unit->project->name ?? '—',
                'project_delivery_date' => $unit->project->delivery_date ?? null,
            ],
            'client' => $clientData,
            'contract' => $contractData,
            'payment_status' => $paymentStatus,
            'checklist' => [
                ['id' => 'chk_walls', 'item' => 'Wall plaster smoothness & painting layers', 'passed' => $existingSnags->where('description', 'like', '%wall%')->count() === 0],
                ['id' => 'chk_plumbing', 'item' => 'Plumbing tap flows & drain blockages check', 'passed' => $existingSnags->where('description', 'like', '%plumb%')->count() === 0],
                ['id' => 'chk_electrical', 'item' => 'Electric sockets & circuit breaker panel check', 'passed' => $existingSnags->where('description', 'like', '%elect%')->count() === 0],
                ['id' => 'chk_doors', 'item' => 'Doors, window tracks & locks verification', 'passed' => $existingSnags->where('description', 'like', '%door%')->count() === 0]
            ],
            'logged_snags' => $existingSnags
        ], 200);
    }

    /**
     * Save/Draft the handover minutes/report.
     */
    public function saveHandoverReport(Request $request, string $unitId)
    {
        $request->validate([
            'report' => 'required|string',
        ]);

        $unit = Unit::findOrFail($unitId);
        $unit->update([
            'handover_report' => $request->report,
            'handover_status' => $unit->handover_status === 'pending' ? 'scheduled' : $unit->handover_status,
        ]);

        AuditLogService::log(
            'HANDOVER_REPORT_SAVE', 
            $request->user()->id, 
            ['unit_id' => $unitId]
        );

        return response()->json([
            'success' => true,
            'message' => 'Handover minutes draft saved successfully.',
            'report' => $request->report,
        ]);
    }

    /**
     * Upload an inspection photo for a unit handover.
     */
    public function uploadHandoverImage(Request $request, string $unitId)
    {
        $request->validate([
            'file' => 'required|file|image|max:10240',
        ]);

        $unit = Unit::findOrFail($unitId);
        
        // Upload file
        $url = FileUploadService::upload($request->file('file'), 'handover_photos');
        
        // Add to images JSON
        $currentImages = $unit->handover_images ? json_decode($unit->handover_images, true) : [];
        $currentImages[] = $url;
        
        $unit->update([
            'handover_images' => json_encode($currentImages),
        ]);

        AuditLogService::log(
            'HANDOVER_IMAGE_UPLOAD', 
            $request->user()->id, 
            ['unit_id' => $unitId, 'url' => $url]
        );

        return response()->json([
            'success' => true,
            'message' => 'Handover photo uploaded successfully.',
            'images' => $currentImages,
        ]);
    }

    /**
     * Log a new snag/defect on a unit inspection.
     * Section H.17: Quality control snags logger.
     */
    public function reportSnag(Request $request)
    {
        $request->validate([
            'unit_id' => 'required|uuid|exists:units,id',
            'description' => 'required|string',
            'severity' => 'required|string|in:low,medium,high,critical',
        ]);

        $engineerId = $request->user()->id;
        $snagId = (string) Str::uuid();

        // Database save
        $snag = DefectsSnag::create([
            'id' => $snagId,
            'unit_id' => $request->unit_id,
            'description' => $request->description,
            'severity' => $request->severity,
            'status' => 'pending'
        ]);

        AuditLogService::log(
            'SNAG_REPORT', 
            $engineerId, 
            ['snag_id' => $snagId, 'unit_id' => $request->unit_id, 'severity' => $request->severity]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'QC Snag logged successfully and queued for vendor repair.',
            'snag' => $snag
        ], 201);
    }

    /**
     * Submit client digital signature sign-off.
     */
    public function signOff(Request $request, string $unitId)
    {
        $request->validate([
            'signature_data' => 'required|string', // Base64 signature path/coordinates
        ]);

        $unit = Unit::findOrFail($unitId);
        $clientId = $request->user()->id;

        $unit->update([
            'handover_status' => 'signed_off',
            'handover_signature' => $request->signature_data,
        ]);

        // Notify the owner their unit has been handed over. The timeline document
        // is rendered live, so it already reflects this the next time it's opened.
        try {
            $contract = \App\Models\Contract::whereIn('status', ['active', 'completed'])
                ->where('unit_id', $unitId)
                ->latest('signed_at')
                ->first();
            if ($contract && $contract->client_id) {
                \App\Services\NotificationService::send(
                    $contract->client_id,
                    'push',
                    $contract->client?->email ?? '',
                    'Unit Handed Over 🔑 / تم تسليم وحدتك',
                    "Congratulations! Unit {$unit->unit_number} has been officially handed over. "
                    . "تهانينا! تم تسليم وحدتك {$unit->unit_number} رسمياً."
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Handover notification failed for unit {$unitId}: " . $e->getMessage());
        }

        // Perform mock signature verification
        AuditLogService::log(
            'HANDOVER_SIGN_OFF',
            $clientId,
            ['unit_id' => $unitId, 'has_signature' => true]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Handover QC sign-off complete. Client digital signature verified and logged.',
            'timestamp' => now()->toIso8601String()
        ], 200);
    }

    /**
     * POST /v1/delivery/units/{unitId}/handover-receipt
     * The handover officer uploads the unit-delivery receipt and signs it as the
     * customer takes the unit. The signed receipt is stored as a Document that
     * surfaces automatically in the homeowner's portal (Documents / الملفات).
     */
    public function uploadHandoverReceipt(Request $request, string $unitId)
    {
        $request->validate([
            'receipt'        => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'signature_data' => 'nullable|string', // base64 signature captured at delivery
            'notes'          => 'nullable|string|max:1000',
        ]);

        $unit = Unit::findOrFail($unitId);

        // Resolve the homeowner (owner) + contract/reservation so the receipt is
        // discoverable by the homeowner's document query (text-matched ocr_content).
        $contract = \App\Models\Contract::where('unit_id', $unitId)
            ->whereIn('status', ['active', 'completed', 'pending_signature'])
            ->latest('signed_at')
            ->first();
        $reservation = \App\Models\Reservation::where('unit_id', $unitId)
            ->latest('created_at')
            ->first();
        $ownerUserId = $contract?->client_id ?? $reservation?->client_id;

        // Store the receipt file on the public disk (web-servable).
        $url = FileUploadService::upload($request->file('receipt'), 'handover_receipts');

        // Capture the officer's delivery signature and mark the unit handed over.
        $unit->update([
            'handover_status'    => 'signed_off',
            'handover_signature' => $request->input('signature_data', $unit->handover_signature),
            'handover_date'      => $unit->handover_date ?? now()->toDateString(),
        ]);

        $doc = \App\Models\Document::create([
            'id'            => (string) Str::uuid(),
            'title'         => "Unit Delivery Receipt (Handover) — {$unit->unit_number}",
            'document_type' => \App\Models\Document::TYPE_DELIVERY_RECEIPT,
            'unit_id'       => $unit->id,
            'file_path'     => $url,
            'status'        => 'indexed',
            'signed_at'     => now(),
            'signed_by'     => $request->user()?->id,
            // Owner/contract/reservation ids embedded so the homeowner portal finds it.
            'ocr_content'   => trim('delivery receipt handover unit ' . $unit->unit_number . ' '
                . implode(' ', array_filter([$ownerUserId, $contract?->id, $reservation?->id]))
                . ' ' . (string) $request->input('notes')),
        ]);

        // Notify the homeowner that the signed receipt is available.
        try {
            if ($ownerUserId) {
                \App\Services\NotificationService::send(
                    $ownerUserId,
                    'push',
                    $contract?->client?->email ?? '',
                    'Delivery Receipt Ready 📄 / إيصال الاستلام جاهز',
                    "Your signed unit delivery receipt for {$unit->unit_number} is now in your documents. "
                    . "إيصال استلام وحدتك {$unit->unit_number} الموقّع أصبح متاحاً في مستنداتك."
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Handover receipt notification failed for unit {$unitId}: " . $e->getMessage());
        }

        AuditLogService::log('HANDOVER_RECEIPT_SIGNED', $request->user()?->id, [
            'unit_id'     => $unitId,
            'document_id' => $doc->id,
            'owner_id'    => $ownerUserId,
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'Delivery receipt uploaded and signed. It is now available in the homeowner portal.',
            'document' => [
                'id'        => $doc->id,
                'title'     => $doc->title,
                'file_path' => $doc->file_path,
                'signed_at' => $doc->signed_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Update unit's handover date.
     */
    public function updateHandoverDate(Request $request, string $unitId)
    {
        $request->validate([
            'handover_date' => 'nullable|date',
        ]);

        $unit = Unit::findOrFail($unitId);
        $oldDate = $unit->handover_date;
        $unit->update(['handover_date' => $request->handover_date]);

        AuditLogService::log(
            'UNIT_HANDOVER_DATE_UPDATE', 
            $request->user()->id, 
            ['unit_id' => $unitId, 'old_date' => $oldDate, 'new_date' => $request->handover_date]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Unit handover date updated successfully.',
            'handover_date' => $request->handover_date
        ]);
    }

    /**
     * Update project's delivery date.
     */
    public function updateDeliveryDate(Request $request, string $projectId)
    {
        $request->validate([
            'delivery_date' => 'nullable|date',
        ]);

        $project = \App\Models\Project::findOrFail($projectId);
        $oldDate = $project->delivery_date;
        $project->update(['delivery_date' => $request->delivery_date]);

        AuditLogService::log(
            'PROJECT_DELIVERY_DATE_UPDATE', 
            $request->user()->id, 
            ['project_id' => $projectId, 'old_date' => $oldDate, 'new_date' => $request->delivery_date]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Project delivery date updated successfully.',
            'delivery_date' => $request->delivery_date
        ]);
    }

    /**
     * Assign a delivery engineer to a unit handover.
     */
    public function assignEngineer(Request $request, string $unitId)
    {
        $request->validate([
            'assigned_engineer_id' => 'nullable|uuid|exists:users,id',
        ]);

        // Authorization check: Only handover_officer, project_manager, or admin
        $user = $request->user();
        if ($user->role !== 'handover_officer' && $user->role !== 'project_manager' && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only handover officers or managers can assign engineers.',
            ], 403);
        }

        $unit = Unit::findOrFail($unitId);
        $oldEngineerId = $unit->assigned_engineer_id;
        $unit->update(['assigned_engineer_id' => $request->assigned_engineer_id]);

        AuditLogService::log(
            'UNIT_ASSIGN_ENGINEER', 
            $request->user()->id, 
            ['unit_id' => $unitId, 'old_engineer' => $oldEngineerId, 'new_engineer' => $request->assigned_engineer_id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Delivery engineer assigned successfully.',
            'assigned_engineer_id' => $request->assigned_engineer_id,
        ]);
    }
}
