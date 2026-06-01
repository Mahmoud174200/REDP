<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('contract_id');
            ->decimal('amount', 15, 2);
            ->string('status')->default('pending');
            ->string('transaction_reference')->nullable();
            ->timestamp('paid_at')->nullable();
            ->timestamps();
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('payments');
    }
};