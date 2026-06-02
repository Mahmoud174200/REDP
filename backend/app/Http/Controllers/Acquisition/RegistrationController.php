<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\Acquisition\KycVerificationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Controller: RegistrationController
 * Blueprint Section: H.1 — KYC & Facial Verification API
 *
 * Endpoint: /api/v1/kyc/register
 * Handles National ID & Passport file uploads with mock
 * Smart Facial Liveness matching.
 * ─────────────────────────────────────────────────────────
 */
class RegistrationController extends Controller
{
    private KycVerificationService $kycService;

    public function __construct(KycVerificationService $kycService)
    {
        $this->kycService = $kycService;
    }

    /**
     * POST /api/v1/kyc/register
     * Upload KYC documents and run facial verification.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'lead_id'            => 'required|uuid|exists:leads,id',
            'national_id_front'  => 'required_without:passport|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'national_id_back'   => 'required_without:passport|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'passport'           => 'required_without:national_id_front|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'selfie'             => 'required|file|mimes:jpg,jpeg,png|max:10240',
            'national_id_number' => 'nullable|string|max:30',
            'passport_number'    => 'nullable|string|max:30',
        ]);

        $lead = Lead::findOrFail($request->input('lead_id'));

        // Step 1: Store documents
        $paths = $this->kycService->storeDocuments(
            $lead->id,
            $request->file('national_id_front'),
            $request->file('national_id_back'),
            $request->file('passport'),
            $request->file('selfie')
        );

        // Step 2: Update lead with document paths and identity data
        $updateData = array_merge($paths, [
            'kyc_status' => 'pending',
        ]);

        if ($request->filled('national_id_number')) {
            $updateData['national_id'] = $request->input('national_id_number');
        }
        if ($request->filled('passport_number')) {
            $updateData['passport_no'] = $request->input('passport_number');
        }

        $lead->update($updateData);

        // Step 3: Run facial liveness verification
        $documentPath = $paths['national_id_front_path'] ?? $paths['passport_path'] ?? '';
        $selfiePath   = $paths['selfie_path'] ?? '';

        $verificationResult = $this->kycService->verifyFacialLiveness(
            $lead->id, $selfiePath, $documentPath
        );

        // Step 4: Update KYC status based on result
        $kycStatus = $this->kycService->determineKycStatus($verificationResult);
        $lead->update([
            'kyc_status'         => $kycStatus,
            'facial_match_score' => $verificationResult['confidence'],
        ]);

        // Step 5: Mock OCR extraction
        $ocrData = [];
        if ($documentPath) {
            $ocrData = $this->kycService->extractDocumentData($documentPath);
        }

        // Audit trail
        AuditLogService::log('KYC_VERIFICATION', $request->user()?->id, [
            'lead_id'     => $lead->id,
            'kyc_status'  => $kycStatus,
            'confidence'  => $verificationResult['confidence'],
            'passed'      => $verificationResult['passed'],
        ]);

        return response()->json([
            'success'      => true,
            'message'      => $verificationResult['passed']
                ? 'KYC verification passed successfully.'
                : 'KYC verification failed. Manual review required.',
            'data'         => $lead->fresh(),
            'verification' => $verificationResult,
            'ocr_data'     => $ocrData,
        ], $verificationResult['passed'] ? 200 : 422);
    }

    /**
     * GET /api/v1/kyc/pending
     * Retrieve all leads with pending KYC verification (admin compliance view).
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        $leads = Lead::where('kyc_status', 'pending')
            ->orWhere('kyc_status', 'rejected')
            ->with('agent')
            ->orderBy('updated_at', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $leads,
        ]);
    }

    /**
     * PUT /api/v1/kyc/{leadId}/approve
     * Admin manual KYC approval/rejection.
     */
    public function manualDecision(Request $request, string $leadId): JsonResponse
    {
        $request->validate([
            'decision' => 'required|in:verified,rejected',
            'reason'   => 'nullable|string|max:500',
        ]);

        $lead = Lead::findOrFail($leadId);
        $lead->update(['kyc_status' => $request->input('decision')]);

        AuditLogService::log('KYC_MANUAL_DECISION', $request->user()?->id, [
            'lead_id'  => $lead->id,
            'decision' => $request->input('decision'),
            'reason'   => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "KYC status updated to '{$request->input('decision')}'.",
            'data'    => $lead->fresh(),
        ]);
    }
}
