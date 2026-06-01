<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('projects', function (Blueprint ) {
            ->uuid('id')->primary();
            ->string('name');
            ->string('location');
            ->integer('total_units')->default(0);
            ->string('status')->default('planning');
            ->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('projects');
    }
};