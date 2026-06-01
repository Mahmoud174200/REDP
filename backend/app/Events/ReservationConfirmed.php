<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationConfirmed
{
    use Dispatchable, SerializesModels;

    public string $reservationId;
    public string $unitId;
    public string $clientId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $reservationId, string $unitId, string $clientId)
    {
        $this->reservationId = $reservationId;
        $this->unitId = $unitId;
        $this->clientId = $clientId;
    }
}
