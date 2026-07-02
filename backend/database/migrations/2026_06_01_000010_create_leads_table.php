<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
     * Table: leads
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // ── Identity Fields ──
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone', 20);
            $table->string('national_id', 30)->nullable();
            $table->string('passport_no', 30)->nullable();

            // ── Sales Pipeline ──
            $table->enum('status', [
                'new',
                'contacted',
                'interested',
                'visit_scheduled',
                'negotiation',
                'reserved',
                'contracted',
            ])->default('new');

            $table->integer('lead_score')->default(0);
            $table->uuid('assigned_sales_agent_id')->nullable();

            // ── KYC Verification ──
            $table->string('kyc_status')->default('none'); // none, pending, verified, rejected
            $table->string('national_id_front_path')->nullable();
            $table->string('national_id_back_path')->nullable();
            $table->string('passport_path')->nullable();
            $table->string('selfie_path')->nullable();
            $table->decimal('facial_match_score', 5, 2)->nullable();

            // ── Source Tracking ──
            $table->string('source')->default('direct'); // facebook, google, tiktok, direct, referral, broker
            $table->uuid('campaign_id')->nullable();
            $table->uuid('broker_id')->nullable();

            // ── Timestamps ──
            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('status', 'idx_leads_status');
            $table->index('lead_score', 'idx_leads_score');
            $table->index('phone', 'idx_leads_phone');
            $table->index('national_id', 'idx_leads_national_id');
            $table->index('assigned_sales_agent_id', 'idx_leads_agent');
            $table->index('campaign_id', 'idx_leads_campaign');
            $table->index('broker_id', 'idx_leads_broker');
            $table->index(['phone', 'national_id'], 'idx_leads_phone_nid_composite');
            $table->index(['status', 'assigned_sales_agent_id'], 'idx_leads_status_agent');

            // ── Foreign Keys (loose-coupling: agent is on users table owned by Delivery Team) ──
            $table->foreign('assigned_sales_agent_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};