<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Models\Lead;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TenantService
{
    /**
     * Register a new tenant organization with basic tier subscription.
     */
    public function registerTenant(array $data): Tenant
    {
        return \DB::transaction(function () use ($data) {
            // 1. Create Tenant record
            $tenant = Tenant::create([
                'name' => $data['name'],
                'subdomain' => Str::slug($data['subdomain']),
                'domain' => $data['domain'] ?? null,
                'status' => 'trial',
                'branding' => [
                    'primary_color' => '#6366f1', // default indigo
                    'secondary_color' => '#ec4899', // default pink
                    'logo_url' => ''
                ]
            ]);

            // 2. Create basic subscription plans
            TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'plan' => 'basic',
                'starts_at' => Carbon::now(),
                'ends_at' => Carbon::now()->addDays(30), // 30 days trial
                'status' => 'active',
                'max_users' => 10,
                'max_leads' => 1000,
                'features' => ['leads', 'finance', 'omnichannel']
            ]);

            return $tenant;
        });
    }

    /**
     * Check if tenant is within subscription limits.
     */
    public function checkQuota(string $metric, ?string $tenantId = null): bool
    {
        $tenantId = $tenantId ?: Tenant::currentId();
        if (!$tenantId) {
            return true; // Bypass Central Admin
        }

        $subscription = TenantSubscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->first();

        if (!$subscription) {
            return false;
        }

        if ($metric === 'users') {
            $currentCount = User::where('tenant_id', $tenantId)->count();
            return $currentCount < $subscription->max_users;
        }

        if ($metric === 'leads') {
            $currentCount = Lead::where('tenant_id', $tenantId)->count();
            return $currentCount < $subscription->max_leads;
        }

        return true;
    }

    /**
     * Update Tenant color branding profile.
     */
    public function updateBranding(array $branding, ?string $tenantId = null): Tenant
    {
        $tenantId = $tenantId ?: Tenant::currentId();
        if (!$tenantId) {
            throw new \Exception("Active tenant context is required.");
        }

        $tenant = Tenant::findOrFail($tenantId);
        $brandingData = array_merge($tenant->branding ?? [], [
            'primary_color' => $branding['primary_color'] ?? '#6366f1',
            'secondary_color' => $branding['secondary_color'] ?? '#ec4899',
            'logo_url' => $branding['logo_url'] ?? ''
        ]);

        $tenant->update(['branding' => $brandingData]);
        return $tenant;
    }

    /**
     * Get active quota usage details.
     */
    public function getUsageSummary(?string $tenantId = null): array
    {
        $tenantId = $tenantId ?: Tenant::currentId();
        if (!$tenantId) {
            return [];
        }

        $subscription = TenantSubscription::where('tenant_id', $tenantId)->first();
        if (!$subscription) {
            return [];
        }

        return [
            'plan' => $subscription->plan,
            'status' => $subscription->status,
            'ends_at' => $subscription->ends_at ? $subscription->ends_at->toIso8601String() : null,
            'users' => [
                'used' => User::where('tenant_id', $tenantId)->count(),
                'limit' => $subscription->max_users
            ],
            'leads' => [
                'used' => Lead::where('tenant_id', $tenantId)->count(),
                'limit' => $subscription->max_leads
            ],
            'features' => $subscription->features ?? []
        ];
    }
}
