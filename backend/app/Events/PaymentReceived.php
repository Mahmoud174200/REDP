<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReceived
{
    use Dispatchable, SerializesModels;

    public string $paymentId;
    public string $clientId;
    public float $amount;

    /**
     * Create a new event instance.
     */
    public function __construct(string $paymentId, string $clientId, float $amount)
    {
        $this->paymentId = $paymentId;
        $this->clientId = $clientId;
        $this->amount = $amount;
    }
}
