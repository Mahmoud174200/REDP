<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('building_hotspots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('building_id');
            $table->decimal('x_percent', 5, 2); // 0.00 - 100.00 horizontal position
            $table->decimal('y_percent', 5, 2); // 0.00 - 100.00 vertical position
            $table->string('label')->nullable();  // Custom display label override
            $table->string('pin_color', 20)->default('#003DA6');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('building_id')->references('id')->on('buildings')->onDelete('cascade');

            // Each building can only have one hotspot per project
            $table->unique(['project_id', 'building_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('building_hotspots');
    }
};
