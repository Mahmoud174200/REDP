<?php

namespace App\Listeners\Acquisition;

use App\Events\ContractSigned;
use App\Models\Lead;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\AuditLogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Listener: HandleContractSigned
 *
 * Consumes Finance domain's ContractSigned event.
 * Automatically advances the CRM pipeline deal stage to 'contracted'.
 * Also generates credentials for the customer portal and dispatches them.
 * ─────────────────────────────────────────────────────────
 */
class HandleContractSigned implements ShouldQueue
{
    public function handle(ContractSigned $event): void
    {
        Log::info('[Acquisition] Handling ContractSigned event', [
            'contract_id' => $event->contractId ?? null,
            'client_id' => $event->clientId ?? null,
        ]);

        $client = null;
        $lead = null;

        if (isset($event->clientId)) {
            // Find user first
            $client = User::find($event->clientId);
            
            // Find associated lead
            $lead = Lead::where('id', $event->clientId)->first();
            if (!$lead && $client) {
                if ($client->email) {
                    $lead = Lead::where('email', $client->email)->first();
                }
                if (!$lead && $client->phone) {
                    $lead = Lead::where('phone', $client->phone)->first();
                }
            }

            // Advance the lead to 'contracted' (Closed-Won) stage in CRM pipeline
            if ($lead && $lead->status !== Lead::STATUS_CONTRACTED) {
                $previousStatus = $lead->status;
                $lead->update(['status' => Lead::STATUS_CONTRACTED]);

                Log::info('[Acquisition] Lead advanced to contracted (Closed-Won)', [
                    'lead_id'         => $lead->id,
                    'previous_status' => $previousStatus,
                    'new_status'      => Lead::STATUS_CONTRACTED,
                ]);

                // ── Lead Attribution System: contract_signed funnel event ──
                try {
                    app(\App\Services\Acquisition\AttributionService::class)->recordEvent(
                        \App\Models\CustomerEvent::CONTRACT_SIGNED, $lead, null, $lead->anon_id,
                        ['contract_id' => $event->contractId ?? null]
                    );
                } catch (\Throwable $attrEx) {
                    Log::warning('[Attribution] contract_signed event failed: ' . $attrEx->getMessage());
                }
            }

            // Generate credentials and send them if the client user is found
            if ($client && $client->role === 'client') {
                // Generate a random 8-character plain-text password
                $plainPassword = Str::random(8);
                
                // Hash and update the client's password
                $client->update([
                    'password' => Hash::make($plainPassword),
                ]);

                Log::info('[Acquisition] Generated new portal password for client', [
                    'client_id' => $client->id,
                    'email'     => $client->email,
                ]);

                // Prepare notification content
                $title = "Welcome to your REDP Customer Portal!";
                $content = "Dear {$client->name},\n\n" .
                           "Your contract has been officially signed! Your Customer Portal account is now ready.\n\n" .
                           "Here are your login credentials:\n" .
                           "Username (Email): {$client->email}\n" .
                           "Password: {$plainPassword}\n\n" .
                           "You can log in to view your Dashboard, Unit Details, Contract, Installment Schedule, outstanding payments, and more.\n\n" .
                           "Best regards,\nREDP Team";

                // Dispatch Email Notification
                NotificationService::send(
                    $client->id,
                    'email',
                    $client->email,
                    $title,
                    $content
                );

                // Dispatch SMS Notification (if phone exists)
                if ($client->phone) {
                    NotificationService::send(
                        $client->id,
                        'sms',
                        $client->phone,
                        "REDP Portal Credentials",
                        "Your REDP contract is signed! Portal Username: {$client->email} | Password: {$plainPassword}"
                    );
                }

                // Log audit trail
                AuditLogService::log(
                    'PORTAL_CREDENTIALS_SENT',
                    $client->id,
                    [
                        'email' => $client->email,
                        'contract_id' => $event->contractId,
                    ]
                );
            }
        }
    }
}

