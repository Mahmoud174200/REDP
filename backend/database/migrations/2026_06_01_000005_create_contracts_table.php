<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contracts', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('reservation_id');
            ->uuid('client_id');
            ->string('document_path')->nullable();
            ->string('status')->default('draft');
            ->timestamp('signed_at')->nullable();
            ->timestamps();
            ->foreign('reservation_id')->references('id')->on('reservations')->onDelete('cascade');
            ->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('contracts');
    }
};