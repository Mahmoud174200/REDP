<?php

namespace App\Events\Acquisition;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Event: LeadCreated
 *
 * Fired when a new lead is captured from any source
 * (organic, broker referral, social ads webhook).
 * ─────────────────────────────────────────────────────────
 */
class LeadCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly string $leadId;
    public readonly string $source;

    public function __construct(string $leadId, string $source = 'direct')
    {
        $this->leadId = $leadId;
        $this->source = $source;
    }
}
