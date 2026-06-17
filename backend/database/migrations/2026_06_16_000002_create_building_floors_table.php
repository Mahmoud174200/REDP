<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('building_floors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('building_id');

            $table->integer('floor_number'); // -2,-1 = بدروم، 0 = أرضي، 1+ = متكرر
            $table->string('floor_label')->nullable(); // "الدور الأرضي"، "الدور الأول"
            $table->enum('floor_type', [
                'basement',   // بدروم (مواقف/مخازن)
                'ground',     // أرضي
                'mezzanine',  // ميزانين
                'typical',    // دور متكرر
                'roof',       // سطح (خدمات)
                'penthouse'   // بنتهاوس
            ])->default('typical');

            // Area metrics (sqm)
            $table->decimal('gross_area', 10, 2)->nullable(); // المساحة الإجمالية للدور
            $table->decimal('common_area', 10, 2)->nullable(); // ممرات + سلالم + لوبي
            $table->decimal('net_usable_area', 10, 2)->nullable(); // صافي المساحة القابلة للاستخدام

            $table->integer('units_count')->default(0); // عدد الوحدات في هذا الدور
            $table->decimal('ceiling_height', 4, 2)->default(2.80); // ارتفاع السقف

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('building_id')->references('id')->on('buildings')->cascadeOnDelete();
            $table->unique(['building_id', 'floor_number']);
            $table->index(['building_id', 'floor_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('building_floors');
    }
};
