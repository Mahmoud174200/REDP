<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('leads', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('name');
            ->string('email');
            ->string('phone');
            ->uuid('assigned_agent_id')->nullable();
            ->string('stage')->default('new');
            ->string('kyc_status')->default('none');
            ->string('source')->default('direct');
            ->timestamps();
            ->foreign('assigned_agent_id')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('leads');
    }
};