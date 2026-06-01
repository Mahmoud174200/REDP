<?php

namespace App\Events\Finance;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CancellationProcessed
{
    use Dispatchable, SerializesModels;

    public string $contractId;
    public string $cancellationId;
    public float $refundAmount;
    public float $penaltyAmount;

    /**
     * Create a new event instance.
     */
    public function __construct(string $contractId, string $cancellationId, float $refundAmount, float $penaltyAmount)
    {
        $this->contractId = $contractId;
        $this->cancellationId = $cancellationId;
        $this->refundAmount = $refundAmount;
        $this->penaltyAmount = $penaltyAmount;
    }
}
