<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
     * Table: campaigns
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('name');
            $table->enum('source', ['facebook', 'google', 'tiktok', 'direct', 'referral']);
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->decimal('budget', 10, 2)->default(0.00);
            $table->integer('leads_count')->default(0);
            $table->decimal('roi_percentage', 5, 2)->default(0.00);

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('source', 'idx_campaigns_source');
            $table->index('utm_source', 'idx_campaigns_utm_source');
            $table->index('utm_campaign', 'idx_campaigns_utm_campaign');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};