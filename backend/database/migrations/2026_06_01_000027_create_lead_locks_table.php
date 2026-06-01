<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
     * Table: lead_locks (Broker Anti-Poaching System)
     * 90-day exclusive lock on leads registered via broker referral
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('lead_locks', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('broker_id');
            $table->uuid('lead_id');
            $table->string('phone', 20);
            $table->string('national_id', 30)->nullable();
            $table->timestamp('locked_until');
            $table->enum('status', ['active', 'expired', 'released'])->default('active');

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('broker_id', 'idx_lead_locks_broker');
            $table->index('lead_id', 'idx_lead_locks_lead');
            $table->index('locked_until', 'idx_lead_locks_until');
            $table->index('status', 'idx_lead_locks_status');
            $table->index(['phone', 'national_id'], 'idx_lead_locks_phone_nid');
            $table->unique(['phone', 'status'], 'uq_lead_locks_phone_active');

            // ── Foreign Keys ──
            $table->foreign('broker_id')
                  ->references('id')->on('brokers')
                  ->onDelete('cascade');
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_locks');
    }
};
