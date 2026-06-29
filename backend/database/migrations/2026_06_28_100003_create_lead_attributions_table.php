<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Table: lead_attributions  (append-only: one row per touch)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('lead_attributions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id');
            $table->uuid('session_id')->nullable();
            $table->enum('touch_type', ['first', 'intermediate', 'last'])->default('intermediate');

            $table->string('source_key', 64);
            $table->uuid('broker_id')->nullable();
            $table->uuid('campaign_id')->nullable();
            $table->string('promo_code', 64)->nullable();

            // ── UTM ──
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_content')->nullable();
            $table->string('utm_term')->nullable();

            // ── Context ──
            $table->text('landing_page')->nullable();
            $table->text('referrer')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->string('country', 80)->nullable();
            $table->string('city', 120)->nullable();
            $table->string('device', 40)->nullable();
            $table->string('os', 60)->nullable();
            $table->string('browser', 60)->nullable();

            $table->timestamp('occurred_at');
            $table->uuid('tenant_id')->nullable();

            $table->timestamps();

            $table->index(['lead_id', 'occurred_at'], 'idx_attr_lead_occurred');
            $table->index('broker_id', 'idx_attr_broker');
            $table->index('campaign_id', 'idx_attr_campaign');
            $table->index('source_key', 'idx_attr_source');
            $table->index('touch_type', 'idx_attr_touch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_attributions');
    }
};
