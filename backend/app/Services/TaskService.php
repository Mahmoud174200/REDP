<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskAttachment;
use App\Models\TaskChecklist;
use App\Models\TaskDependency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TaskService
{
    public function getTasks(array $filters = [])
    {
        $query = Task::with(['assignee', 'creator', 'subTasks', 'checklists', 'dependencies.blockerTask', 'comments.user', 'attachments']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }
        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }
        if (!empty($filters['parent_task_id'])) {
            $query->where('parent_task_id', $filters['parent_task_id']);
        }
        if (!empty($filters['search'])) {
            $query->where('title', 'like', "%{$filters['search']}%");
        }

        return $query->orderBy('due_date', 'asc')->orderBy('created_at', 'desc')->get();
    }

    public function createTask(array $data): Task
    {
        return DB::transaction(function () use ($data) {
            $task = Task::create([
                'id' => (string) Str::uuid(),
                'parent_task_id' => $data['parent_task_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'todo',
                'priority' => $data['priority'] ?? 'medium',
                'due_date' => $data['due_date'] ?? null,
                'assigned_to' => $data['assigned_to'] ?? null,
                'created_by' => $data['created_by'] ?? null,
                'company_id' => $data['company_id'] ?? null,
                'recurrence_rule' => $data['recurrence_rule'] ?? null,
                'related_type' => $data['related_type'] ?? null,
                'related_id' => $data['related_id'] ?? null,
            ]);

            // Add checklist items if provided
            if (!empty($data['checklists'])) {
                foreach ($data['checklists'] as $item) {
                    TaskChecklist::create([
                        'id' => (string) Str::uuid(),
                        'task_id' => $task->id,
                        'item_text' => $item['item_text'],
                        'is_completed' => false,
                    ]);
                }
            }

            return $task;
        });
    }

    public function updateTask(string $id, array $data): Task
    {
        $task = Task::findOrFail($id);
        $task->update($data);
        return $task;
    }

    public function addComment(string $taskId, string $comment, string $userId): TaskComment
    {
        return TaskComment::create([
            'id' => (string) Str::uuid(),
            'task_id' => $taskId,
            'user_id' => $userId,
            'comment' => $comment,
        ]);
    }

    public function addAttachment(string $taskId, string $name, string $fileUrl, string $userId): TaskAttachment
    {
        return TaskAttachment::create([
            'id' => (string) Str::uuid(),
            'task_id' => $taskId,
            'name' => $name,
            'file_url' => $fileUrl,
            'uploaded_by' => $userId,
        ]);
    }

    public function addChecklistItem(string $taskId, string $text): TaskChecklist
    {
        return TaskChecklist::create([
            'id' => (string) Str::uuid(),
            'task_id' => $taskId,
            'item_text' => $text,
            'is_completed' => false,
        ]);
    }

    public function toggleChecklistItem(string $itemId): TaskChecklist
    {
        $item = TaskChecklist::findOrFail($itemId);
        $newStatus = !$item->is_completed;
        
        $item->update([
            'is_completed' => $newStatus,
            'completed_at' => $newStatus ? now() : null,
        ]);

        return $item;
    }

    public function addDependency(string $taskId, string $blockerId, string $type = 'finish_to_start'): TaskDependency
    {
        return TaskDependency::create([
            'id' => (string) Str::uuid(),
            'task_id' => $taskId,
            'blocked_by_task_id' => $blockerId,
            'dependency_type' => $type,
        ]);
    }
}
