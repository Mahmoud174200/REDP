<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop foreign key constraint
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        // 2. Make user_id nullable and add lead_id column
        Schema::table('notifications', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
            $table->uuid('lead_id')->nullable()->after('user_id');
        });

        // 3. Add foreign keys
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop both foreign keys
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['lead_id']);
            $table->dropForeign(['user_id']);
        });

        // 2. Drop lead_id column and make user_id not-nullable
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('lead_id');
            $table->uuid('user_id')->nullable(false)->change();
        });

        // 3. Re-add the original user_id foreign key constraint
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
