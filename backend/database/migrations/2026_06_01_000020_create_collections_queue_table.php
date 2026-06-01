<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('collections_queue', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contract_id');
            $table->string('aging_bucket'); // '30_days', '60_days', '90_days_plus'
            $table->decimal('outstanding_amount', 15, 2);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('collections_queue');
    }
};