<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('commissions', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('broker_id');
            ->uuid('contract_id');
            ->decimal('amount', 15, 2);
            ->string('status')->default('pending');
            ->timestamp('paid_at')->nullable();
            ->timestamps();
            ->foreign('broker_id')->references('id')->on('brokers')->onDelete('cascade');
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('commissions');
    }
};