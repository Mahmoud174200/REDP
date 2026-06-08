<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Approval Workflow Definitions ──
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('entity_type', 100); // 'cancellation', 'discount_request', 'price_change', 'refund', 'contract_amendment'
            $table->text('description')->nullable();
            $table->uuid('company_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('auto_approve_conditions')->nullable();
            $table->integer('timeout_hours')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['entity_type', 'is_active']);
        });

        // ── Approval Steps (workflow stages) ──
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->integer('step_order');
            $table->string('name');
            $table->enum('type', ['sequential', 'parallel', 'conditional'])->default('sequential');
            $table->enum('approver_type', ['user', 'role', 'position', 'department_head', 'direct_manager'])->default('user');
            $table->uuid('approver_id')->nullable(); // specific user/role/position ID
            $table->integer('required_approvals')->default(1); // for parallel steps
            $table->json('conditions')->nullable();
            $table->boolean('auto_approve')->default(false);
            $table->integer('timeout_hours')->nullable();
            $table->uuid('escalation_to')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('approval_workflows')->cascadeOnDelete();
            $table->foreign('escalation_to')->references('id')->on('users')->nullOnDelete();
            $table->index(['workflow_id', 'step_order']);
        });

        // ── Approval Instances (runtime instances) ──
        Schema::create('approval_instances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id');
            $table->string('entity_type', 100);
            $table->uuid('entity_id');
            $table->uuid('current_step_id')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'escalated', 'cancelled', 'expired'])->default('pending');
            $table->uuid('requested_by');
            $table->json('metadata')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('approval_workflows')->cascadeOnDelete();
            $table->foreign('current_step_id')->references('id')->on('approval_steps')->nullOnDelete();
            $table->foreign('requested_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['entity_type', 'entity_id']);
            $table->index(['status']);
            $table->index(['requested_by']);
        });

        // ── Approval Actions (audit trail of approve/reject/escalate) ──
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('instance_id');
            $table->uuid('step_id');
            $table->uuid('actor_id');
            $table->enum('action', ['approve', 'reject', 'escalate', 'comment', 'return'])->default('approve');
            $table->text('comment')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('acted_at');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('instance_id')->references('id')->on('approval_instances')->cascadeOnDelete();
            $table->foreign('step_id')->references('id')->on('approval_steps')->cascadeOnDelete();
            $table->foreign('actor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['instance_id', 'step_id']);
        });

        // ── Approval Conditions (conditional logic per step) ──
        Schema::create('approval_conditions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('step_id');
            $table->string('field', 100);       // e.g. 'amount', 'type', 'priority'
            $table->enum('operator', ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'contains'])->default('eq');
            $table->string('value');             // comparison value
            $table->enum('logic', ['and', 'or'])->default('and');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('step_id')->references('id')->on('approval_steps')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_conditions');
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_instances');
        Schema::dropIfExists('approval_steps');
        Schema::dropIfExists('approval_workflows');
    }
};
