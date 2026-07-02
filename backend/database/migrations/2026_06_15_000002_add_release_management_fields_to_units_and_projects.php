<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('projects', function (Blueprint $table) {
            $table->text('released_phases')->nullable();
        });

        Schema::table('units', function (Blueprint $table) {
            $table->string('phase')->default('Phase 1');
        });
    }

    public function down(): void {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('released_phases');
        });

        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('phase');
        });
    }
};
