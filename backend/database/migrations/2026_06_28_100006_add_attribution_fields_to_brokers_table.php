<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Lead Attribution System
     * Extend: brokers  (slug + QR token + promo code for tracking)
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::table('brokers', function (Blueprint $table) {
            $table->string('slug', 80)->nullable()->after('referral_code');
            $table->string('qr_token', 64)->nullable()->after('slug');
            $table->string('promo_code', 64)->nullable()->after('qr_token');
            $table->unsignedBigInteger('referral_clicks')->default(0)->after('promo_code');

            $table->unique('slug', 'uq_brokers_slug');
            $table->unique('qr_token', 'uq_brokers_qr_token');
            $table->unique('promo_code', 'uq_brokers_promo_code');
        });
    }

    public function down(): void
    {
        Schema::table('brokers', function (Blueprint $table) {
            $table->dropUnique('uq_brokers_slug');
            $table->dropUnique('uq_brokers_qr_token');
            $table->dropUnique('uq_brokers_promo_code');
            $table->dropColumn(['slug', 'qr_token', 'promo_code', 'referral_clicks']);
        });
    }
};
