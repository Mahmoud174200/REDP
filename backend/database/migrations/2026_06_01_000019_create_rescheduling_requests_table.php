<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('rescheduling_requests', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('contract_id');
            ->text('reason');
            ->integer('proposed_installments_count');
            ->string('status')->default('pending');
            ->timestamps();
            ->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('rescheduling_requests');
    }
};