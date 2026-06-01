<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContractSigned
{
    use Dispatchable, SerializesModels;

    public string $contractId;
    public string $clientId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $contractId, string $clientId)
    {
        $this->contractId = $contractId;
        $this->clientId = $clientId;
    }
}
