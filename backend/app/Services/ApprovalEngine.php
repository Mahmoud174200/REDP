<?php

namespace App\Services;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Models\ApprovalInstance;
use App\Models\ApprovalAction;
use App\Models\ApprovalCondition;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApprovalEngine
{
    /**
     * Start a new approval process instance.
     */
    public function initiateApproval(string $entityType, string $entityId, User $requester, array $metadata = []): ApprovalInstance
    {
        return DB::transaction(function () use ($entityType, $entityId, $requester, $metadata) {
            // Find active workflow for this entity type
            $workflow = ApprovalWorkflow::where('entity_type', $entityType)
                ->where('is_active', true)
                ->where(function ($q) use ($requester) {
                    $q->where('company_id', $requester->company_id)
                      ->orWhereNull('company_id');
                })
                ->orderBy('company_id', 'desc') // Company-specific takes priority
                ->first();

            if (!$workflow) {
                // If no workflow is configured, it is auto-approved instantly
                $instance = ApprovalInstance::create([
                    'id' => (string) Str::uuid(),
                    'workflow_id' => (string) Str::uuid(), // Dummy ID or self-referenced
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'status' => 'approved',
                    'requested_by' => $requester->id,
                    'completed_at' => now(),
                    'metadata' => array_merge($metadata, ['info' => 'Auto-approved: no active workflow found.']),
                ]);
                
                $this->triggerCallback($instance);
                return $instance;
            }

            // Create instance
            $instance = ApprovalInstance::create([
                'id' => (string) Str::uuid(),
                'workflow_id' => $workflow->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'status' => 'pending',
                'requested_by' => $requester->id,
                'metadata' => $metadata,
            ]);

            // Advance to the first step
            $this->advanceToNextStep($instance);

            return $instance;
        });
    }

    /**
     * Submit an approval decision (approve / reject / return / escalate).
     */
    public function submitAction(string $instanceId, User $actor, string $action, ?string $comment = null): ApprovalInstance
    {
        return DB::transaction(function () use ($instanceId, $actor, $action, $comment) {
            $instance = ApprovalInstance::with(['currentStep', 'workflow'])->findOrFail($instanceId);

            if ($instance->status !== 'pending') {
                throw new \Exception("This approval instance is already {$instance->status}.");
            }

            $currentStep = $instance->currentStep;
            if (!$currentStep) {
                throw new \Exception("Approval instance has no current active step.");
            }

            // Validate that actor is authorized to approve
            if (!$this->isUserAuthorizedForStep($actor, $currentStep, $instance)) {
                throw new \Exception("User is not authorized to act on this approval step.");
            }

            // Log action
            ApprovalAction::create([
                'id' => (string) Str::uuid(),
                'instance_id' => $instance->id,
                'step_id' => $currentStep->id,
                'actor_id' => $actor->id,
                'action' => $action,
                'comment' => $comment,
                'acted_at' => now(),
            ]);

            if ($action === 'reject') {
                $instance->update([
                    'status' => 'rejected',
                    'completed_at' => now(),
                ]);
                $this->triggerCallback($instance);
                return $instance;
            }

            if ($action === 'escalate') {
                $instance->update([
                    'status' => 'escalated',
                ]);
                // Re-route to escalation target if defined
                if ($currentStep->escalation_to) {
                    // Re-route logic
                }
                return $instance;
            }

            // Check if parallel step needs more approvals
            if ($currentStep->type === 'parallel') {
                $approvalsCount = ApprovalAction::where('instance_id', $instance->id)
                    ->where('step_id', $currentStep->id)
                    ->where('action', 'approve')
                    ->count();

                if ($approvalsCount < $currentStep->required_approvals) {
                    // Still waiting for other parallel approvers
                    return $instance;
                }
            }

            // Advance to next step
            $this->advanceToNextStep($instance);

            return $instance;
        });
    }

    /**
     * Advance approval instance to the next step.
     */
    protected function advanceToNextStep(ApprovalInstance $instance): void
    {
        $workflow = $instance->workflow;
        
        $currentStepOrder = 0;
        if ($instance->current_step_id) {
            $currentStep = ApprovalStep::find($instance->current_step_id);
            if ($currentStep) {
                $currentStepOrder = $currentStep->step_order;
            }
        }

        // Find the next step
        $nextStep = ApprovalStep::where('workflow_id', $instance->workflow_id)
            ->where('step_order', '>', $currentStepOrder)
            ->orderBy('step_order', 'asc')
            ->first();

        if (!$nextStep) {
            // Workflow complete!
            $instance->update([
                'current_step_id' => null,
                'status' => 'approved',
                'completed_at' => now(),
            ]);
            $this->triggerCallback($instance);
            return;
        }

        // Check if next step should be skipped based on conditions
        if ($nextStep->type === 'conditional' && !$this->evaluateConditions($nextStep, $instance)) {
            // Skip this step and advance again
            $instance->current_step_id = $nextStep->id; // temporarily set to progress
            $this->advanceToNextStep($instance);
            return;
        }

        // Update instance to new step
        $instance->update([
            'current_step_id' => $nextStep->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Evaluate conditions of a step against the metadata and entity values.
     */
    public function evaluateConditions(ApprovalStep $step, ApprovalInstance $instance): bool
    {
        $conditions = ApprovalCondition::where('step_id', $step->id)->get();
        if ($conditions->isEmpty()) {
            return true;
        }

        $entityMetadata = $instance->metadata ?? [];

        foreach ($conditions as $cond) {
            $fieldVal = $entityMetadata[$cond->field] ?? null;
            $match = false;

            switch ($cond->operator) {
                case 'eq': $match = ($fieldVal == $cond->value); break;
                case 'neq': $match = ($fieldVal != $cond->value); break;
                case 'gt': $match = ($fieldVal > $cond->value); break;
                case 'lt': $match = ($fieldVal < $cond->value); break;
                case 'gte': $match = ($fieldVal >= $cond->value); break;
                case 'lte': $match = ($fieldVal <= $cond->value); break;
                case 'in': 
                    $arr = explode(',', $cond->value);
                    $match = in_array($fieldVal, $arr); 
                    break;
                case 'not_in': 
                    $arr = explode(',', $cond->value);
                    $match = !in_array($fieldVal, $arr); 
                    break;
                case 'contains': 
                    $match = (strpos(strval($fieldVal), $cond->value) !== false); 
                    break;
            }

            if ($cond->logic === 'or' && $match) {
                return true;
            }
            if ($cond->logic === 'and' && !$match) {
                return false;
            }
        }

        return true; // Default
    }

    /**
     * Verify if a user is authorized to act on a step.
     */
    public function isUserAuthorizedForStep(User $user, ApprovalStep $step, ApprovalInstance $instance): bool
    {
        // Admin bypass
        if ($user->role === 'admin') {
            return true;
        }

        switch ($step->approver_type) {
            case 'user':
                return ($user->id === $step->approver_id);

            case 'role':
                return DB::table('user_roles')
                    ->where('user_id', $user->id)
                    ->where('role_id', $step->approver_id)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    })
                    ->exists();

            case 'position':
                return ($user->position_id === $step->approver_id);

            case 'department_head':
                // Check if user is head of requester's department or specified department
                $requester = User::find($instance->requested_by);
                if ($requester && $requester->department_id) {
                    return DB::table('departments')
                        ->where('id', $requester->department_id)
                        ->where('head_id', $user->id)
                        ->exists();
                }
                return false;

            case 'direct_manager':
                $requester = User::find($instance->requested_by);
                if ($requester) {
                    $managerId = DB::table('employee_hierarchy')
                        ->where('user_id', $requester->id)
                        ->value('direct_manager_id');
                    return ($user->id === $managerId);
                }
                return false;
        }

        return false;
    }

    /**
     * Resolve pending approvals that a specific user can act on.
     */
    public function getPendingApprovalsForUser(User $user)
    {
        $instances = ApprovalInstance::with(['currentStep', 'workflow', 'requester'])
            ->where('status', 'pending')
            ->whereNotNull('current_step_id')
            ->get();

        return $instances->filter(function ($inst) use ($user) {
            return $this->isUserAuthorizedForStep($user, $inst->currentStep, $inst);
        })->values();
    }

    /**
     * Final callback when workflow is completed (either approved or rejected).
     */
    protected function triggerCallback(ApprovalInstance $instance): void
    {
        // Fire custom Eloquent events or update original entity
        if ($instance->status === 'approved') {
            // e.g. if unit price change approved, apply price change to Unit model
            event(new \App\Events\ApprovalApproved($instance));
        } else if ($instance->status === 'rejected') {
            event(new \App\Events\ApprovalRejected($instance));
        }
    }
}
