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
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->string('passport_path')->nullable()->after('receipt_path');
        });

        // Add 'instapay' to the payment_method enum using raw SQL
        DB::statement("ALTER TABLE eoi_reservations MODIFY COLUMN payment_method ENUM('cash', 'bank_transfer', 'cheque', 'international_bank_transfer', 'instapay') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert enum column
        DB::statement("ALTER TABLE eoi_reservations MODIFY COLUMN payment_method ENUM('cash', 'bank_transfer', 'cheque', 'international_bank_transfer') NOT NULL");

        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->dropColumn('passport_path');
        });
    }
};
