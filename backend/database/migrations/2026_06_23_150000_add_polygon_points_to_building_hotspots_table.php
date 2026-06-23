<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('building_hotspots', function (Blueprint $table) {
            $table->json('polygon_points')->nullable()->after('pin_color');
            // Stores array of {x, y} coordinate pairs as percentages
            // Example: [{"x": 42.5, "y": 22.1}, {"x": 48.3, "y": 22.1}, ...]
        });
    }

    public function down(): void
    {
        Schema::table('building_hotspots', function (Blueprint $table) {
            $table->dropColumn('polygon_points');
        });
    }
};
