<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\ClientJourneyLog;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Enhanced Audit Log Service
 *
 * Provides centralized audit logging for:
 * - General actions (user login, lead creation, etc.)
 * - Data access (read-level auditing for RBAC compliance)
 * - Tier transitions (lead moving between tiers)
 * - Broker presentations (Tier 2 audit trail)
 * ─────────────────────────────────────────────────────────
 */
class AuditLogService
{
    /**
     * Record a general audit log entry.
     */
    public static function log(string $action, ?string $userId, array $details = []): AuditLog
    {
        return AuditLog::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => request()->ip() ?: '127.0.0.1',
            'details' => $details,
        ]);
    }

    /**
     * Log a data access event (read-level auditing).
     * Called automatically by AuditDataAccess middleware but can also
     * be invoked manually for fine-grained resource access tracking.
     */
    public static function logDataAccess(
        string $userId,
        string $resourceType,
        ?string $resourceId,
        array $context = []
    ): AuditLog {
        return static::log('DATA_ACCESS', $userId, array_merge([
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
        ], $context));
    }

    /**
     * Log a tier transition event (lead moving between sales tiers).
     */
    public static function logTierTransition(
        string $leadId,
        string $fromTier,
        string $toTier,
        string $actorUserId,
        array $context = []
    ): AuditLog {
        return static::log('TIER_TRANSITION', $actorUserId, array_merge([
            'lead_id'   => $leadId,
            'from_tier' => $fromTier,
            'to_tier'   => $toTier,
        ], $context));
    }

    /**
     * Log a broker presentation event.
     */
    public static function logPresentation(
        string $presentationId,
        string $brokerUserId,
        string $leadId,
        string $projectId,
        array $unitIds = [],
        array $context = []
    ): AuditLog {
        return static::log('BROKER_PRESENTATION', $brokerUserId, array_merge([
            'presentation_id' => $presentationId,
            'lead_id'         => $leadId,
            'project_id'      => $projectId,
            'unit_ids'        => $unitIds,
        ], $context));
    }

    /**
     * Log a booking/transaction execution by company sales.
     */
    public static function logBooking(
        string $actorUserId,
        string $leadId,
        string $unitId,
        array $context = []
    ): AuditLog {
        return static::log('BOOKING_EXECUTED', $actorUserId, array_merge([
            'lead_id' => $leadId,
            'unit_id' => $unitId,
        ], $context));
    }

    /**
     * Record a client journey milestone (convenience wrapper).
     */
    public static function recordJourney(
        string $leadId,
        string $stage,
        User $actor,
        array $metadata = []
    ): ClientJourneyLog {
        return ClientJourneyLog::record($leadId, $stage, $actor, $metadata);
    }
}
