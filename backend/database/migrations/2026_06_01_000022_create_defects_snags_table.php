<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('defects_snags', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('unit_id');
            ->text('description');
            ->string('severity')->default('medium'); // 'low', 'medium', 'high', 'critical'
            ->string('status')->default('pending');
            ->timestamps();
            ->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('defects_snags');
    }
};