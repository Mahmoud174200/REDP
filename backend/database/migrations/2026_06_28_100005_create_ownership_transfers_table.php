<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Table: ownership_transfers  (append-only admin ownership ledger)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('ownership_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id');
            $table->string('from_owner_type', 20)->nullable();   // broker | agent | direct
            $table->uuid('from_owner_id')->nullable();
            $table->string('to_owner_type', 20);
            $table->uuid('to_owner_id')->nullable();             // null for "direct"
            $table->text('reason');
            $table->uuid('transferred_by');                      // admin user id
            $table->uuid('tenant_id')->nullable();

            $table->timestamp('created_at')->nullable();         // append-only, no updated_at

            $table->index(['lead_id', 'created_at'], 'idx_transfers_lead_created');
            $table->index('transferred_by', 'idx_transfers_actor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ownership_transfers');
    }
};
