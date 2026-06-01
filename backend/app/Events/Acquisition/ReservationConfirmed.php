<?php

namespace App\Events\Acquisition;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Event: ReservationConfirmed
 *
 * Fired when a lead is updated to the 'reserved' state.
 * Payload contains ONLY lead_id and unit_id for loose-coupling.
 * 
 * Consumed by:
 *   - Finance (Melwany): Creates contract + payment plan
 *   - Delivery (Mahmoud): Schedules handover inspection
 * ─────────────────────────────────────────────────────────
 */
class ReservationConfirmed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly string $leadId;
    public readonly string $unitId;

    public function __construct(string $leadId, string $unitId)
    {
        $this->leadId = $leadId;
        $this->unitId = $unitId;
    }

    /**
     * Serialized payload for cross-domain event consumption.
     */
    public function toPayload(): array
    {
        return [
            'lead_id' => $this->leadId,
            'unit_id' => $this->unitId,
        ];
    }
}
