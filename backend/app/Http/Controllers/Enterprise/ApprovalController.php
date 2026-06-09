<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\ApprovalInstance;
use App\Models\ApprovalAction;
use App\Services\ApprovalEngine;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    protected ApprovalEngine $engine;

    public function __construct(ApprovalEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Get inbox of pending approvals for the logged in user.
     */
    public function getInbox(Request $request)
    {
        $pending = $this->engine->getPendingApprovalsForUser($request->user());

        return response()->json([
            'success' => true,
            'data' => $pending
        ]);
    }

    /**
     * Submit an approval action (approve / reject / escalate).
     */
    public function submitDecision(Request $request, string $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject,escalate,comment',
            'comment' => 'nullable|string',
        ]);

        try {
            $instance = $this->engine->submitAction(
                $id,
                $request->user(),
                $validated['action'],
                $validated['comment'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Decision submitted successfully',
                'data' => $instance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get past audits audit trail.
     */
    public function getHistory(Request $request)
    {
        $user = $request->user();

        $query = ApprovalAction::with(['instance.workflow', 'instance.requester', 'step', 'actor']);

        if ($user->role !== 'admin') {
            // Non-admins only see actions they performed, or workflows they requested
            $query->where(function ($q) use ($user) {
                $q->where('actor_id', $user->id)
                  ->orWhereHas('instance', function ($instQ) use ($user) {
                      $instQ->where('requested_by', $user->id);
                  });
            });
        }

        $history = $query->orderBy('acted_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    /**
     * Initiate a test workflow for development and dry-run validation.
     */
    public function initiateTestApproval(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|string',
            'entity_id' => 'required|uuid',
            'metadata' => 'nullable|array',
        ]);

        try {
            $instance = $this->engine->initiateApproval(
                $validated['entity_type'],
                $validated['entity_id'],
                $request->user(),
                $validated['metadata'] ?? []
            );

            return response()->json([
                'success' => true,
                'message' => 'Test approval initiated successfully',
                'data' => $instance
            ], 211);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
