<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Table: customer_events  (append-only funnel/journey events)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('customer_events', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id')->nullable();
            $table->uuid('session_id')->nullable();
            $table->string('anon_id', 64)->nullable();
            $table->string('event_id', 80)->nullable();   // client-supplied idempotency key

            $table->enum('event_type', [
                'page_view', 'visitor', 'lead', 'registered',
                'eoi_paid', 'unit_reserved', 'contract_signed', 'completed_sale', 'custom',
            ]);
            $table->string('stage', 40)->nullable();
            $table->json('properties')->nullable();

            $table->timestamp('occurred_at');
            $table->uuid('tenant_id')->nullable();

            $table->timestamps();

            $table->index(['lead_id', 'occurred_at'], 'idx_events_lead_occurred');
            $table->index(['event_type', 'occurred_at'], 'idx_events_type_occurred');
            $table->index('anon_id', 'idx_events_anon');
            $table->unique(['event_id'], 'uq_events_event_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_events');
    }
};
