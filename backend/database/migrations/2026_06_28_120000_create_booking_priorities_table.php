<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Booking Priority Board (Head of Sales)
     *
     * One row per paid EOI/booking, holding the AI priority score +
     * explanation and the Head of Sales' manual ranking / decision.
     * Kept separate from eoi_reservations so the queue logic stays clean.
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('booking_priorities', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('eoi_reservation_id');
            $table->uuid('project_id')->nullable();

            // ── AI ──
            $table->decimal('ai_score', 6, 2)->default(0);     // 0..100
            $table->json('ai_reasons')->nullable();            // explainability breakdown
            $table->timestamp('computed_at')->nullable();

            // ── Head of Sales manual control ──
            $table->integer('manual_rank')->nullable();        // explicit order (1 = top)
            $table->enum('decision', ['pending', 'shortlisted', 'approved', 'waitlist', 'rejected'])
                  ->default('pending');
            $table->text('note')->nullable();
            $table->uuid('set_by')->nullable();                // head of sales user id

            $table->timestamps();

            $table->unique('eoi_reservation_id', 'uq_bprio_eoi');
            $table->index('project_id', 'idx_bprio_project');
            $table->index('ai_score', 'idx_bprio_ai_score');
            $table->index('manual_rank', 'idx_bprio_manual_rank');
            $table->index('decision', 'idx_bprio_decision');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_priorities');
    }
};
