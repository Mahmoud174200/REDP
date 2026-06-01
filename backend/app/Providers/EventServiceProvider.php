<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// ── 🟠 Acquisition Events (Ragab) ──
use App\Events\Acquisition\LeadCreated;
use App\Events\Acquisition\BrokerRegistered;
use App\Events\Acquisition\ReservationConfirmed as AcquisitionReservationConfirmed;

// ── 🟢 Base / Financial Events (Melwany / Mahmoud) ──
use App\Events\ReservationConfirmed as BaseReservationConfirmed;
use App\Events\PaymentReceived;
use App\Events\ContractSigned;

// ── 🟠 Acquisition Listeners ──
use App\Listeners\Acquisition\HandlePaymentReceived;
use App\Listeners\Acquisition\HandleContractSigned;

// ── 🟢 Delivery Listeners ──
use App\Listeners\DeliveryEventListener;

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

        LeadCreated::class => [
            // Future: Notification listeners, analytics tracking
        ],

        AcquisitionReservationConfirmed::class => [
            // Consumed by Finance: create contract + payment plan
            // Consumed by Delivery: schedule handover inspection
        ],

        BrokerRegistered::class => [
            // Future: Welcome email, compliance review queue
        ],

        // ══════════════════════════════════════════════════
        // 🟢 DELIVERY & BASE EVENTS (Mahmoud / Melwany)
        // ══════════════════════════════════════════════════

        BaseReservationConfirmed::class => [
            [DeliveryEventListener::class, 'handleReservationConfirmed'],
        ],

        PaymentReceived::class => [
            HandlePaymentReceived::class,
            [DeliveryEventListener::class, 'handlePaymentReceived'],
        ],

        ContractSigned::class => [
            HandleContractSigned::class,
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

    /**
     * Determine if events and listeners should be auto-discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
