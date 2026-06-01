<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('maintenance_tickets', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('client_id');
            ->uuid('unit_id');
            ->string('category');
            ->string('title');
            ->text('description');
            ->string('status')->default('open');
            ->string('priority')->default('medium');
            ->timestamps();
            ->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            ->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('maintenance_tickets');
    }
};