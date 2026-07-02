<?php

namespace App\Services;

use App\Models\User;
use App\Models\Lead;
use App\Models\Interaction;
use App\Models\CallLog;
use App\Models\Reservation;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\MaintenanceTicket;
use App\Models\Document;
use App\Models\CollectionsQueue;
use App\Models\LegalCase;
use Illuminate\Support\Facades\DB;

class Customer360Service
{
    public function getCustomerProfile(string $id, string $type = 'lead')
    {
        $lead = null;
        $client = null;

        if ($type === 'lead') {
            $lead = Lead::with(['campaign', 'broker'])->findOrFail($id);
            // Try to find registered client user
            $client = User::where('email', $lead->email)
                ->orWhere('phone', $lead->phone)
                ->first();
        } else {
            $client = User::findOrFail($id);
            // Try to find matching lead
            $lead = Lead::with(['campaign', 'broker'])
                ->where('email', $client->email)
                ->orWhere('phone', $client->phone)
                ->first();
        }

        $email = $lead ? $lead->email : ($client ? $client->email : null);
        $phone = $lead ? $lead->phone : ($client ? $client->phone : null);
        $leadId = $lead ? $lead->id : null;
        $clientId = $client ? $client->id : null;

        // 1. Interactions (own logs)
        $interactions = collect();
        if ($leadId) {
            $interactions = Interaction::with('logger')
                ->where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 2. VoIP Calls
        $calls = collect();
        if ($leadId) {
            $calls = CallLog::where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 3. Reservations
        $reservations = collect();
        if ($leadId) {
            $reservations = Reservation::with('unit.project')
                ->where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 4. Contracts, Payment plans, and Payments
        $contracts = collect();
        if ($clientId) {
            $contracts = Contract::with(['unit.project', 'paymentPlan', 'payments' => function ($q) {
                    $q->orderBy('due_date', 'asc');
                }])
                ->where('client_id', $clientId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 5. Maintenance tickets
        $maintenance = collect();
        if ($clientId) {
            $maintenance = MaintenanceTicket::with('unit.project')
                ->where('client_id', $clientId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 6. Documents Vault
        $documents = collect();
        if ($clientId || $leadId) {
            $documents = Document::where(function ($q) use ($clientId, $leadId) {
                if ($clientId) $q->where('client_id', $clientId);
                if ($leadId) $q->orWhere('lead_id', $leadId);
            })
            ->orderBy('created_at', 'desc')
            ->get();
        }

        // 7. Debt Collections Queue
        $collections = collect();
        if ($clientId) {
            $collections = CollectionsQueue::where('client_id', $clientId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // 8. Legal Cases
        $legalCases = collect();
        if ($email || $phone) {
            $legalCases = LegalCase::whereHas('parties', function ($partyQ) use ($email, $phone) {
                $partyQ->where('email', $email)
                       ->orWhere('phone', $phone);
            })
            ->orWhere(function ($q) use ($clientId) {
                if ($clientId) {
                    $q->where('entity_type', 'App\\Models\\Contract')
                      ->whereIn('entity_id', function ($sub) use ($clientId) {
                          $sub->select('id')->from('contracts')->where('client_id', $clientId);
                      });
                }
            })
            ->orderBy('opened_at', 'desc')
            ->get();
        }

        return [
            'lead' => $lead,
            'client' => $client,
            'interactions' => $interactions,
            'calls' => $calls,
            'reservations' => $reservations,
            'contracts' => $contracts,
            'maintenance' => $maintenance,
            'documents' => $documents,
            'collections' => $collections,
            'legal_cases' => $legalCases,
        ];
    }

    /**
     * Search lead & client directory to fetch autocomplete list.
     */
    public function searchDirectory(string $search)
    {
        $leads = Lead::where('first_name', 'like', "%{$search}%")
            ->orWhere('last_name', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%")
            ->limit(10)
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'name' => "{$l->first_name} {$l->last_name}",
                'email' => $l->email,
                'phone' => $l->phone,
                'type' => 'lead',
                'description' => "Lead - Score: {$l->lead_score}"
            ]);

        $users = User::where('role', 'client')
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->limit(10)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'type' => 'client',
                'description' => "Registered Client"
            ]);

        return $leads->merge($users)->unique('phone')->values();
    }
}
