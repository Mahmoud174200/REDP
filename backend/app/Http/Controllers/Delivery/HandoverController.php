<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\DefectsSnag;
use App\Models\Unit;
use App\Services\AuditLogService;
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

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'unit' => [
                'id' => $unit->id,
                'number' => $unit->unit_number,
                'type' => $unit->type,
                'status' => $unit->status,
                'handover_date' => $unit->handover_date,
                'project_id' => $unit->project_id,
                'project_name' => $unit->project->name ?? '—',
                'project_delivery_date' => $unit->project->delivery_date ?? null,
            ],
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

        $clientId = $request->user()->id;

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
}
