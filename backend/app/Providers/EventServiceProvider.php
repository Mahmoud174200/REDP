<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Event Service Provider
 * Central registry for event-listener mappings across all domains.
 * Resolves both Acquisition (Ragab) and Delivery (Mahmoud) event flows.
 * ─────────────────────────────────────────────────────────
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string|array{0:class-string, 1:string}>>
     */
    protected $listen = [
        // ══════════════════════════════════════════════════
        // 🟠 ACQUISITION DOMAIN (Ragab)
        // ══════════════════════════════════════════════════

        // Events emitted by Acquisition
        \App\Events\Acquisition\LeadCreated::class => [
            // Future: Notification listeners, analytics tracking
        ],

        \App\Events\Acquisition\ReservationConfirmed::class => [
            // Consumed by Finance: create contract + payment plan
            // Consumed by Delivery: schedule handover inspection
        ],

        \App\Events\Acquisition\BrokerRegistered::class => [
            // Future: Welcome email, compliance review queue
        ],

        // ══════════════════════════════════════════════════
        // 🟢 DELIVERY & BASE EVENTS (Mahmoud / Melwany)
        // ══════════════════════════════════════════════════

        \App\Events\ReservationConfirmed::class => [
            [\App\Listeners\DeliveryEventListener::class, 'handleReservationConfirmed'],
        ],

        \App\Events\PaymentReceived::class => [
            \App\Listeners\Acquisition\HandlePaymentReceived::class,
            [\App\Listeners\DeliveryEventListener::class, 'handlePaymentReceived'],
        ],

        \App\Events\ContractSigned::class => [
            \App\Listeners\Acquisition\HandleContractSigned::class,
            [\App\Listeners\DeliveryEventListener::class, 'handleContractSigned'],
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be auto-discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
