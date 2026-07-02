<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\EoiQueue;
use App\Models\Lead;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Controller: EOIQueueController
 * 
 * Project Launching & Reservation Priority Queue.
 * Uses millisecond-precision microtime(true) for fair ordering.
 * ─────────────────────────────────────────────────────────
 */
class EOIQueueController extends Controller
{
    /**
     * POST /api/v1/acquisition/eoi/submit
     * Submit an Expression of Interest entry into the priority queue.
     */
    public function submit(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id'    => 'required|uuid|exists:leads,id',
            'project_id' => 'required|uuid',
            'eoi_amount' => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string|max:1000',
        ]);

        // Check for duplicate EOI for same lead + project
        $existing = EoiQueue::where('lead_id', $fields['lead_id'])
            ->where('project_id', $fields['project_id'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active EOI for this project.',
                'data'    => $existing,
            ], 409);
        }

        // Use database transaction for atomicity
        $entry = DB::transaction(function () use ($fields) {
            // Capture precise timestamp for fair queue ordering
            $priorityScore = microtime(true);

            // Determine queue position for this project
            $queueNumber = EoiQueue::where('project_id', $fields['project_id'])->count() + 1;

            return EoiQueue::create([
                'id'             => (string) Str::uuid(),
                'lead_id'        => $fields['lead_id'],
                'project_id'     => $fields['project_id'],
                'queue_number'   => $queueNumber,
                'priority_score' => $priorityScore,
                'status'         => EoiQueue::STATUS_PENDING,
                'eoi_amount'     => $fields['eoi_amount'] ?? 0,
                'notes'          => $fields['notes'] ?? null,
            ]);
        });

        AuditLogService::log('EOI_SUBMIT', $request->user()?->id, [
            'eoi_id'       => $entry->id,
            'lead_id'      => $entry->lead_id,
            'project_id'   => $entry->project_id,
            'queue_number' => $entry->queue_number,
        ]);

        return response()->json([
            'success'      => true,
            'message'      => "EOI registered successfully. Your queue number is #{$entry->queue_number}.",
            'data'         => $entry,
            'queue_number' => $entry->queue_number,
        ], 201);
    }

    /**
     * GET /api/v1/acquisition/eoi/queue/{projectId}
     * Retrieve the ordered priority queue for a specific project.
     */
    public function getQueue(Request $request, string $projectId): JsonResponse
    {
        $queue = EoiQueue::forProject($projectId)
            ->ordered()
            ->with('lead:id,first_name,last_name,phone,email')
            ->paginate($request->input('per_page', 50));

        return response()->json([
            'success'    => true,
            'project_id' => $projectId,
            'data'       => $queue,
        ]);
    }

    /**
     * PUT /api/v1/acquisition/eoi/{id}/confirm
     * Confirm an EOI entry (admin action).
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $entry = EoiQueue::findOrFail($id);

        if ($entry->status !== EoiQueue::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => "Cannot confirm EOI with status '{$entry->status}'.",
            ], 422);
        }

        $entry->update(['status' => EoiQueue::STATUS_CONFIRMED]);

        AuditLogService::log('EOI_CONFIRM', $request->user()?->id, [
            'eoi_id'  => $entry->id,
            'lead_id' => $entry->lead_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'EOI confirmed successfully.',
            'data'    => $entry->fresh(),
        ]);
    }

    /**
     * PUT /api/v1/acquisition/eoi/{id}/cancel
     * Cancel an EOI entry.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $entry = EoiQueue::findOrFail($id);

        if (!in_array($entry->status, [EoiQueue::STATUS_PENDING, EoiQueue::STATUS_CONFIRMED])) {
            return response()->json([
                'success' => false,
                'message' => "Cannot cancel EOI with status '{$entry->status}'.",
            ], 422);
        }

        $entry->update(['status' => EoiQueue::STATUS_CANCELLED]);

        return response()->json([
            'success' => true,
            'message' => 'EOI cancelled.',
            'data'    => $entry->fresh(),
        ]);
    }
}
