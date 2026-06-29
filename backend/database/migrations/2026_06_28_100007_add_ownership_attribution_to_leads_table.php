<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Extend: leads  (single-owner lock + attribution summary)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // ── Single-owner model (first-broker-wins, admin-transfer only) ──
            $table->enum('owner_type', ['broker', 'agent', 'direct'])->nullable()->after('broker_id');
            $table->uuid('owner_id')->nullable()->after('owner_type');       // broker id or user id
            $table->timestamp('ownership_locked_at')->nullable()->after('owner_id');

            // ── Attribution summary (full history lives in lead_attributions) ──
            $table->uuid('original_source_id')->nullable()->after('campaign_id');
            $table->uuid('current_source_id')->nullable()->after('original_source_id');
            $table->timestamp('first_touch_at')->nullable()->after('current_source_id');
            $table->timestamp('last_touch_at')->nullable()->after('first_touch_at');
            $table->string('anon_id', 64)->nullable()->after('last_touch_at');

            $table->index(['owner_type', 'owner_id'], 'idx_leads_owner');
            $table->index('ownership_locked_at', 'idx_leads_owner_locked');
            $table->index('anon_id', 'idx_leads_anon');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('idx_leads_owner');
            $table->dropIndex('idx_leads_owner_locked');
            $table->dropIndex('idx_leads_anon');
            $table->dropColumn([
                'owner_type', 'owner_id', 'ownership_locked_at',
                'original_source_id', 'current_source_id',
                'first_touch_at', 'last_touch_at', 'anon_id',
            ]);
        });
    }
};
