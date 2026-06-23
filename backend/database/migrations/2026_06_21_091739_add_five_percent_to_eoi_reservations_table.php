<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->timestamp('invited_at')->nullable()->after('email_sent_at');
            $table->integer('contracting_deadline_hours')->nullable()->after('invited_at');
            $table->boolean('five_percent_paid')->default(false)->after('contracting_deadline_hours');
            $table->decimal('five_percent_amount', 15, 2)->nullable()->after('five_percent_paid');
            $table->string('five_percent_receipt_path')->nullable()->after('five_percent_amount');
            $table->timestamp('five_percent_paid_at')->nullable()->after('five_percent_receipt_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->dropColumn([
                'invited_at',
                'contracting_deadline_hours',
                'five_percent_paid',
                'five_percent_amount',
                'five_percent_receipt_path',
                'five_percent_paid_at'
            ]);
        });
    }
};
