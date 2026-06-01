<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Interaction;
use App\Services\Acquisition\LeadAssignmentService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Controller: CrmPipelineController
 * Blueprint Section: H.9 — CRM Kanban Board
 *
 * Endpoints for:
 * - Leads grouped by status (Kanban columns)
 * - Status updates (drag-and-drop)
 * - Round-Robin assignment
 * - Interaction logging
 * ─────────────────────────────────────────────────────────
 */
class CrmPipelineController extends Controller
{
    private LeadAssignmentService $assignmentService;

    public function __construct(LeadAssignmentService $assignmentService)
    {
        $this->assignmentService = $assignmentService;
    }

    /**
     * GET /api/v1/acquisition/crm/pipeline
     * Retrieve leads grouped by status for Kanban board display.
     */
    public function pipeline(Request $request): JsonResponse
    {
        $stages = Lead::STATUSES;
        $pipeline = [];

        foreach ($stages as $status) {
            $query = Lead::byStatus($status)
                ->with(['agent:id,name', 'interactions' => fn($q) => $q->latest()->limit(1)]);

            // Filter by assigned agent if not admin
            if ($request->user() && $request->user()->role === 'sales_agent') {
                $query->assignedTo($request->user()->id);
            }

            $pipeline[$status] = [
                'stage' => $status,
                'label' => $this->getStageLabel($status),
                'color' => $this->getStageColor($status),
                'count' => $query->count(),
                'leads' => $query->orderBy('lead_score', 'desc')
                                 ->limit(50)
                                 ->get()
                                 ->map(function ($lead) {
                                     return [
                                         'id'                => $lead->id,
                                         'full_name'         => $lead->full_name,
                                         'email'             => $lead->email,
                                         'phone'             => $lead->phone,
                                         'lead_score'        => $lead->lead_score,
                                         'source'            => $lead->source,
                                         'kyc_status'        => $lead->kyc_status,
                                         'assigned_agent'    => $lead->agent ? [
                                             'id'   => $lead->agent->id,
                                             'name' => $lead->agent->name ?? 'N/A',
                                         ] : null,
                                         'last_interaction'  => $lead->interactions->first()?->only(['type', 'notes', 'created_at']),
                                         'created_at'        => $lead->created_at?->toIso8601String(),
                                     ];
                                 }),
            ];
        }

        return response()->json([
            'success'  => true,
            'pipeline' => $pipeline,
            'workload' => $this->assignmentService->getWorkloadMetrics(),
        ]);
    }

    /**
     * PUT /api/v1/acquisition/crm/move
     * Move a lead between pipeline stages (Kanban drag-and-drop).
     */
    public function moveStage(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id' => 'required|uuid|exists:leads,id',
            'status'  => 'required|string|in:' . implode(',', Lead::STATUSES),
            'unit_id' => 'nullable|uuid',
        ]);

        $lead = Lead::findOrFail($fields['lead_id']);
        $previousStatus = $lead->status;

        // Validate reservation requires unit_id
        if ($fields['status'] === Lead::STATUS_RESERVED && empty($fields['unit_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'unit_id is required when moving to reserved status.',
            ], 422);
        }

        $lead->update(['status' => $fields['status']]);

        // Fire event if moving to reserved
        if ($fields['status'] === Lead::STATUS_RESERVED && $previousStatus !== Lead::STATUS_RESERVED) {
            \App\Events\Acquisition\ReservationConfirmed::dispatch($lead->id, $fields['unit_id']);
        }

        AuditLogService::log('CRM_STAGE_MOVE', $request->user()?->id, [
            'lead_id' => $lead->id,
            'from'    => $previousStatus,
            'to'      => $fields['status'],
        ]);

        return response()->json([
            'success'  => true,
            'message'  => "Lead moved from '{$previousStatus}' to '{$fields['status']}'.",
            'data'     => $lead->fresh()->load('agent'),
        ]);
    }

    /**
     * POST /api/v1/acquisition/crm/assign
     * Manually assign or reassign a lead to a sales agent.
     */
    public function assign(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id'  => 'required|uuid|exists:leads,id',
            'agent_id' => 'required|uuid|exists:users,id',
        ]);

        $lead = Lead::findOrFail($fields['lead_id']);
        $success = $this->assignmentService->reassignLead($lead, $fields['agent_id']);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid agent or agent does not have sales_agent role.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead reassigned successfully.',
            'data'    => $lead->fresh()->load('agent'),
        ]);
    }

    /**
     * POST /api/v1/acquisition/crm/interactions
     * Log an interaction (call, meeting, whatsapp, email) for a lead.
     */
    public function logInteraction(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id'        => 'required|uuid|exists:leads,id',
            'type'           => 'required|string|in:call,whatsapp,meeting,email',
            'notes'          => 'nullable|string|max:5000',
            'follow_up_date' => 'nullable|date|after:now',
        ]);

        $interaction = Interaction::create([
            'lead_id'        => $fields['lead_id'],
            'type'           => $fields['type'],
            'notes'          => $fields['notes'] ?? null,
            'follow_up_date' => $fields['follow_up_date'] ?? null,
            'logged_by'      => $request->user()->id,
        ]);

        // Auto-advance lead from 'new' to 'contacted' on first interaction
        $lead = Lead::find($fields['lead_id']);
        if ($lead && $lead->status === Lead::STATUS_NEW) {
            $lead->update(['status' => Lead::STATUS_CONTACTED]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Interaction logged successfully.',
            'data'    => $interaction->load('logger'),
        ], 201);
    }

    /**
     * GET /api/v1/acquisition/crm/stats
     * Pipeline statistics summary.
     */
    public function stats(): JsonResponse
    {
        $stats = [];
        foreach (Lead::STATUSES as $status) {
            $stats[$status] = Lead::byStatus($status)->count();
        }

        return response()->json([
            'success'        => true,
            'stage_counts'   => $stats,
            'total_leads'    => Lead::count(),
            'unassigned'     => Lead::unassigned()->count(),
            'kyc_verified'   => Lead::kycVerified()->count(),
        ]);
    }

    // ── Private Helpers ──

    private function getStageLabel(string $status): string
    {
        return match ($status) {
            'new'             => 'New Leads',
            'contacted'       => 'Contacted',
            'interested'      => 'Interested',
            'visit_scheduled' => 'Visit Scheduled',
            'negotiation'     => 'Negotiation',
            'reserved'        => 'Reserved',
            'contracted'      => 'Contracted',
            default           => ucfirst($status),
        };
    }

    private function getStageColor(string $status): string
    {
        return match ($status) {
            'new'             => '#3B82F6',
            'contacted'       => '#8B5CF6',
            'interested'      => '#F59E0B',
            'visit_scheduled' => '#06B6D4',
            'negotiation'     => '#F97316',
            'reserved'        => '#10B981',
            'contracted'      => '#6366F1',
            default           => '#64748B',
        };
    }
}
