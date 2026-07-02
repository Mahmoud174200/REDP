<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Table: customer_sessions  (anonymous visitor sessions, pre-lead)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('customer_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('anon_id', 64);                 // 1st-party cookie value
            $table->uuid('lead_id')->nullable();           // back-filled on identification
            $table->string('session_token', 80)->unique();

            // ── Resolved attribution ──
            $table->string('source_key', 64)->nullable();
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
            $table->text('user_agent')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->uuid('tenant_id')->nullable();

            $table->timestamps();

            $table->index('anon_id', 'idx_sessions_anon');
            $table->index('lead_id', 'idx_sessions_lead');
            $table->index('broker_id', 'idx_sessions_broker');
            $table->index(['source_key', 'created_at'], 'idx_sessions_source_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_sessions');
    }
};
