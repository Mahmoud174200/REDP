<?php

namespace App\Listeners\Acquisition;

use App\Events\ContractSigned;
use App\Models\Lead;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Listener: HandleContractSigned
 *
 * Consumes Finance domain's ContractSigned event.
 * Automatically advances the CRM pipeline deal stage to 'contracted'.
 * ─────────────────────────────────────────────────────────
 */
class HandleContractSigned implements ShouldQueue
{
    public function handle(ContractSigned $event): void
    {
        Log::info('[Acquisition] Handling ContractSigned event', [
            'contract_id' => $event->contractId ?? null,
        ]);

        // Advance the lead to 'contracted' (Closed-Won) stage in CRM pipeline
        if (isset($event->clientId)) {
            $lead = Lead::where('id', $event->clientId)->first();

            if ($lead && $lead->status !== Lead::STATUS_CONTRACTED) {
                $previousStatus = $lead->status;
                $lead->update(['status' => Lead::STATUS_CONTRACTED]);

                Log::info('[Acquisition] Lead advanced to contracted (Closed-Won)', [
                    'lead_id'         => $lead->id,
                    'previous_status' => $previousStatus,
                    'new_status'      => Lead::STATUS_CONTRACTED,
                ]);
            }
        }
    }
}
