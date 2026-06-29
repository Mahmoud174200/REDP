<?php

namespace App\Events\Acquisition;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Event: OwnershipAssigned
 *
 * Fired the first time a lead becomes owned (first-broker-wins,
 * or direct ownership). Ownership is locked from this point.
 * ─────────────────────────────────────────────────────────
 */
class OwnershipAssigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $leadId,
        public readonly string $ownerType,
        public readonly ?string $ownerId,
        public readonly string $sourceKey,
    ) {}
}
