<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'area')) {
                $table->decimal('area', 10, 2)->nullable()->after('type');
            }
            if (!Schema::hasColumn('units', 'bedrooms')) {
                $table->integer('bedrooms')->nullable()->after('area');
            }
            if (!Schema::hasColumn('units', 'bathrooms')) {
                $table->integer('bathrooms')->nullable()->after('bedrooms');
            }
            if (!Schema::hasColumn('units', 'view_type')) {
                $table->string('view_type')->nullable()->after('bathrooms');
            }
            if (!Schema::hasColumn('units', 'building')) {
                $table->string('building')->nullable()->after('view_type');
            }
            if (!Schema::hasColumn('units', 'layout_description')) {
                $table->text('layout_description')->nullable()->after('building');
            }
            if (!Schema::hasColumn('units', 'handover_date')) {
                $table->date('handover_date')->nullable()->after('status');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'delivery_date')) {
                $table->date('delivery_date')->nullable()->after('status');
            }
        });
    }

    public function down(): void {
        Schema::table('units', function (Blueprint $table) {
            $cols = ['area', 'bedrooms', 'bathrooms', 'view_type', 'building', 'layout_description', 'handover_date'];
            $drop = [];
            foreach ($cols as $c) {
                if (Schema::hasColumn('units', $c)) $drop[] = $c;
            }
            if (!empty($drop)) $table->dropColumn($drop);
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'delivery_date')) {
                $table->dropColumn('delivery_date');
            }
        });
    }
};
