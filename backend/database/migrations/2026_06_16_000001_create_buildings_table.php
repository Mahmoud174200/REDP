<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('name'); // e.g. "عمارة A", "فيلا 12"
            $table->string('name_ar')->nullable(); // Arabic name
            $table->enum('type', [
                'apartment_building', // عمارة سكنية
                'villa',             // فيلا
                'duplex_building',   // مبنى دوبلكس
                'townhouse',         // تاون هاوس
                'commercial',        // تجاري
                'mixed_use'          // متعدد الاستخدامات
            ])->default('apartment_building');

            // Structural info
            $table->integer('total_floors')->default(1); // عدد الأدوار فوق الأرض
            $table->boolean('has_basement')->default(false);
            $table->integer('basement_floors')->default(0);
            $table->boolean('has_roof_floor')->default(false);
            $table->boolean('has_elevator')->default(false);
            $table->integer('elevator_count')->default(0);
            $table->integer('staircase_count')->default(1);

            // Area metrics (all in sqm)
            $table->decimal('building_footprint_area', 12, 2)->nullable(); // مسطح البناء
            $table->decimal('total_built_area', 12, 2)->nullable(); // إجمالي المساحات المبنية
            $table->decimal('lobby_area', 10, 2)->nullable();
            $table->decimal('common_area_per_floor', 10, 2)->nullable(); // ممرات + سلالم

            // Parking
            $table->enum('parking_type', ['none', 'basement', 'ground', 'multi_level', 'outdoor'])->default('none');
            $table->integer('parking_capacity')->default(0);

            // Status & ordering
            $table->enum('status', ['planned', 'under_construction', 'completed'])->default('planned');
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->index(['project_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buildings');
    }
};
