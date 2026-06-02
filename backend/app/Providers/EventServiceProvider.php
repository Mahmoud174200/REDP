<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

// ── 🟠 Acquisition Events  ──
use App\Events\Acquisition\LeadCreated;
use App\Events\Acquisition\BrokerRegistered;
use App\Events\Acquisition\ReservationConfirmed as AcquisitionReservationConfirmed;

// ── 🟢 Base / Financial Events  ──
use App\Events\ReservationConfirmed as BaseReservationConfirmed;
use App\Events\PaymentReceived;
use App\Events\ContractSigned;

// ── 🟠 Acquisition Listeners ──
use App\Listeners\Acquisition\HandlePaymentReceived;
use App\Listeners\Acquisition\HandleContractSigned;

// ── 🟢 Delivery Listeners ──
use App\Listeners\DeliveryEventListener;

// ── 🔵 Finance Listeners ──
use App\Listeners\Finance\HandleReservationConfirmed;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Event Service Provider
 * Central registry for event-listener mappings across all domains.
 * Resolves both Acquisition  and Delivery  event flows.
 * ─────────────────────────────────────────────────────────
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     * 
     * This follows the Core Decoupling Protocol (Blueprint Section DD):
     * Each engineer's listeners react to events from other engineers
     * without direct code/model dependencies.
     *
     * @var array<class-string, array<int, class-string|array>>
     */
    protected $listen = [
        // ══════════════════════════════════════════════════
        // 🟠 ACQUISITION DOMAIN 
        // ══════════════════════════════════════════════════

        LeadCreated::class => [
            // Future: Notification listeners, analytics tracking
        ],

        AcquisitionReservationConfirmed::class => [
            // Handled via bridge closure in boot() to auto-create client + reservation,
            // which then fires the base ReservationConfirmed event below.
        ],

        BrokerRegistered::class => [
            // Future: Welcome email, compliance review queue
        ],

        // ══════════════════════════════════════════════════
        // 🟢 DELIVERY & BASE EVENTS 
        // ══════════════════════════════════════════════════

        BaseReservationConfirmed::class => [
            HandleReservationConfirmed::class,
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

        // Bridge Acquisition's ReservationConfirmed event to base ReservationConfirmed
        \Illuminate\Support\Facades\Event::listen(
            AcquisitionReservationConfirmed::class,
            function (AcquisitionReservationConfirmed $event) {
                $lead = \App\Models\Lead::findOrFail($event->leadId);
                $unit = \App\Models\Unit::findOrFail($event->unitId);

                // Find or create the client user from Lead details
                $user = \App\Models\User::firstOrCreate(
                    ['email' => $lead->email],
                    [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'name' => $lead->full_name,
                        'phone' => $lead->phone,
                        'role' => 'client',
                        'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    ]
                );

                // Create the Reservation record
                $reservation = \App\Models\Reservation::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'unit_id' => $unit->id,
                    'client_id' => $user->id,
                    'eoi_amount' => 50000.00, // Default EOI amount
                    'status' => 'confirmed',
                    'expires_at' => now()->addDays(7),
                ]);

                // Fire base ReservationConfirmed event to trigger Finance & Delivery listeners
                event(new BaseReservationConfirmed($reservation->id, $unit->id, $user->id));
            }
        );
    }

    /**
     * Determine if events and listeners should be auto-discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
