<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
     * Table: call_logs
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('call_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id');
            $table->string('call_sid')->unique(); // Twilio / VoIP provider SID
            $table->enum('direction', ['inbound', 'outbound']);
            $table->integer('duration_seconds')->default(0);
            $table->string('recording_url', 512)->nullable(); // AWS S3 MP3 URL
            $table->string('status', 50)->default('completed'); // initiated, ringing, in-progress, completed, failed, busy, no-answer

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('lead_id', 'idx_call_logs_lead');
            $table->index('status', 'idx_call_logs_status');
            $table->index('direction', 'idx_call_logs_direction');
            $table->index('created_at', 'idx_call_logs_created');

            // ── Foreign Keys ──
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};