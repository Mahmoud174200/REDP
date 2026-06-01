<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     * 
     * This follows the Core Decoupling Protocol (Blueprint Section DD):
     * Each engineer's listeners react to events from other engineers
     * without direct code/model dependencies.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // ─── Events consumed by Finance (Melwany) ───
        // From Acquisition (Ragab): auto-create contract + payment plan
        \App\Events\ReservationConfirmed::class => [
            \App\Listeners\Finance\HandleReservationConfirmed::class,
        ],

        // From Delivery (Mahmoud): final financial settlement
        // Note: HandoverCompleted event will be created by Mahmoud's module
        // \App\Events\Delivery\HandoverCompleted::class => [
        //     \App\Listeners\Finance\HandleHandoverCompleted::class,
        // ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
