<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payment_plans', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('contract_id');
            ->integer('total_installments');
            ->integer('unpaid_installments');
            ->string('status')->default('active');
            ->timestamps();
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('payment_plans');
    }
};