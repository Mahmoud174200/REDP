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
    public ?string $contractId;
    public ?int $installmentNumber;
    public ?string $gateway;
    public ?string $transactionRef;

    /**
     * Create a new event instance.
     */
    public function __construct(
        string $paymentId,
        string $clientId,
        float $amount,
        ?string $contractId = null,
        ?int $installmentNumber = null,
        ?string $gateway = null,
        ?string $transactionRef = null
    ) {
        $this->paymentId = $paymentId;
        $this->clientId = $clientId;
        $this->amount = $amount;
        $this->contractId = $contractId;
        $this->installmentNumber = $installmentNumber;
        $this->gateway = $gateway;
        $this->transactionRef = $transactionRef;
    }
}
