<?php

namespace App\Services\Acquisition;

use App\Models\Lead;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Service: IdentityResolutionService
 *
 * Canonical customer identity resolution. Priority:
 *   1. Mobile Number
 *   2. National ID
 *   3. Email
 *
 * Guarantees we never create duplicate customers: if any
 * higher-or-equal priority identifier matches an existing
 * lead, that lead is returned instead of a new one.
 * ─────────────────────────────────────────────────────────
 */
class IdentityResolutionService
{
    /**
     * Resolve an existing lead from identifiers, honoring priority.
     *
     * @return Lead|null  The matched lead, or null if none exists.
     */
    public function resolve(?string $phone, ?string $nationalId = null, ?string $email = null): ?Lead
    {
        // 1. Mobile number (highest priority)
        if ($phone) {
            $byPhone = Lead::where('phone', $this->normalizePhone($phone))->first();
            if ($byPhone) {
                return $byPhone;
            }
        }

        // 2. National ID
        if ($nationalId) {
            $byNid = Lead::where('national_id', trim($nationalId))->first();
            if ($byNid) {
                return $byNid;
            }
        }

        // 3. Email
        if ($email) {
            $byEmail = Lead::whereRaw('LOWER(email) = ?', [strtolower(trim($email))])->first();
            if ($byEmail) {
                return $byEmail;
            }
        }

        return null;
    }

    /**
     * Find-or-create a lead by canonical identity. Existing leads are
     * never duplicated and their owned/attribution state is preserved.
     *
     * @param array $attributes  Extra fields applied ONLY when creating.
     * @return array{lead: Lead, created: bool}
     */
    public function findOrCreate(
        ?string $phone,
        ?string $nationalId,
        ?string $email,
        array $attributes = []
    ): array {
        $existing = $this->resolve($phone, $nationalId, $email);
        if ($existing) {
            // Backfill missing identifiers without overwriting existing ones.
            $patch = [];
            if (!$existing->national_id && $nationalId) {
                $patch['national_id'] = trim($nationalId);
            }
            if (!$existing->email && $email) {
                $patch['email'] = strtolower(trim($email));
            }
            if (!empty($patch)) {
                $existing->fill($patch)->save();
            }

            return ['lead' => $existing, 'created' => false];
        }

        $lead = Lead::create(array_merge([
            'first_name' => $attributes['first_name'] ?? 'Unknown',
            'last_name'  => $attributes['last_name'] ?? '',
            'phone'      => $this->normalizePhone($phone ?? ''),
            'national_id'=> $nationalId ? trim($nationalId) : null,
            'email'      => $email ? strtolower(trim($email)) : null,
            'status'     => Lead::STATUS_NEW,
        ], $attributes));

        return ['lead' => $lead, 'created' => true];
    }

    /**
     * Normalize a phone number for stable matching (strip spaces/dashes).
     */
    public function normalizePhone(string $phone): string
    {
        $clean = preg_replace('/[\s\-\(\)]/', '', $phone);
        return $clean ?? $phone;
    }
}
