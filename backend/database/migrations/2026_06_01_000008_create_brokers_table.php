<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('brokers', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('user_id');
            ->string('agency_name');
            ->decimal('commission_rate', 5, 2);
            ->string('status')->default('pending');
            ->timestamps();
            ->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('brokers');
    }
};