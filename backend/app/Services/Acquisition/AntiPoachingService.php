<?php

namespace App\Services\Acquisition;

use App\Models\Lead;
use App\Models\LeadLock;
use App\Models\Broker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Service: AntiPoachingService
 *
 * Enforces broker anti-poaching rules:
 * - Duplicate identity detection (National ID / phone)
 * - 90-day exclusive lead lock via broker referral
 * - Rejection of broker claims on existing organic leads
 * ─────────────────────────────────────────────────────────
 */
class AntiPoachingService
{
    /**
     * Check if a lead with the given identifiers already exists
     * and is locked by another broker.
     *
     * @return array{locked: bool, lock: ?LeadLock, message: string}
     */
    public function checkLeadLock(string $phone, ?string $nationalId = null): array
    {
        $query = LeadLock::active()
            ->where(function ($q) use ($phone, $nationalId) {
                $q->where('phone', $phone);
                if ($nationalId) {
                    $q->orWhere('national_id', $nationalId);
                }
            });

        $existingLock = $query->first();

        if ($existingLock) {
            return [
                'locked'  => true,
                'lock'    => $existingLock,
                'message' => "This lead is already locked by broker {$existingLock->broker_id} until {$existingLock->locked_until->toDateString()}.",
            ];
        }

        return [
            'locked'  => false,
            'lock'    => null,
            'message' => 'Lead is available for registration.',
        ];
    }

    /**
     * Check if an organic (non-broker) lead already exists with
     * matching phone or national ID. Brokers cannot claim leads
     * that were already registered organically.
     *
     * @return array{exists: bool, lead: ?Lead, message: string}
     */
    public function checkOrganicLeadExists(string $phone, ?string $nationalId = null): array
    {
        $query = Lead::whereNull('broker_id')
            ->where(function ($q) use ($phone, $nationalId) {
                $q->where('phone', $phone);
                if ($nationalId) {
                    $q->orWhere('national_id', $nationalId);
                }
            });

        $existingLead = $query->first();

        if ($existingLead) {
            return [
                'exists'  => true,
                'lead'    => $existingLead,
                'message' => 'Rejected: This client already has an active organic lead record. Broker registration is not allowed.',
            ];
        }

        return [
            'exists'  => false,
            'lead'    => null,
            'message' => 'No organic lead conflict found.',
        ];
    }

    /**
     * Register a lead under a broker with a 90-day exclusive lock.
     * Uses database transactions to prevent race conditions.
     *
     * @throws \Exception If lead is already locked or exists organically.
     */
    public function registerBrokerLead(
        Broker $broker,
        string $phone,
        ?string $nationalId,
        array $leadData
    ): array {
        return DB::transaction(function () use ($broker, $phone, $nationalId, $leadData) {

            // Step 1: Check for existing active lock
            $lockCheck = $this->checkLeadLock($phone, $nationalId);
            if ($lockCheck['locked']) {
                throw new \Exception($lockCheck['message']);
            }

            // Step 2: Check for organic lead conflict
            $organicCheck = $this->checkOrganicLeadExists($phone, $nationalId);
            if ($organicCheck['exists']) {
                throw new \Exception($organicCheck['message']);
            }

            // Step 3: Create the lead record
            $lead = Lead::create(array_merge($leadData, [
                'phone'       => $phone,
                'national_id' => $nationalId,
                'broker_id'   => $broker->id,
                'source'      => 'broker',
                'status'      => Lead::STATUS_NEW,
            ]));

            // Step 4: Create the 90-day lock
            $lock = LeadLock::create([
                'broker_id'    => $broker->id,
                'lead_id'      => $lead->id,
                'phone'        => $phone,
                'national_id'  => $nationalId,
                'locked_until' => now()->addDays(LeadLock::LOCK_DURATION_DAYS),
                'status'       => LeadLock::STATUS_ACTIVE,
            ]);

            Log::info('[AntiPoaching] Broker lead registered with lock', [
                'broker_id'    => $broker->id,
                'lead_id'      => $lead->id,
                'phone'        => $phone,
                'locked_until' => $lock->locked_until->toDateString(),
            ]);

            return [
                'lead' => $lead,
                'lock' => $lock,
            ];

        }, 3); // 3 retry attempts for deadlock handling
    }

    /**
     * Check for duplicate identity registrations across the system.
     *
     * @return array{duplicate: bool, details: array}
     */
    public function checkDuplicateIdentity(string $phone, ?string $nationalId = null): array
    {
        $duplicates = [];

        // Check phone duplicates
        $phoneMatches = Lead::where('phone', $phone)->withTrashed()->get();
        if ($phoneMatches->count() > 0) {
            $duplicates['phone_matches'] = $phoneMatches->map(fn($l) => [
                'lead_id' => $l->id,
                'name'    => $l->full_name,
                'status'  => $l->status,
                'deleted' => $l->trashed(),
            ])->toArray();
        }

        // Check national ID duplicates
        if ($nationalId) {
            $nidMatches = Lead::where('national_id', $nationalId)->withTrashed()->get();
            if ($nidMatches->count() > 0) {
                $duplicates['national_id_matches'] = $nidMatches->map(fn($l) => [
                    'lead_id' => $l->id,
                    'name'    => $l->full_name,
                    'status'  => $l->status,
                    'deleted' => $l->trashed(),
                ])->toArray();
            }
        }

        return [
            'duplicate' => !empty($duplicates),
            'details'   => $duplicates,
        ];
    }
}
