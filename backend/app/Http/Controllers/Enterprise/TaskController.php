<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\TaskService;
use App\Models\Task;
use App\Models\TaskChecklist;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected TaskService $service;

    public function __construct(TaskService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['status', 'priority', 'assigned_to', 'company_id', 'parent_task_id', 'search']);
        $tasks = $this->service->getTasks($filters);

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'parent_task_id' => 'nullable|uuid|exists:tasks,id',
            'description' => 'nullable|string',
            'status' => 'required|in:todo,in_progress,review,done,cancelled',
            'priority' => 'required|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'recurrence_rule' => 'nullable|string',
            'related_type' => 'nullable|string',
            'related_id' => 'nullable|uuid',
            'checklists' => 'nullable|array',
            'checklists.*.item_text' => 'required|string',
        ]);

        $validated['created_by'] = $request->user()->id;
        $task = $this->service->createTask($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task
        ], 211);
    }

    public function show(string $id)
    {
        $task = Task::with(['assignee', 'creator', 'subTasks', 'checklists', 'dependencies.blockerTask', 'comments.user', 'attachments'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $task
        ]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'parent_task_id' => 'nullable|uuid|exists:tasks,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:todo,in_progress,review,done,cancelled',
            'priority' => 'sometimes|required|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|uuid|exists:users,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'recurrence_rule' => 'nullable|string',
        ]);

        $task = $this->service->updateTask($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $task
        ]);
    }

    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully'
        ]);
    }

    public function addComment(Request $request, string $id)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $comment = $this->service->addComment($id, $validated['comment'], $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'data' => $comment
        ], 211);
    }

    public function addAttachment(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'file_url' => 'required|string',
        ]);

        $attachment = $this->service->addAttachment($id, $validated['name'], $validated['file_url'], $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Attachment uploaded successfully',
            'data' => $attachment
        ], 211);
    }

    public function addChecklistItem(Request $request, string $id)
    {
        $validated = $request->validate([
            'item_text' => 'required|string',
        ]);

        $item = $this->service->addChecklistItem($id, $validated['item_text']);

        return response()->json([
            'success' => true,
            'message' => 'Checklist item added successfully',
            'data' => $item
        ], 211);
    }

    public function toggleChecklistItem(Request $request, string $id, string $itemId)
    {
        // Verify item belongs to task
        $item = TaskChecklist::where('task_id', $id)->findOrFail($itemId);
        $updated = $this->service->toggleChecklistItem($itemId);

        return response()->json([
            'success' => true,
            'message' => 'Checklist item toggled successfully',
            'data' => $updated
        ]);
    }

    public function addDependency(Request $request, string $id)
    {
        $validated = $request->validate([
            'blocked_by_task_id' => 'required|uuid|exists:tasks,id',
            'dependency_type' => 'required|in:finish_to_start,start_to_start,finish_to_finish',
        ]);

        $dependency = $this->service->addDependency($id, $validated['blocked_by_task_id'], $validated['dependency_type']);

        return response()->json([
            'success' => true,
            'message' => 'Task dependency created successfully',
            'data' => $dependency
        ], 211);
    }
}
