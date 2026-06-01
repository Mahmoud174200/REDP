<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('collections_queue', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('contract_id');
            ->string('aging_bucket'); // '30_days', '60_days', '90_days_plus'
            ->decimal('outstanding_amount', 15, 2);
            ->string('status')->default('active');
            ->timestamps();
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('collections_queue');
    }
};