<?php

namespace App\Listeners;

use App\Events\ReservationConfirmed;
use App\Events\PaymentReceived;
use App\Events\ContractSigned;
// Simulating Cancellation processed event internally or locally
use App\Models\Appointment;
use App\Models\Document;
use App\Models\Notification;
use App\Models\MaintenanceTicket;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class DeliveryEventListener
{
    /**
     * Handle ReservationConfirmed Event.
     * Triggered by: Ragab (Acquisition)
     * Action: Mahmoud's engine schedules an initial handover QC inspection appointment.
     */
    public function handleReservationConfirmed(ReservationConfirmed $event): void
    {
        Log::info("DeliveryEventListener: Consuming ReservationConfirmed for reservation " . $event->reservationId);

        Appointment::create([
            'id' => (string) Str::uuid(),
            'user_id' => $event->clientId,
            'type' => 'QC_Inspection',
            'scheduled_at' => now()->addDays(5), // Schedule inspection 5 days out
            'status' => 'pending'
        ]);

        AuditLogService::log(
            'HANDOVER_AUTO_SCHEDULE', 
            $event->clientId, 
            ['reservation_id' => $event->reservationId, 'unit_id' => $event->unitId]
        );
    }

    /**
     * Handle ContractSigned Event.
     * Triggered by: Melwany (Finance)
     * Action: Mahmoud's engine creates physical handover planning timelines in DMS documents.
     */
    public function handleContractSigned(ContractSigned $event): void
    {
        Log::info("DeliveryEventListener: Consuming ContractSigned for contract " . $event->contractId);

        Document::create([
            'id' => (string) Str::uuid(),
            'title' => 'Handover_Timeline_' . $event->contractId . '.pdf',
            'file_path' => '/vault/handover/timelines/' . $event->contractId . '.pdf',
            'ocr_content' => 'REDP Platform Smart Timeline. Contract: ' . $event->contractId . '. Client: ' . $event->clientId . '. Physical inspection, key handovers, quality sign-offs scheduling milestones.',
            'status' => 'indexed'
        ]);

        AuditLogService::log(
            'HANDOVER_TIMELINE_GENERATE', 
            $event->clientId, 
            ['contract_id' => $event->contractId]
        );
    }

    /**
     * Handle PaymentReceived Event.
     * Triggered by: Melwany (Finance)
     * Action: Mahmoud's engine sends push notifications/SMS alerts confirming receipt.
     */
    public function handlePaymentReceived(PaymentReceived $event): void
    {
        Log::info("DeliveryEventListener: Consuming PaymentReceived for payment " . $event->paymentId);

        NotificationService::send(
            $event->clientId,
            'push',
            'client_device_token_stub',
            'Payment Received! 🎉',
            'Thank you! Your payment of ' . number_format($event->amount, 2) . ' EGP has been successfully processed.'
        );

        NotificationService::send(
            $event->clientId,
            'sms',
            'client_phone_stub',
            'REDP Billing Alert',
            'Payment Confirmed: Received ' . number_format($event->amount, 2) . ' EGP. Receipt ID: ' . $event->paymentId
        );
    }

    /**
     * Handle simulated Contract Cancellation Event.
     * Triggered by: Melwany (Finance)
     * Action: Mahmoud's engine automatically terminates active maintenance tickets for cancelled properties.
     */
    public function handleCancellationProcessed(string $contractId, string $clientId): void
    {
        Log::info("DeliveryEventListener: Consuming CancellationProcessed for contract " . $contractId);

        // Find active maintenance tickets for this client & mark as closed/cancelled
        $tickets = MaintenanceTicket::where('client_id', $clientId)
            ->whereIn('status', ['open', 'assigned'])
            ->get();

        foreach ($tickets as $ticket) {
            $ticket->update(['status' => 'closed']);
            AuditLogService::log(
                'MAINTENANCE_TICKET_AUTO_CLOSE',
                $clientId,
                ['ticket_id' => $ticket->id, 'reason' => 'Contract cancellation processed']
            );
        }
    }
}
