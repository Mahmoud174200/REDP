<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Land Information
            $table->decimal('land_area', 12, 2)->nullable()->after('status'); // مساحة الأرض
            $table->enum('land_area_unit', ['sqm', 'feddan', 'acre'])->default('sqm')->after('land_area');
            $table->decimal('building_ratio', 5, 2)->nullable()->after('land_area_unit'); // نسبة البناء %
            $table->decimal('max_height_allowed', 6, 2)->nullable()->after('building_ratio'); // الارتفاع المسموح بالمتر
            $table->integer('max_floors_allowed')->nullable()->after('max_height_allowed');

            // Totals (auto-calculated or manually entered)
            $table->integer('total_buildings_count')->default(0)->after('max_floors_allowed');
            $table->decimal('total_built_area', 14, 2)->nullable()->after('total_buildings_count'); // إجمالي المساحات المبنية
            $table->decimal('total_green_area', 12, 2)->nullable()->after('total_built_area'); // المسطحات الخضراء
            $table->decimal('total_roads_area', 12, 2)->nullable()->after('total_green_area'); // الطرق والممرات
            $table->decimal('total_parking_spaces', 8, 0)->nullable()->after('total_roads_area'); // عدد مواقف السيارات

            // Infrastructure
            $table->text('infrastructure_notes')->nullable()->after('total_parking_spaces');

            // Density
            $table->decimal('density_per_feddan', 8, 2)->nullable()->after('infrastructure_notes'); // الكثافة السكانية

            // Master plan status
            $table->enum('master_plan_status', ['draft', 'review', 'approved'])->default('draft')->after('density_per_feddan');

            // Project type
            $table->enum('project_type', [
                'residential',   // سكني
                'commercial',    // تجاري
                'mixed_use',     // متعدد الاستخدامات
                'resort'         // منتجع
            ])->default('residential')->after('master_plan_status');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $columns = [
                'land_area', 'land_area_unit', 'building_ratio', 'max_height_allowed',
                'max_floors_allowed', 'total_buildings_count', 'total_built_area',
                'total_green_area', 'total_roads_area', 'total_parking_spaces',
                'infrastructure_notes', 'density_per_feddan', 'master_plan_status',
                'project_type'
            ];
            $drop = [];
            foreach ($columns as $col) {
                if (Schema::hasColumn('projects', $col)) {
                    $drop[] = $col;
                }
            }
            if (!empty($drop)) {
                $table->dropColumn($drop);
            }
        });
    }
};
