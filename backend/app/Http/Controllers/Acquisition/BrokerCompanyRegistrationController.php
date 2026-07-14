<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Services\Acquisition\BrokerCompanyService;
use App\Services\AuditLogService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Controller: BrokerCompanyRegistrationController
 *
 * Public self-service onboarding for external broker agencies.
 * A submission creates a PENDING company + owner account that
 * cannot log in until an admin vets & approves it (FR-01/FR-02).
 * ─────────────────────────────────────────────────────────
 */
class BrokerCompanyRegistrationController extends Controller
{
    public function __construct(private BrokerCompanyService $service)
    {
    }

    /**
     * POST /api/v1/broker-companies/register  (public)
     */
    public function register(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'company_name'        => 'required|string|max:200',
            'legal_name'          => 'nullable|string|max:200',
            'registration_number' => 'nullable|string|max:100',
            'tax_id'              => 'nullable|string|max:100',
            'license_no'          => 'nullable|string|max:100',
            'phone'               => 'required|string|max:20',
            'email'               => 'nullable|email|max:255',
            'address'             => 'nullable|string|max:500',
            'city'                => 'nullable|string|max:100',
            'bank_name'           => 'nullable|string|max:120',
            'bank_iban'           => 'nullable|string|max:40',
            'tax_card'               => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'commercial_registry'    => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            // Owner / manager account
            'owner_name'     => 'required|string|max:150',
            'owner_email'    => 'required|email|max:255|unique:users,email',
            'owner_phone'    => 'nullable|string|max:20',
            'owner_password' => 'required|string|min:6|confirmed',
        ]);

        // Store verification documents (returns a web-servable /storage URL for admin review)
        if ($request->hasFile('tax_card')) {
            $fields['tax_card_path'] = FileUploadService::upload($request->file('tax_card'), 'broker-agencies/kyc');
        }
        if ($request->hasFile('commercial_registry')) {
            $fields['commercial_registry_path'] = FileUploadService::upload($request->file('commercial_registry'), 'broker-agencies/kyc');
        }

        $result = $this->service->registerAgency($fields);

        AuditLogService::log('BROKER_COMPANY_REGISTER', null, [
            'company_id' => $result['company']->id,
            'owner_id'   => $result['owner']->id,
            'email'      => $result['owner']->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration submitted. Your agency is pending admin approval — you will be able to sign in once it is activated.',
            'data'    => [
                'company_id'   => $result['company']->id,
                'company_name' => $result['company']->name,
                'owner_email'  => $result['owner']->email,
                'status'       => $result['company']->approval_status,
            ],
        ], 201);
    }
}
