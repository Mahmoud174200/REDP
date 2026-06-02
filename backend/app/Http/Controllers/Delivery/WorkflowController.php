<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\WorkflowTemplate;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkflowController extends Controller
{
    /**
     * Get all visual workflows.
     */
     public function index(Request $request)
     {
         return response()->json([
             'success' => true,
             'data' => WorkflowTemplate::latest()->get()
         ], 200);
     }

     /**
      * Store a new workflow automation template.
      */
     public function store(Request $request)
     {
         $request->validate([
             'trigger_name' => 'required|string|max:255',
             'action_name' => 'required|string|max:255',
             'payload' => 'nullable|string',
         ]);

         $id = (string) Str::uuid();
         $workflow = WorkflowTemplate::create([
             'id' => $id,
             'trigger_name' => $request->trigger_name,
             'action_name' => $request->action_name,
             'rules_payload' => ['payload' => $request->payload],
             'active' => true,
         ]);

         AuditLogService::log(
             'WORKFLOW_CREATE',
             $request->user()->id ?? null,
             ['workflow_id' => $id, 'trigger' => $request->trigger_name]
         );

         return response()->json([
             'success' => true,
             'message' => 'Workflow template created successfully.',
             'data' => $workflow
         ], 201);
     }

     /**
      * Toggle visual workflow active state.
      */
     public function toggle(Request $request, string $id)
     {
         $workflow = WorkflowTemplate::findOrFail($id);
         $workflow->update([
             'active' => !$workflow->active
         ]);

         AuditLogService::log(
             'WORKFLOW_TOGGLE',
             $request->user()->id ?? null,
             ['workflow_id' => $id, 'active' => $workflow->active]
         );

         return response()->json([
             'success' => true,
             'message' => 'Workflow active status updated.',
             'data' => $workflow
         ], 200);
     }

     /**
      * Destroy a workflow template.
      */
     public function destroy(Request $request, string $id)
     {
         $workflow = WorkflowTemplate::findOrFail($id);
         $workflow->delete();

         AuditLogService::log(
             'WORKFLOW_DELETE',
             $request->user()->id ?? null,
             ['workflow_id' => $id]
         );

         return response()->json([
             'success' => true,
             'message' => 'Workflow template deleted.'
         ], 200);
     }
}
