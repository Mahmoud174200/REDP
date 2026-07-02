<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
     * Table: eoi_queue (Expression of Interest Priority Queue)
     * Used for Project Launching & Reservation Priority System
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('eoi_queue', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id');
            $table->uuid('project_id')->comment('Loose-link to Finance domain projects table');
            $table->integer('queue_number')->nullable();
            $table->decimal('priority_score', 16, 6)->comment('microtime(true) value for millisecond precision ordering');
            $table->enum('status', ['pending', 'confirmed', 'expired', 'cancelled'])->default('pending');
            $table->decimal('eoi_amount', 12, 2)->default(0.00);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('lead_id', 'idx_eoi_lead');
            $table->index('project_id', 'idx_eoi_project');
            $table->index('priority_score', 'idx_eoi_priority');
            $table->index('status', 'idx_eoi_status');
            $table->index('queue_number', 'idx_eoi_queue_number');
            $table->unique(['lead_id', 'project_id'], 'uq_eoi_lead_project');

            // ── Foreign Keys ──
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            // NOTE: project_id is intentionally NOT a foreign key (loose-coupling with Finance domain)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eoi_queue');
    }
};
