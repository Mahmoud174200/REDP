<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\Acquisition\OwnershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Controller: OwnershipController  (PROTECTED)
 *
 * Admin-only lead ownership transfer + read endpoints:
 *  - POST /v1/acquisition/leads/{id}/transfer-ownership
 *  - GET  /v1/acquisition/leads/{id}/ownership-history
 *  - GET  /v1/acquisition/leads/{id}/timeline
 *  - GET  /v1/acquisition/leads/{id}/attribution
 * ─────────────────────────────────────────────────────────
 */
class OwnershipController extends Controller
{
    public function __construct(private OwnershipService $ownership) {}

    /**
     * POST /v1/acquisition/leads/{id}/transfer-ownership
     * Admin transfers a (possibly locked) lead to a new owner.
     */
    public function transfer(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !method_exists($user, 'isAdmin') || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can transfer lead ownership.',
            ], 403);
        }

        $fields = $request->validate([
            'to_owner_type' => 'required|string|in:broker,agent,direct',
            'to_owner_id'   => 'nullable|string',
            'reason'        => 'required|string|min:3|max:1000',
        ]);

        $lead = Lead::findOrFail($id);

        try {
            $transfer = $this->ownership->transfer(
                $lead,
                $fields['to_owner_type'],
                $fields['to_owner_id'] ?? null,
                $fields['reason'],
                $user->id
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ownership transferred successfully.',
            'data'    => $transfer,
        ]);
    }

    /**
     * GET /v1/acquisition/leads/{id}/ownership-history
     */
    public function history(Request $request, string $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);
        $history = $lead->ownershipTransfers()
            ->with('admin:id,name,email')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'current_owner' => [
                    'type'      => $lead->owner_type,
                    'id'        => $lead->owner_id,
                    'locked_at' => $lead->ownership_locked_at,
                ],
                'transfers' => $history,
            ],
        ]);
    }

    /**
     * GET /v1/acquisition/leads/{id}/attribution
     * First / last / all touches.
     */
    public function attribution(Request $request, string $id): JsonResponse
    {
        $lead = Lead::with(['originalSource', 'currentSource'])->findOrFail($id);
        $touches = $lead->attributions()->with('broker:id,agency_name')->orderBy('occurred_at')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'first_touch'     => $touches->firstWhere('touch_type', 'first') ?? $touches->first(),
                'last_touch'      => $touches->firstWhere('touch_type', 'last') ?? $touches->last(),
                'original_source' => $lead->originalSource,
                'current_source'  => $lead->currentSource,
                'touch_count'     => $touches->count(),
                'touches'         => $touches,
            ],
        ]);
    }

    /**
     * GET /v1/acquisition/leads/{id}/timeline
     * Unified chronological timeline: attribution touches + funnel events
     * + journey logs. (Read model for the lead-detail drawer.)
     */
    public function timeline(Request $request, string $id): JsonResponse
    {
        $lead = Lead::findOrFail($id);

        $touches = $lead->attributions()->orderBy('occurred_at')->get()
            ->map(fn ($t) => [
                'kind'       => 'attribution',
                'label'      => $t->touch_type . ' touch — ' . $t->source_key,
                'broker_id'  => $t->broker_id,
                'occurred_at'=> $t->occurred_at,
                'meta'       => $t->only(['utm_source', 'utm_medium', 'utm_campaign', 'promo_code']),
            ]);

        $events = $lead->events()->orderBy('occurred_at')->get()
            ->map(fn ($e) => [
                'kind'        => 'event',
                'label'       => $e->event_type,
                'occurred_at' => $e->occurred_at,
                'meta'        => $e->properties,
            ]);

        $journey = $lead->journeyLogs()->orderBy('created_at')->get()
            ->map(fn ($j) => [
                'kind'        => 'journey',
                'label'       => $j->stage,
                'actor'       => $j->actor_role,
                'occurred_at' => $j->created_at,
                'meta'        => $j->metadata,
            ]);

        $timeline = $touches->concat($events)->concat($journey)
            ->sortBy('occurred_at')->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'lead'     => $lead->only(['id', 'first_name', 'last_name', 'phone', 'owner_type', 'owner_id', 'ownership_locked_at', 'status']),
                'timeline' => $timeline,
            ],
        ]);
    }
}
