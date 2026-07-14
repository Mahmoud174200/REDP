<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Pivot linking a Broker Agency (companies.is_broker_agency)
 * to the projects it is responsible for.
 *
 * Supports both assignment flows:
 *   • Admin assigns a project to the company  → status = 'approved'
 *   • Company requests a project              → status = 'requested'
 *       → admin approves                      → status = 'approved'
 *       → admin rejects                       → status = 'rejected'
 * ─────────────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broker_company_projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('project_id');
            $table->enum('status', ['requested', 'approved', 'rejected'])->default('requested');
            $table->uuid('requested_by')->nullable();   // broker owner who requested
            $table->uuid('approved_by')->nullable();     // admin who assigned/approved
            $table->text('notes')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('requested_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->unique(['company_id', 'project_id']);
            $table->index(['company_id', 'status']);
            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_company_projects');
    }
};
