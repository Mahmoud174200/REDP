<?php

namespace App\Providers;

use App\Events\ReservationConfirmed;
use App\Events\PaymentReceived;
use App\Events\ContractSigned;
use App\Listeners\DeliveryEventListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event-to-listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string|string>>
     */
    protected $listen = [
        ReservationConfirmed::class => [
            [DeliveryEventListener::class, 'handleReservationConfirmed'],
        ],
        PaymentReceived::class => [
            [DeliveryEventListener::class, 'handlePaymentReceived'],
        ],
        ContractSigned::class => [
            [DeliveryEventListener::class, 'handleContractSigned'],
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }
}
