<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// ── Acquisition Events (Ragab) ──
use App\Events\Acquisition\LeadCreated;
use App\Events\Acquisition\ReservationConfirmed;
use App\Events\Acquisition\BrokerRegistered;

// ── Finance Events consumed by Acquisition (cross-domain) ──
use App\Events\PaymentReceived;
use App\Events\ContractSigned;

// ── Acquisition Listeners ──
use App\Listeners\Acquisition\HandlePaymentReceived;
use App\Listeners\Acquisition\HandleContractSigned;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Event Service Provider
 * Central registry for event-listener mappings across all domains.
 * ─────────────────────────────────────────────────────────
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // ══════════════════════════════════════════════════
        // 🟠 ACQUISITION DOMAIN (Ragab)
        // ══════════════════════════════════════════════════

        // Events emitted by Acquisition — listeners in other domains
        LeadCreated::class => [
            // Future: Notification listeners, analytics tracking
        ],

        ReservationConfirmed::class => [
            // Consumed by Finance: create contract + payment plan
            // Consumed by Delivery: schedule handover inspection
            // (Listeners registered by their respective domain providers)
        ],

        BrokerRegistered::class => [
            // Future: Welcome email, compliance review queue
        ],

        // ══════════════════════════════════════════════════
        // CROSS-DOMAIN: Finance → Acquisition consumption
        // ══════════════════════════════════════════════════

        PaymentReceived::class => [
            HandlePaymentReceived::class,
        ],

        ContractSigned::class => [
            HandleContractSigned::class,
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
