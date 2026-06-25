<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a lightweight custom-payment-plan approval workflow to contracts.
 * When Company Sales builds a CUSTOM installment plan it must be approved by
 * an accountant (finance officer) before the contract can be signed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            if (!Schema::hasColumn('contracts', 'is_custom_plan')) {
                $table->boolean('is_custom_plan')->default(false)->after('type');
            }
            if (!Schema::hasColumn('contracts', 'plan_approval_status')) {
                // not_required | pending | approved | rejected
                $table->string('plan_approval_status', 20)->default('not_required')->after('is_custom_plan');
            }
            if (!Schema::hasColumn('contracts', 'plan_approval_notes')) {
                $table->text('plan_approval_notes')->nullable()->after('plan_approval_status');
            }
            if (!Schema::hasColumn('contracts', 'plan_reviewed_by')) {
                $table->uuid('plan_reviewed_by')->nullable()->after('plan_approval_notes');
            }
            if (!Schema::hasColumn('contracts', 'plan_reviewed_at')) {
                $table->timestamp('plan_reviewed_at')->nullable()->after('plan_reviewed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            foreach (['is_custom_plan', 'plan_approval_status', 'plan_approval_notes', 'plan_reviewed_by', 'plan_reviewed_at'] as $col) {
                if (Schema::hasColumn('contracts', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
