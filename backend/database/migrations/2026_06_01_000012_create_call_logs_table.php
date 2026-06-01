<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('call_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lead_id');
            $table->string('file_url')->nullable();
            $table->integer('duration');
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('call_logs');
    }
};