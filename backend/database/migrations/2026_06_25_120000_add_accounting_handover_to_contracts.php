<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks when a signed contract is handed over to the Accounting department
 * by Company Sales, so accounting can take over the payment schedule.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            if (!Schema::hasColumn('contracts', 'accounting_handover_at')) {
                $table->timestamp('accounting_handover_at')->nullable()->after('signed_at');
            }
            if (!Schema::hasColumn('contracts', 'accounting_handover_by')) {
                $table->uuid('accounting_handover_by')->nullable()->after('accounting_handover_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            foreach (['accounting_handover_at', 'accounting_handover_by'] as $col) {
                if (Schema::hasColumn('contracts', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
