<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
     * Table: brokers
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('brokers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('agency_name');
            $table->string('agent_name');
            $table->string('email')->nullable();
            $table->string('phone', 20);
            $table->string('license_no', 50)->nullable();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->string('referral_code', 32)->unique();

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('status', 'idx_brokers_status');
            $table->index('phone', 'idx_brokers_phone');
            $table->index('email', 'idx_brokers_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brokers');
    }
};