<?php

namespace App\Services\Acquisition;

use App\Events\Acquisition\OwnershipAssigned;
use App\Events\Acquisition\OwnershipTransferred;
use App\Models\Broker;
use App\Models\Lead;
use App\Models\OwnershipTransfer;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Service: OwnershipService
 *
 * The single authority for lead ownership. Implements:
 *  - First-broker-wins assignment on UNOWNED leads
 *  - Permanent lock (ads/organic never override a broker)
 *  - Direct ownership for broker-less paid leads
 *  - Admin-only transfer with mandatory reason + full ledger
 *
 * Ownership is intentionally decoupled from attribution touches
 * (history is recorded regardless via AttributionService).
 * ─────────────────────────────────────────────────────────
 */
class OwnershipService
{
    /**
     * Resolve ownership for a lead given a resolved attribution context.
     * Safe to call on every touch — it only assigns when UNOWNED.
     *
     * @param array $context  Output of AttributionService::resolveContext()
     * @return array{changed: bool, owner_type: ?string, owner_id: ?string, reason: string}
     */
    public function resolveOwner(Lead $lead, array $context): array
    {
        return DB::transaction(function () use ($lead, $context) {
            // Re-read under lock to avoid races between concurrent touches.
            $fresh = Lead::whereKey($lead->id)->lockForUpdate()->first() ?? $lead;

            if ($fresh->isOwnershipLocked()) {
                return [
                    'changed'    => false,
                    'owner_type' => $fresh->owner_type,
                    'owner_id'   => $fresh->owner_id,
                    'reason'     => 'already_owned',
                ];
            }

            /** @var Broker|null $broker */
            $broker = $context['broker'] ?? null;
            $sourceKey = $context['source_key'] ?? null;

            if ($broker && $broker->status === Broker::STATUS_ACTIVE) {
                return $this->assign($fresh, Lead::OWNER_BROKER, $broker->id, $sourceKey ?? 'broker_referral');
            }

            // No broker context here → leave UNOWNED (ads/organic stay assignable later).
            return [
                'changed'    => false,
                'owner_type' => null,
                'owner_id'   => null,
                'reason'     => 'unowned_no_broker',
            ];
        }, 3);
    }

    /**
     * Force a lead to "direct" ownership (e.g. EOI paid with no broker).
     * Only assigns when still UNOWNED.
     */
    public function assignDirectIfUnowned(Lead $lead, string $sourceKey = 'direct'): array
    {
        return DB::transaction(function () use ($lead, $sourceKey) {
            $fresh = Lead::whereKey($lead->id)->lockForUpdate()->first() ?? $lead;
            if ($fresh->isOwnershipLocked()) {
                return ['changed' => false, 'owner_type' => $fresh->owner_type, 'owner_id' => $fresh->owner_id, 'reason' => 'already_owned'];
            }
            return $this->assign($fresh, Lead::OWNER_DIRECT, null, $sourceKey);
        }, 3);
    }

    /**
     * Admin-only ownership transfer. Reason is mandatory and logged.
     *
     * @throws \InvalidArgumentException
     */
    public function transfer(
        Lead $lead,
        string $toOwnerType,
        ?string $toOwnerId,
        string $reason,
        string $adminUserId
    ): OwnershipTransfer {
        if (trim($reason) === '') {
            throw new \InvalidArgumentException('A transfer reason is required.');
        }
        if (!in_array($toOwnerType, [Lead::OWNER_BROKER, Lead::OWNER_AGENT, Lead::OWNER_DIRECT], true)) {
            throw new \InvalidArgumentException("Invalid owner type: {$toOwnerType}");
        }
        if ($toOwnerType !== Lead::OWNER_DIRECT && !$toOwnerId) {
            throw new \InvalidArgumentException('owner_id is required for broker/agent ownership.');
        }
        if ($toOwnerType === Lead::OWNER_BROKER) {
            $broker = Broker::find($toOwnerId);
            if (!$broker || $broker->status !== Broker::STATUS_ACTIVE) {
                throw new \InvalidArgumentException('Target broker is not active.');
            }
        }

        return DB::transaction(function () use ($lead, $toOwnerType, $toOwnerId, $reason, $adminUserId) {
            $fresh = Lead::whereKey($lead->id)->lockForUpdate()->first();

            $from = ['type' => $fresh->owner_type, 'id' => $fresh->owner_id];

            $transfer = OwnershipTransfer::create([
                'lead_id'         => $fresh->id,
                'from_owner_type' => $from['type'],
                'from_owner_id'   => $from['id'],
                'to_owner_type'   => $toOwnerType,
                'to_owner_id'     => $toOwnerId,
                'reason'          => $reason,
                'transferred_by'  => $adminUserId,
                'tenant_id'       => $fresh->tenant_id,
                'created_at'      => now(),
            ]);

            $fresh->forceFill([
                'owner_type'          => $toOwnerType,
                'owner_id'            => $toOwnerId,
                'broker_id'           => $toOwnerType === Lead::OWNER_BROKER ? $toOwnerId : $fresh->broker_id,
                'ownership_locked_at' => now(),
            ])->save();

            AuditLogService::log('OWNERSHIP_TRANSFER', $adminUserId, [
                'lead_id'         => $fresh->id,
                'from_owner_type' => $from['type'],
                'from_owner_id'   => $from['id'],
                'to_owner_type'   => $toOwnerType,
                'to_owner_id'     => $toOwnerId,
                'reason'          => $reason,
            ], $from, ['type' => $toOwnerType, 'id' => $toOwnerId]);

            event(new OwnershipTransferred(
                $fresh->id, $from['type'], $from['id'], $toOwnerType, $toOwnerId, $adminUserId
            ));

            return $transfer;
        });
    }

    // ───────────────────────── internal ─────────────────────────

    private function assign(Lead $lead, string $ownerType, ?string $ownerId, string $sourceKey): array
    {
        $lead->forceFill([
            'owner_type'          => $ownerType,
            'owner_id'            => $ownerId,
            'broker_id'           => $ownerType === Lead::OWNER_BROKER ? $ownerId : $lead->broker_id,
            'ownership_locked_at' => now(),
        ])->save();

        AuditLogService::log('OWNERSHIP_ASSIGNED', auth()->id(), [
            'lead_id'    => $lead->id,
            'owner_type' => $ownerType,
            'owner_id'   => $ownerId,
            'source_key' => $sourceKey,
        ]);

        event(new OwnershipAssigned($lead->id, $ownerType, $ownerId, $sourceKey));

        return [
            'changed'    => true,
            'owner_type' => $ownerType,
            'owner_id'   => $ownerId,
            'reason'     => 'assigned',
        ];
    }
}
