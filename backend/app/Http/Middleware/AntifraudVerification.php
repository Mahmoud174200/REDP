<?php

namespace App\Http\Middleware;

use App\Models\Lead;
use App\Models\LeadLock;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Middleware: AntifraudVerification (R.1)
 *
 * Security middleware that checks for:
 * 1. Duplicate identity registrations (matching National ID
 *    or phone across active leads).
 * 2. Unauthorized broker lead claiming (rejecting broker
 *    registration if client already has an active organic lead).
 * ─────────────────────────────────────────────────────────
 */
class AntifraudVerification
{
    public function handle(Request $request, Closure $next): Response
    {
        $phone      = $request->input('phone');
        $nationalId = $request->input('national_id');
        $brokerId   = $request->input('broker_id');

        // ── Check 1: Duplicate Identity Registration ──
        if ($phone || $nationalId) {
            $duplicateQuery = Lead::query();

            $duplicateQuery->where(function ($q) use ($phone, $nationalId) {
                if ($phone) {
                    $q->where('phone', $phone);
                }
                if ($nationalId) {
                    $q->orWhere('national_id', $nationalId);
                }
            });

            $existingLead = $duplicateQuery->first();

            if ($existingLead) {
                // Allow updates to the same lead
                $routeLeadId = $request->route('id') ?? $request->route('leadId');
                if ($routeLeadId && $routeLeadId === $existingLead->id) {
                    return $next($request);
                }

                Log::warning('[Antifraud] Duplicate identity registration detected', [
                    'phone'       => $phone,
                    'national_id' => $nationalId,
                    'existing_lead_id' => $existingLead->id,
                    'ip_address'  => $request->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'error'   => 'DUPLICATE_IDENTITY',
                    'message' => 'A lead with this phone number or National ID already exists in the system.',
                    'existing_lead_status' => $existingLead->status,
                ], 409);
            }
        }

        // ── Check 2: Unauthorized Broker Lead Claiming ──
        if ($brokerId && $phone) {
            // Check if an organic (non-broker) lead already exists
            $organicLead = Lead::whereNull('broker_id')
                ->where(function ($q) use ($phone, $nationalId) {
                    $q->where('phone', $phone);
                    if ($nationalId) {
                        $q->orWhere('national_id', $nationalId);
                    }
                })
                ->first();

            if ($organicLead) {
                Log::warning('[Antifraud] Broker attempting to claim organic lead', [
                    'broker_id'       => $brokerId,
                    'phone'           => $phone,
                    'organic_lead_id' => $organicLead->id,
                    'ip_address'      => $request->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'error'   => 'ORGANIC_LEAD_EXISTS',
                    'message' => 'This client already has an active organic lead record. Broker registration is rejected.',
                ], 403);
            }

            // Check if lead is already locked by another broker
            $existingLock = LeadLock::active()
                ->where('phone', $phone)
                ->where('broker_id', '!=', $brokerId)
                ->first();

            if ($existingLock) {
                Log::warning('[Antifraud] Lead already locked by another broker', [
                    'requesting_broker' => $brokerId,
                    'locking_broker'    => $existingLock->broker_id,
                    'phone'             => $phone,
                    'locked_until'      => $existingLock->locked_until,
                ]);

                return response()->json([
                    'success' => false,
                    'error'   => 'LEAD_LOCKED',
                    'message' => 'This lead is already locked by another broker.',
                    'locked_until' => $existingLock->locked_until->toDateString(),
                ], 409);
            }
        }

        return $next($request);
    }
}
