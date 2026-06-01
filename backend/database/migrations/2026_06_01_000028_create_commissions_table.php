<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
     * Table: commissions
     * Loose-link: unit_id references Finance domain (no FK)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('broker_id');
            $table->uuid('lead_id');
            $table->uuid('unit_id')->nullable()->comment('Loose-link to Finance domain units table — no foreign key');
            $table->decimal('rate_percent', 4, 2)->default(0.00);
            $table->decimal('gross_amount', 12, 2)->default(0.00);
            $table->enum('status', ['pending', 'approved', 'paid'])->default('pending');

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('broker_id', 'idx_commissions_broker');
            $table->index('lead_id', 'idx_commissions_lead');
            $table->index('unit_id', 'idx_commissions_unit');
            $table->index('status', 'idx_commissions_status');

            // ── Foreign Keys ──
            $table->foreign('broker_id')
                  ->references('id')->on('brokers')
                  ->onDelete('cascade');
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            // NOTE: unit_id is intentionally NOT a foreign key (loose-coupling with Finance domain)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};