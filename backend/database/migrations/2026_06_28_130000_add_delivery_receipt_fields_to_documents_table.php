<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Handover Unit Delivery Receipt
     *
     * The handover officer uploads a signed unit-delivery receipt when the
     * customer takes the unit; it is stored as a Document that surfaces in
     * the homeowner's portal. These columns let us tag/link/sign it.
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('document_type')->nullable()->after('title'); // e.g. delivery_receipt
            $table->uuid('unit_id')->nullable()->after('document_type');
            $table->timestamp('signed_at')->nullable()->after('status');
            $table->uuid('signed_by')->nullable()->after('signed_at');

            $table->index('document_type', 'idx_documents_type');
            $table->index('unit_id', 'idx_documents_unit');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('idx_documents_type');
            $table->dropIndex('idx_documents_unit');
            $table->dropColumn(['document_type', 'unit_id', 'signed_at', 'signed_by']);
        });
    }
};
