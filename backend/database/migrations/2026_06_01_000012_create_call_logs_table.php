<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('call_logs', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('lead_id');
            ->string('file_url')->nullable();
            ->integer('duration');
            ->timestamp('recorded_at')->nullable();
            ->timestamps();
            ->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('call_logs');
    }
};