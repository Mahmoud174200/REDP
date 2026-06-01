<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('unit_number');
            $table->integer('floor');
            $table->string('type');
            $table->decimal('price', 15, 2);
            $table->string('status')->default('available');
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::dropIfExists('units');
    }
};