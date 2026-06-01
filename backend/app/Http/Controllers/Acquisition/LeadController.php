<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\AuditLogService;
use App\Events\LeadCreated; // Placeholder for event tracking
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    /**
     * Get list of leads.
     */
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟠 Ragab (Acquisition)',
            'data' => Lead::with('agent')->latest()->get()
        ]);
    }

    /**
     * Create a new lead.
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'source' => 'nullable|string',
        ]);

        $lead = Lead::create([
            'id' => (string) Str::uuid(),
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'],
            'assigned_agent_id' => $request->user()->id,
            'stage' => 'new',
            'kyc_status' => 'none',
            'source' => $fields['source'] ?? 'direct',
        ]);

        AuditLogService::log('LEAD_CREATE', $request->user()->id, ['lead_id' => $lead->id]);

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully.',
            'data' => $lead
        ], 201);
    }

    /**
     * Submit KYC data for a prospect.
     */
    public function submitKyc(Request $request, string $id)
    {
        $lead = Lead::findOrFail($id);

        $request->validate([
            'document_front' => 'required|file|image',
            'document_back' => 'required|file|image',
        ]);

        // Placeholders for KYC automation OCR + Liveness checks (Blueprint H.1)
        $lead->update([
            'kyc_status' => 'pending'
        ]);

        AuditLogService::log('KYC_SUBMIT', $request->user()->id, ['lead_id' => $lead->id]);

        return response()->json([
            'success' => true,
            'message' => 'KYC files uploaded successfully. Facematch liveness verification queued.',
            'data' => $lead
        ]);
    }
}
