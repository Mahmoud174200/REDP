<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cancellations', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('contract_id');
            ->decimal('refund_amount', 15, 2);
            ->decimal('penalty_amount', 15, 2)->default(0.00);
            ->string('status')->default('pending');
            ->timestamps();
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('cancellations');
    }
};