<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered Role-Based Access Control (RBAC)
 * Migration: Sales Tier Infrastructure
 *
 * Creates:
 *  - client_presentations (Tier 2 broker audit trail)
 *  - client_journey_logs  (full client lifecycle tracking)
 *  - Adds tier columns to leads table
 *  - Adds user_id to brokers table
 * ─────────────────────────────────────────────────────────
 */
return new class extends Migration {
    public function up(): void
    {
        // ── 1. Link brokers to user accounts ──
        Schema::table('brokers', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->after('id');
            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');
            $table->index('user_id', 'idx_brokers_user');
        });

        // ── 2. Add tier tracking columns to leads ──
        Schema::table('leads', function (Blueprint $table) {
            $table->uuid('tele_sales_agent_id')->nullable()->after('assigned_sales_agent_id');
            $table->uuid('company_sales_agent_id')->nullable()->after('tele_sales_agent_id');
            $table->enum('current_tier', ['tier_1', 'tier_2', 'tier_3'])
                  ->default('tier_1')
                  ->after('company_sales_agent_id');

            $table->foreign('tele_sales_agent_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');
            $table->foreign('company_sales_agent_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');

            $table->index('tele_sales_agent_id', 'idx_leads_tele_sales');
            $table->index('company_sales_agent_id', 'idx_leads_company_sales');
            $table->index('current_tier', 'idx_leads_current_tier');
        });

        // ── 3. Client Presentations (Broker Tier 2 audit trail) ──
        Schema::create('client_presentations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('broker_user_id');
            $table->uuid('lead_id');
            $table->uuid('project_id');
            $table->json('unit_ids')->nullable();
            $table->text('presentation_notes')->nullable();
            $table->enum('outcome', [
                'pending',
                'interested',
                'declined',
                'escalated_to_sales',
            ])->default('pending');
            $table->uuid('escalated_to_user_id')->nullable();
            $table->timestamp('presented_at');
            $table->timestamps();

            // Foreign keys
            $table->foreign('broker_user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            $table->foreign('project_id')
                  ->references('id')->on('projects')
                  ->onDelete('cascade');
            $table->foreign('escalated_to_user_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');

            // Indexes
            $table->index('broker_user_id', 'idx_presentations_broker');
            $table->index('lead_id', 'idx_presentations_lead');
            $table->index('project_id', 'idx_presentations_project');
            $table->index('outcome', 'idx_presentations_outcome');
            $table->index(['broker_user_id', 'lead_id'], 'idx_presentations_broker_lead');
        });

        // ── 4. Client Journey Logs (full lifecycle audit) ──
        Schema::create('client_journey_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lead_id');
            $table->enum('stage', [
                'lead_created',
                'tele_sales_contact',
                'meeting_scheduled',
                'transferred_to_broker',
                'broker_presentation',
                'escalated_to_sales',
                'booking_initiated',
                'transaction_complete',
            ]);
            $table->uuid('actor_user_id');
            $table->string('actor_role', 50);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            $table->foreign('actor_user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            // Indexes
            $table->index('lead_id', 'idx_journey_lead');
            $table->index('actor_user_id', 'idx_journey_actor');
            $table->index('stage', 'idx_journey_stage');
            $table->index(['lead_id', 'stage'], 'idx_journey_lead_stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_journey_logs');
        Schema::dropIfExists('client_presentations');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['tele_sales_agent_id']);
            $table->dropForeign(['company_sales_agent_id']);
            $table->dropIndex('idx_leads_tele_sales');
            $table->dropIndex('idx_leads_company_sales');
            $table->dropIndex('idx_leads_current_tier');
            $table->dropColumn(['tele_sales_agent_id', 'company_sales_agent_id', 'current_tier']);
        });

        Schema::table('brokers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex('idx_brokers_user');
            $table->dropColumn('user_id');
        });
    }
};
