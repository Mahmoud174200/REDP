<?php

namespace App\Events\Acquisition;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Event: BrokerRegistered
 *
 * Fired when a new broker completes registration.
 * ─────────────────────────────────────────────────────────
 */
class BrokerRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly string $brokerId;
    public readonly string $referralCode;

    public function __construct(string $brokerId, string $referralCode)
    {
        $this->brokerId = $brokerId;
        $this->referralCode = $referralCode;
    }
}
