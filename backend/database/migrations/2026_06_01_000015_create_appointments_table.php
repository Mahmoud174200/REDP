<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('appointments', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('user_id');
            ->string('type');
            ->timestamp('scheduled_at')->nullable();
            ->string('status')->default('pending');
            ->timestamps();
            ->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('appointments');
    }
};