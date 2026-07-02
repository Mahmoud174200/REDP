<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected array $tables = [
        'users', 'companies', 'projects', 'units', 'leads', 'reservations', 'contracts',
        'payments', 'brokers', 'purchase_requests', 'purchase_orders', 'vendor_invoices',
        'legal_cases', 'tasks', 'conversations', 'journal_entries', 'budgets',
        'commission_rules', 'commission_payouts'
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'tenant_id')) {
                        // Add column and configure nullOnDelete foreign relationship
                        $table->uuid('tenant_id')->nullable()->after('id');
                        $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
                    }
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'tenant_id')) {
                        $table->dropForeign([ 'tenant_id' ]);
                        $table->dropColumn('tenant_id');
                    }
                });
            }
        }
    }
};
