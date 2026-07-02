<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cancellations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->decimal('refund_amount', 15, 2);
            $table->decimal('penalty_amount', 15, 2)->default(0.00);
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('cancellations');
    }
};