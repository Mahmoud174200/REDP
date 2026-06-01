<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->uuid('assigned_agent_id')->nullable();
            $table->string('stage')->default('new');
            $table->string('kyc_status')->default('none');
            $table->string('source')->default('direct');
            $table->timestamps();
            $table->foreign('assigned_agent_id')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('leads');
    }
};