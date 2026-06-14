<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Tenant\TenantService;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    protected TenantService $tenantService;

    public function __construct(TenantService $tenantService)
    {
        $this->tenantService = $tenantService;
    }

    /**
     * Get list of all tenants (Central Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        // Enforce admin permission check
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        try {
            $tenants = Tenant::with(['subscription'])->get();
            return response()->json([
                'success' => true,
                'data' => $tenants
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading tenants: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register a new Tenant / Organization.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'subdomain' => 'required|string|unique:tenants,subdomain|max:50',
            'domain' => 'nullable|string|unique:tenants,domain|max:100'
        ]);

        try {
            $tenant = $this->tenantService->registerTenant($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Organization registered successfully under ' . $tenant->subdomain . '.',
                'data' => $tenant
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error registering organization: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update active tenant color profile and branding assets.
     */
    public function updateBranding(Request $request): JsonResponse
    {
        $request->validate([
            'primary_color' => 'nullable|string|max:10',
            'secondary_color' => 'nullable|string|max:10',
            'logo_url' => 'nullable|string'
        ]);

        try {
            $tenant = $this->tenantService->updateBranding($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Organization branding updated successfully.',
                'data' => $tenant
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating branding: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch subscription usage vs maximum allowed thresholds.
     */
    public function getQuotas(Request $request): JsonResponse
    {
        try {
            $summary = $this->tenantService->getUsageSummary();
            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching subscription details: ' . $e->getMessage()
            ], 500);
        }
    }
}
