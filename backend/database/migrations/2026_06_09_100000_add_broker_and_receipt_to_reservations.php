<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('reservations', function (Blueprint $table) {
            $table->uuid('broker_id')->nullable()->after('client_id');
            $table->string('payment_receipt_path')->nullable()->after('eoi_amount');
            $table->text('approval_notes')->nullable()->after('status');
            $table->uuid('cancelled_by')->nullable()->after('expires_at');
            $table->text('cancellation_reason')->nullable()->after('cancelled_by');
            
            $table->foreign('broker_id')->references('id')->on('brokers')->onDelete('set null');
        });
    }

    public function down(): void {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['broker_id']);
            $table->dropColumn(['broker_id', 'payment_receipt_path', 'approval_notes', 'cancelled_by', 'cancellation_reason']);
        });
    }
};
