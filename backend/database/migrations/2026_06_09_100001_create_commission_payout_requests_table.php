<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('commission_payout_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('broker_id');
            $table->decimal('amount', 15, 2);
            $table->string('invoice_path');
            $table->string('status')->default('pending_review'); // pending_review, approved, rejected, paid
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->foreign('broker_id')->references('id')->on('brokers')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('commission_payout_requests');
    }
};
