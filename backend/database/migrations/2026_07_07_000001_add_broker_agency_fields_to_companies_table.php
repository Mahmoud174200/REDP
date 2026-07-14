<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Extends the shared `companies` table so it can double as an
 * external Broker Agency (registered self-service, vetted by admin).
 *
 * The internal enterprise org keeps using `companies` untouched;
 * broker agencies are flagged via `is_broker_agency` and carry their
 * own KYC documents, bank details and an admin approval workflow.
 * ─────────────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('is_broker_agency')->default(false)->after('type');
            $table->uuid('owner_user_id')->nullable()->after('is_broker_agency');

            // KYC / verification documents
            $table->string('license_no', 100)->nullable()->after('owner_user_id');
            $table->string('tax_card_path')->nullable()->after('license_no');
            $table->string('commercial_registry_path')->nullable()->after('tax_card_path');

            // Bank details (for commission payouts)
            $table->string('bank_name', 120)->nullable()->after('commercial_registry_path');
            $table->string('bank_iban', 40)->nullable()->after('bank_name');

            // Admin approval workflow (vetting)
            $table->enum('approval_status', ['pending', 'active', 'rejected', 'suspended'])
                  ->default('active')
                  ->after('bank_iban');
            $table->timestamp('applied_at')->nullable()->after('approval_status');
            $table->timestamp('approved_at')->nullable()->after('applied_at');
            $table->uuid('approved_by')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('approved_by');

            $table->index('is_broker_agency');
            $table->index('approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['is_broker_agency']);
            $table->dropIndex(['approval_status']);
            $table->dropColumn([
                'is_broker_agency',
                'owner_user_id',
                'license_no',
                'tax_card_path',
                'commercial_registry_path',
                'bank_name',
                'bank_iban',
                'approval_status',
                'applied_at',
                'approved_at',
                'approved_by',
                'rejection_reason',
            ]);
        });
    }
};
