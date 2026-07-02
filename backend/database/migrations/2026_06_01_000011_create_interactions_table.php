<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
     * Table: interactions
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('interactions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id');
            $table->enum('type', ['call', 'whatsapp', 'meeting', 'email']);
            $table->text('notes')->nullable();
            $table->timestamp('follow_up_date')->nullable();
            $table->uuid('logged_by');

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('lead_id', 'idx_interactions_lead');
            $table->index('type', 'idx_interactions_type');
            $table->index('follow_up_date', 'idx_interactions_followup');
            $table->index('logged_by', 'idx_interactions_logged_by');

            // ── Foreign Keys ──
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            $table->foreign('logged_by')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interactions');
    }
};