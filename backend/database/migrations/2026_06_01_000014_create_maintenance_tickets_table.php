<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('maintenance_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_id');
            $table->uuid('unit_id');
            $table->string('category');
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->timestamps();
            $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('maintenance_tickets');
    }
};