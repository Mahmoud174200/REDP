<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Tasks ──
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('parent_task_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'in_progress', 'review', 'done', 'cancelled'])->default('todo');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->date('due_date')->nullable();
            $table->uuid('assigned_to')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('company_id')->nullable();
            $table->string('recurrence_rule')->nullable(); // cron or weekly/monthly representation
            $table->string('related_type', 100)->nullable(); // polymorphic related entity
            $table->uuid('related_id')->nullable();
            $table->timestamps();

            $table->foreign('parent_task_id')->references('id')->on('tasks')->nullOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->index(['related_type', 'related_id']);
            $table->index(['status', 'priority']);
            $table->index(['assigned_to', 'due_date']);
        });

        // ── Task Comments ──
        Schema::create('task_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->text('comment');
            $table->timestamps();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ── Task Attachments ──
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->string('name');
            $table->string('file_url');
            $table->uuid('uploaded_by')->nullable();
            $table->timestamps();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        // ── Task Checklists (sub-tasks checklist) ──
        Schema::create('task_checklists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->string('item_text');
            $table->boolean('is_completed')->default(false);
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
        });

        // ── Task Dependencies (Gantt links) ──
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('task_id');
            $table->uuid('blocked_by_task_id');
            $table->enum('dependency_type', ['finish_to_start', 'start_to_start', 'finish_to_finish'])->default('finish_to_start');
            $table->timestamps();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('blocked_by_task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->unique(['task_id', 'blocked_by_task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
        Schema::dropIfExists('task_checklists');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
    }
};
