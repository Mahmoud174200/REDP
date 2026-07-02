<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Table: lead_sources  (normalized channel catalog)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('lead_sources', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('key', 64)->unique();      // e.g. broker_referral, facebook_ads
            $table->string('label');
            $table->enum('category', ['broker', 'paid_ads', 'organic', 'direct', 'manual', 'api'])
                  ->default('organic');
            $table->boolean('is_broker_source')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('category', 'idx_lead_sources_category');
            $table->index('is_broker_source', 'idx_lead_sources_broker');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_sources');
    }
};
