<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Models\ApprovalCondition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApprovalWorkflowController extends Controller
{
    public function index()
    {
        $workflows = ApprovalWorkflow::with(['steps.stepConditions', 'creator'])
            ->orderBy('entity_type')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $workflows
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'entity_type' => 'required|string',
            'description' => 'nullable|string',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'timeout_hours' => 'nullable|integer|min:1',
            'steps' => 'required|array|min:1',
            'steps.*.name' => 'required|string',
            'steps.*.step_order' => 'required|integer',
            'steps.*.type' => 'required|in:sequential,parallel,conditional',
            'steps.*.approver_type' => 'required|in:user,role,position,department_head,direct_manager',
            'steps.*.approver_id' => 'nullable|string', // role ID, user ID or position ID
            'steps.*.required_approvals' => 'nullable|integer|min:1',
            'steps.*.conditions' => 'nullable|array',
            'steps.*.conditions.*.field' => 'required|string',
            'steps.*.conditions.*.operator' => 'required|in:eq,neq,gt,lt,gte,lte,in,not_in,contains',
            'steps.*.conditions.*.value' => 'required|string',
            'steps.*.conditions.*.logic' => 'required|in:and,or',
        ]);

        $workflow = DB::transaction(function () use ($validated, $request) {
            $workflow = ApprovalWorkflow::create([
                'id' => (string) Str::uuid(),
                'name' => $validated['name'],
                'entity_type' => $validated['entity_type'],
                'description' => $validated['description'] ?? null,
                'company_id' => $validated['company_id'] ?? null,
                'timeout_hours' => $validated['timeout_hours'] ?? null,
                'created_by' => $request->user()->id,
                'is_active' => true,
            ]);

            foreach ($validated['steps'] as $sData) {
                $step = ApprovalStep::create([
                    'id' => (string) Str::uuid(),
                    'workflow_id' => $workflow->id,
                    'step_order' => $sData['step_order'],
                    'name' => $sData['name'],
                    'type' => $sData['type'],
                    'approver_type' => $sData['approver_type'],
                    'approver_id' => $sData['approver_id'] ?? null,
                    'required_approvals' => $sData['required_approvals'] ?? 1,
                    'auto_approve' => false,
                ]);

                if ($sData['type'] === 'conditional' && !empty($sData['conditions'])) {
                    foreach ($sData['conditions'] as $cData) {
                        ApprovalCondition::create([
                            'id' => (string) Str::uuid(),
                            'step_id' => $step->id,
                            'field' => $cData['field'],
                            'operator' => $cData['operator'],
                            'value' => $cData['value'],
                            'logic' => $cData['logic'],
                        ]);
                    }
                }
            }

            return $workflow;
        });

        return response()->json([
            'success' => true,
            'message' => 'Approval workflow created successfully',
            'data' => $workflow->load('steps.stepConditions')
        ], 211);
    }

    public function update(Request $request, string $id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'entity_type' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'timeout_hours' => 'nullable|integer|min:1',
            'is_active' => 'sometimes|boolean',
            'steps' => 'sometimes|required|array|min:1',
            'steps.*.name' => 'required|string',
            'steps.*.step_order' => 'required|integer',
            'steps.*.type' => 'required|in:sequential,parallel,conditional',
            'steps.*.approver_type' => 'required|in:user,role,position,department_head,direct_manager',
            'steps.*.approver_id' => 'nullable|string',
            'steps.*.required_approvals' => 'nullable|integer|min:1',
            'steps.*.conditions' => 'nullable|array',
            'steps.*.conditions.*.field' => 'required|string',
            'steps.*.conditions.*.operator' => 'required|in:eq,neq,gt,lt,gte,lte,in,not_in,contains',
            'steps.*.conditions.*.value' => 'required|string',
            'steps.*.conditions.*.logic' => 'required|in:and,or',
        ]);

        DB::transaction(function () use ($workflow, $validated) {
            $workflow->update(array_intersect_key($validated, array_flip(['name', 'entity_type', 'description', 'company_id', 'timeout_hours', 'is_active'])));

            if (isset($validated['steps'])) {
                // Delete existing steps (conditions will cascade delete)
                ApprovalStep::where('workflow_id', $workflow->id)->delete();

                foreach ($validated['steps'] as $sData) {
                    $step = ApprovalStep::create([
                        'id' => (string) Str::uuid(),
                        'workflow_id' => $workflow->id,
                        'step_order' => $sData['step_order'],
                        'name' => $sData['name'],
                        'type' => $sData['type'],
                        'approver_type' => $sData['approver_type'],
                        'approver_id' => $sData['approver_id'] ?? null,
                        'required_approvals' => $sData['required_approvals'] ?? 1,
                        'auto_approve' => false,
                    ]);

                    if ($sData['type'] === 'conditional' && !empty($sData['conditions'])) {
                        foreach ($sData['conditions'] as $cData) {
                            ApprovalCondition::create([
                                'id' => (string) Str::uuid(),
                                'step_id' => $step->id,
                                'field' => $cData['field'],
                                'operator' => $cData['operator'],
                                'value' => $cData['value'],
                                'logic' => $cData['logic'],
                            ]);
                        }
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Approval workflow updated successfully',
            'data' => $workflow->load('steps.stepConditions')
        ]);
    }

    public function destroy(string $id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);
        $workflow->delete();

        return response()->json([
            'success' => true,
            'message' => 'Workflow deleted successfully'
        ]);
    }

    public function getEntityTypes()
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['key' => 'cancellation', 'label' => 'Contract Cancellation'],
                ['key' => 'discount_request', 'label' => 'Unit Price Discount Request'],
                ['key' => 'price_change', 'label' => 'Base Price Modification'],
                ['key' => 'refund', 'label' => 'Refund Processing'],
                ['key' => 'contract_amendment', 'label' => 'Contract Amendment'],
                ['key' => 'rescheduling', 'label' => 'Installment Rescheduling'],
            ]
        ]);
    }
}
