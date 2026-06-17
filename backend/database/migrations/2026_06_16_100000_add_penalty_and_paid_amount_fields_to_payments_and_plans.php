<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('paid_amount', 15, 2)->default(0.00)->after('amount');
        });

        Schema::table('payment_plans', function (Blueprint $table) {
            $table->decimal('penalty_rate', 5, 2)->nullable()->after('status');
            $table->boolean('penalty_enabled')->nullable()->after('penalty_rate');
            $table->integer('grace_period_days')->nullable()->after('penalty_enabled');
        });

        // Update existing paid payments: set paid_amount = amount
        DB::table('payments')
            ->where('status', 'paid')
            ->update([
                'paid_amount' => DB::raw('amount')
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('paid_amount');
        });

        Schema::table('payment_plans', function (Blueprint $table) {
            $table->dropColumn(['penalty_rate', 'penalty_enabled', 'grace_period_days']);
        });
    }
};
