<?php

namespace App\Events\Acquisition;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Event: OwnershipTransferred
 *
 * Fired when an admin transfers a locked lead to a new owner.
 * ─────────────────────────────────────────────────────────
 */
class OwnershipTransferred
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $leadId,
        public readonly ?string $fromOwnerType,
        public readonly ?string $fromOwnerId,
        public readonly string $toOwnerType,
        public readonly ?string $toOwnerId,
        public readonly string $transferredBy,
    ) {}
}
