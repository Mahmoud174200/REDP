<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an interactive floor-plan hotspot region to each unit.
 * Stored as JSON: { "x": float, "y": float, "w": float, "h": float } in
 * percentages (0-100) relative to the floor plan image, so the public
 * unit-selection page can render clickable apartment regions over the plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'floor_plan_hotspot')) {
                $table->json('floor_plan_hotspot')->nullable()->after('layout_image_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            if (Schema::hasColumn('units', 'floor_plan_hotspot')) {
                $table->dropColumn('floor_plan_hotspot');
            }
        });
    }
};
