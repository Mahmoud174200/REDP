<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            // Link to building and floor (optional — backward compatible)
            if (!Schema::hasColumn('units', 'building_id')) {
                $table->uuid('building_id')->nullable()->after('project_id');
                $table->foreign('building_id')->references('id')->on('buildings')->nullOnDelete();
            }
            if (!Schema::hasColumn('units', 'floor_id')) {
                $table->uuid('floor_id')->nullable()->after('building_id');
                $table->foreign('floor_id')->references('id')->on('building_floors')->nullOnDelete();
            }

            // Additional room details
            if (!Schema::hasColumn('units', 'living_rooms')) {
                $table->integer('living_rooms')->nullable()->after('bathrooms');
            }
            if (!Schema::hasColumn('units', 'kitchen_count')) {
                $table->integer('kitchen_count')->default(1)->after('living_rooms');
            }
            if (!Schema::hasColumn('units', 'balcony_count')) {
                $table->integer('balcony_count')->default(0)->after('kitchen_count');
            }
            if (!Schema::hasColumn('units', 'balcony_area')) {
                $table->decimal('balcony_area', 8, 2)->nullable()->after('balcony_count');
            }

            // Special features
            if (!Schema::hasColumn('units', 'has_maid_room')) {
                $table->boolean('has_maid_room')->default(false)->after('balcony_area');
            }
            if (!Schema::hasColumn('units', 'has_storage')) {
                $table->boolean('has_storage')->default(false)->after('has_maid_room');
            }
            if (!Schema::hasColumn('units', 'has_private_garden')) {
                $table->boolean('has_private_garden')->default(false)->after('has_storage');
            }
            if (!Schema::hasColumn('units', 'has_private_parking')) {
                $table->boolean('has_private_parking')->default(false)->after('has_private_garden');
            }

            // Area breakdown
            if (!Schema::hasColumn('units', 'net_area')) {
                $table->decimal('net_area', 10, 2)->nullable()->after('area'); // صافي المساحة
            }

            // Finishing
            if (!Schema::hasColumn('units', 'finishing_type')) {
                $table->enum('finishing_type', [
                    'core_shell',       // على الطوب الأحمر
                    'semi_finished',    // نصف تشطيب
                    'fully_finished',   // تشطيب كامل
                    'super_lux',        // سوبر لوكس
                    'ultra_super_lux'   // ألترا سوبر لوكس
                ])->nullable()->after('net_area');
            }

            // Direction/orientation
            if (!Schema::hasColumn('units', 'orientation')) {
                $table->enum('orientation', [
                    'north', 'south', 'east', 'west',
                    'north_east', 'north_west', 'south_east', 'south_west'
                ])->nullable()->after('view_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $columns = [
                'building_id', 'floor_id', 'living_rooms', 'kitchen_count',
                'balcony_count', 'balcony_area', 'has_maid_room', 'has_storage',
                'has_private_garden', 'has_private_parking', 'net_area',
                'finishing_type', 'orientation'
            ];
            // Drop foreign keys first
            try { $table->dropForeign(['building_id']); } catch (\Exception $e) {}
            try { $table->dropForeign(['floor_id']); } catch (\Exception $e) {}

            $drop = [];
            foreach ($columns as $col) {
                if (Schema::hasColumn('units', $col)) $drop[] = $col;
            }
            if (!empty($drop)) $table->dropColumn($drop);
        });
    }
};
