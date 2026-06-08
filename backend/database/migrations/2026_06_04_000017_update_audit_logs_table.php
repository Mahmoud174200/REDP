<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('entity_type')->nullable()->after('action');
            $table->uuid('entity_id')->nullable()->after('entity_type');
            $table->json('old_values')->nullable()->after('details');
            $table->json('new_values')->nullable()->after('old_values');
            $table->string('user_agent')->nullable()->after('ip_address');
            $table->string('device_type')->nullable()->after('user_agent');
            $table->string('browser')->nullable()->after('device_type');
            $table->json('geo_location')->nullable()->after('browser');
            $table->string('session_id')->nullable()->after('geo_location');
        });
    }

    public function down(): void {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn([
                'entity_type',
                'entity_id',
                'old_values',
                'new_values',
                'user_agent',
                'device_type',
                'browser',
                'geo_location',
                'session_id'
            ]);
        });
    }
};
