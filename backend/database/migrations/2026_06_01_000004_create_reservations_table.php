<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reservations', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('unit_id');
            ->uuid('client_id');
            ->decimal('eoi_amount', 15, 2);
            ->string('status')->default('pending');
            ->timestamp('expires_at')->nullable();
            ->timestamps();
            ->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
            ->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('reservations');
    }
};