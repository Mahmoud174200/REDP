<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Site Inspections ──
        Schema::create('site_inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('tenant_id')->nullable();
            $table->uuid('milestone_id')->nullable();
            $table->uuid('inspector_id');
            $table->date('inspection_date');
            $table->text('comments')->nullable();
            $table->enum('status', ['passed', 'failed', 'pending_action'])->default('passed');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
            $table->foreign('milestone_id')->references('id')->on('construction_milestones')->nullOnDelete();
            $table->foreign('inspector_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ── Non-Conformance Reports (NCR) ──
        Schema::create('ncr_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('inspection_id');
            $table->text('description');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'under_review', 'resolved'])->default('open');
            $table->uuid('assigned_engineer_id')->nullable();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('inspection_id')->references('id')->on('site_inspections')->cascadeOnDelete();
            $table->foreign('assigned_engineer_id')->references('id')->on('users')->nullOnDelete();
        });

        // ── Corrective and Preventive Actions (CAPA) ──
        Schema::create('capa_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ncr_id');
            $table->text('action_plan');
            $table->date('due_date');
            $table->enum('status', ['pending', 'implemented', 'verified'])->default('pending');
            $table->timestamps();

            $table->foreign('ncr_id')->references('id')->on('ncr_reports')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capa_actions');
        Schema::dropIfExists('ncr_reports');
        Schema::dropIfExists('site_inspections');
    }
};
