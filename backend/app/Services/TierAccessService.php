<?php

namespace App\Services;

use App\Models\User;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Service: TierAccessService
 *
 * Central service for field-level data filtering based on
 * user tier. Ensures lower-tier users cannot see sensitive
 * data even if they somehow access the raw model.
 * ─────────────────────────────────────────────────────────
 */
class TierAccessService
{
    /**
     * Fields that Tier 1 (tele-sales) is NOT allowed to see on a lead.
     */
    private const LEAD_RESTRICTED_TIER_1 = [
        'national_id',
        'passport_no',
        'national_id_front_path',
        'national_id_back_path',
        'passport_path',
        'selfie_path',
        'facial_match_score',
        'kyc_status',
    ];

    /**
     * Fields that Tier 1 (tele-sales) is NOT allowed to see on a unit.
     */
    private const UNIT_RESTRICTED_TIER_1 = [
        'price',
        'view_type',
    ];

    /**
     * Fields that Tier 1 (tele-sales) is NOT allowed to see on a project.
     */
    private const PROJECT_RESTRICTED_TIER_1 = [
        'total_units',
    ];

    /**
     * Filter lead data based on user's tier level.
     *
     * @param  array|object  $lead  The lead data (array or model->toArray())
     * @param  User          $user  The requesting user
     * @return array
     */
    public static function filterLeadForRole(array $lead, User $user): array
    {
        $tierLevel = $user->getTierLevel();

        if ($tierLevel >= 3 || $user->isAdmin()) {
            return $lead; // Full access
        }

        if ($tierLevel <= 1) {
            // Tier 1: Strip KYC and sensitive identity fields
            foreach (self::LEAD_RESTRICTED_TIER_1 as $field) {
                unset($lead[$field]);
            }
            // Also strip nested relations that may leak data
            unset($lead['commissions'], $lead['call_logs']);
        }

        return $lead;
    }

    /**
     * Filter unit data based on user's tier level.
     *
     * @param  array  $unit  The unit data
     * @param  User   $user  The requesting user
     * @return array
     */
    public static function filterUnitForRole(array $unit, User $user): array
    {
        $tierLevel = $user->getTierLevel();

        if ($tierLevel >= 2 || $user->isAdmin()) {
            return $unit; // Tier 2+ can see everything
        }

        // Tier 1: Strip pricing and detailed specs
        foreach (self::UNIT_RESTRICTED_TIER_1 as $field) {
            unset($unit[$field]);
        }

        // Strip nested payment plan data
        unset($unit['payment_plan'], $unit['reservations'], $unit['active_reservation']);

        return $unit;
    }

    /**
     * Filter project data based on user's tier level.
     * Tier 1 only gets name and category (location).
     *
     * @param  array  $project  The project data
     * @param  User   $user     The requesting user
     * @return array
     */
    public static function filterProjectForRole(array $project, User $user): array
    {
        $tierLevel = $user->getTierLevel();

        if ($tierLevel >= 2 || $user->isAdmin()) {
            return $project; // Tier 2+ can see everything
        }

        // Tier 1: Only name and location (basic categories)
        return [
            'id'       => $project['id'] ?? null,
            'name'     => $project['name'] ?? null,
            'location' => $project['location'] ?? null,
            'status'   => $project['status'] ?? null,
        ];
    }

    /**
     * Filter a collection of leads for the given user's tier.
     */
    public static function filterLeadsCollection(array $leads, User $user): array
    {
        return array_map(fn($lead) => self::filterLeadForRole($lead, $user), $leads);
    }

    /**
     * Filter a collection of units for the given user's tier.
     */
    public static function filterUnitsCollection(array $units, User $user): array
    {
        return array_map(fn($unit) => self::filterUnitForRole($unit, $user), $units);
    }

    /**
     * Validate that a tier transition is allowed.
     * Leads can only progress forward (tier 1 → 2 → 3), never backward.
     *
     * @param  string  $currentTier  e.g., 'tier_1'
     * @param  string  $targetTier   e.g., 'tier_2'
     * @return bool
     */
    public static function isValidTierTransition(string $currentTier, string $targetTier): bool
    {
        $tierOrder = ['tier_1' => 1, 'tier_2' => 2, 'tier_3' => 3];

        $current = $tierOrder[$currentTier] ?? 0;
        $target  = $tierOrder[$targetTier] ?? 0;

        return $target > $current;
    }

    /**
     * Get the tier string for a given role.
     */
    public static function getTierForRole(string $role): string
    {
        return match ($role) {
            'tele_sales'    => 'tier_1',
            'broker'        => 'tier_2',
            'company_sales' => 'tier_3',
            default         => 'tier_1',
        };
    }
}
