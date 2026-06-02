<?php

namespace App\Services\Acquisition;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Service: KycVerificationService
 *
 * Handles National ID & Passport file uploads with mock
 * Smart Facial Liveness matching verification.
 * Blueprint Section: H.1
 * ─────────────────────────────────────────────────────────
 */
class KycVerificationService
{
    /**
     * Minimum confidence score for automatic KYC approval.
     */
    private const MIN_CONFIDENCE_THRESHOLD = 85.0;

    /**
     * Store KYC document files and return storage paths.
     */
    public function storeDocuments(
        string $leadId,
        ?UploadedFile $nationalIdFront = null,
        ?UploadedFile $nationalIdBack = null,
        ?UploadedFile $passport = null,
        ?UploadedFile $selfie = null
    ): array {
        $paths = [];
        $directory = "kyc/{$leadId}";

        if ($nationalIdFront) {
            $paths['national_id_front_path'] = $nationalIdFront->store(
                $directory, 'local'
            );
        }

        if ($nationalIdBack) {
            $paths['national_id_back_path'] = $nationalIdBack->store(
                $directory, 'local'
            );
        }

        if ($passport) {
            $paths['passport_path'] = $passport->store(
                $directory, 'local'
            );
        }

        if ($selfie) {
            $paths['selfie_path'] = $selfie->store(
                $directory, 'local'
            );
        }

        Log::info('[KYC] Documents stored', [
            'lead_id' => $leadId,
            'paths'   => $paths,
        ]);

        return $paths;
    }

    /**
     * Mock Facial Liveness Verification.
     *
     * In production, this would integrate with a real biometric
     * verification API (e.g., AWS Rekognition, Regula, iProov).
     *
     * Returns a confidence score between 0-100.
     */
    public function verifyFacialLiveness(string $leadId, string $selfiePath, string $documentPath): array
    {
        // Simulate processing delay
        usleep(200000); // 200ms mock processing

        // Mock liveness score: biased towards passing (80-99%)
        $livenessScore = round(mt_rand(8000, 9950) / 100, 2);

        // Mock face-match score comparing selfie to ID photo
        $faceMatchScore = round(mt_rand(7500, 9900) / 100, 2);

        // Combined confidence
        $confidence = round(($livenessScore + $faceMatchScore) / 2, 2);

        $result = [
            'liveness_score'   => $livenessScore,
            'face_match_score' => $faceMatchScore,
            'confidence'       => $confidence,
            'passed'           => $confidence >= self::MIN_CONFIDENCE_THRESHOLD,
            'provider'         => 'mock_biometric_engine_v1',
            'verified_at'      => now()->toIso8601String(),
        ];

        Log::info('[KYC] Facial liveness verification completed', [
            'lead_id' => $leadId,
            'result'  => $result,
        ]);

        return $result;
    }

    /**
     * Determine KYC status based on verification result.
     */
    public function determineKycStatus(array $verificationResult): string
    {
        if ($verificationResult['passed']) {
            return 'verified';
        }

        return 'rejected';
    }

    /**
     * Extract National ID data via mock OCR.
     * In production: integrates with OCR engine (Google Vision, Tesseract).
     */
    public function extractDocumentData(string $documentPath): array
    {
        return [
            'extracted_name'        => 'Mock Extracted Name',
            'extracted_national_id' => '2' . str_pad(mt_rand(1, 99999999999), 13, '0', STR_PAD_LEFT),
            'extracted_dob'         => '1990-01-15',
            'extraction_confidence' => round(mt_rand(9000, 9900) / 100, 2),
            'provider'              => 'mock_ocr_engine_v1',
        ];
    }
}
