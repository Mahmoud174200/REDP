<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContractSigned
{
    use Dispatchable, SerializesModels;

    public string $contractId;
    public string $clientId;
    public ?string $unitId;
    public ?string $reservationId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $contractId, string $clientId, ?string $unitId = null, ?string $reservationId = null)
    {
        $this->contractId = $contractId;
        $this->clientId = $clientId;
        $this->unitId = $unitId;
        $this->reservationId = $reservationId;
    }
}
