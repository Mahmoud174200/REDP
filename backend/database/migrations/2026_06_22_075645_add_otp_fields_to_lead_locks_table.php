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
        Schema::table('lead_locks', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
            $table->string('verification_otp', 10)->nullable()->after('status');
            $table->timestamp('otp_expires_at')->nullable()->after('verification_otp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lead_locks', function (Blueprint $table) {
            $table->dropColumn(['verification_otp', 'otp_expires_at']);
            $table->string('status', 30)->default('active')->change();
        });
    }
};
