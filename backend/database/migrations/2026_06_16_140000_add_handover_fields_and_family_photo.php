<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->string('handover_status')->default('pending');
            $table->text('handover_report')->nullable();
            $table->text('handover_images')->nullable(); // JSON array of urls
            $table->text('handover_signature')->nullable(); // base64 or file path
        });

        Schema::table('family_members', function (Blueprint $table) {
            $table->string('photo_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn(['handover_status', 'handover_report', 'handover_images', 'handover_signature']);
        });

        Schema::table('family_members', function (Blueprint $table) {
            $table->dropColumn('photo_url');
        });
    }
};
