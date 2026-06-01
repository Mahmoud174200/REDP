<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('units', function (Blueprint ) {
            ->uuid('id')->primary();
            ->uuid('project_id');
            ->string('unit_number');
            ->integer('floor');
            ->string('type');
            ->decimal('price', 15, 2);
            ->string('status')->default('available');
            ->timestamps();
            ->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('units');
    }
};