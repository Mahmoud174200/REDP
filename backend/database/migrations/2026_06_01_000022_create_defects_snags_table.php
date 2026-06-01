<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('defects_snags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_id');
            $table->text('description');
            $table->string('severity')->default('medium'); // 'low', 'medium', 'high', 'critical'
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('defects_snags');
    }
};