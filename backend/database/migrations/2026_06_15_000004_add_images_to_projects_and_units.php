<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Add image_url to projects table
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'image_url')) {
                $table->string('image_url')->nullable()->after('status');
            }
        });

        // Add layout_image_url to units table
        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'layout_image_url')) {
                $table->string('layout_image_url')->nullable()->after('layout_description');
            }
        });

        // Create project_media table for building and floor plan images
        if (!Schema::hasTable('project_media')) {
            Schema::create('project_media', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('project_id');
                $table->string('media_type'); // 'building', 'floor_plan'
                $table->string('reference_key'); // building name or "BuildingA|3" for floor 3
                $table->string('image_path');
                $table->string('caption')->nullable();
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->index(['project_id', 'media_type', 'reference_key']);
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('project_media');

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });

        Schema::table('units', function (Blueprint $table) {
            if (Schema::hasColumn('units', 'layout_image_url')) {
                $table->dropColumn('layout_image_url');
            }
        });
    }
};
