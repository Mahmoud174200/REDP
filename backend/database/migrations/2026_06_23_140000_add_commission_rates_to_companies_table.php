<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->decimal('developer_brokerage_rate', 5, 2)->default(5.00);
            $table->decimal('owner_commission_rate', 5, 2)->default(1.00);
            $table->decimal('leader_commission_rate', 5, 2)->default(1.50);
            $table->decimal('agent_commission_rate', 5, 2)->default(2.50);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'developer_brokerage_rate',
                'owner_commission_rate',
                'leader_commission_rate',
                'agent_commission_rate',
            ]);
        });
    }
};
