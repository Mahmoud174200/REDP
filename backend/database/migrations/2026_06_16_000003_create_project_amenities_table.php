<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('project_amenities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');

            $table->string('name'); // "حمام سباحة", "نادي رياضي"
            $table->string('name_ar')->nullable();
            $table->enum('type', [
                'swimming_pool',   // حمام سباحة
                'gym',             // نادي رياضي
                'garden',          // حديقة
                'playground',      // ملعب أطفال
                'mosque',          // مسجد
                'commercial_area', // منطقة تجارية
                'security_room',   // غرفة حراسة
                'clubhouse',       // كلوب هاوس
                'walking_track',   // مسار مشي
                'parking_lot',     // مواقف سيارات مشتركة
                'water_feature',   // نافورة/بحيرة صناعية
                'sports_court',    // ملعب رياضي
                'barbecue_area',   // منطقة شواء
                'kids_area',       // منطقة ألعاب أطفال
                'generator_room',  // غرفة مولدات
                'water_tanks',     // خزانات مياه
                'electrical_room', // غرفة كهرباء
                'guard_house',     // بوابة حراسة
                'other'            // أخرى
            ])->default('other');

            $table->decimal('area', 10, 2)->nullable(); // المساحة بالمتر المربع
            $table->integer('quantity')->default(1);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_amenities');
    }
};
