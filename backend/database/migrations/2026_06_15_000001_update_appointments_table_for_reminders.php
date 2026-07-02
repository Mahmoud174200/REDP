<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('appointments', function (Blueprint $table) {
            // Modify user_id to be nullable so appointments can belong to leads before becoming clients
            $table->uuid('user_id')->nullable()->change();

            // Add foreign key for leads table
            $table->uuid('lead_id')->nullable()->after('user_id');
            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');

            // Add booking fields
            $table->date('booking_date')->nullable()->after('lead_id');
            $table->time('booking_time')->nullable()->after('booking_date');
            $table->string('booking_type')->nullable()->after('booking_time'); // 'online' or 'in_company'

            // Add reminder settings
            $table->boolean('remind_email')->default(true)->after('booking_type');
            $table->boolean('remind_sms')->default(false)->after('remind_email');
            $table->boolean('remind_whatsapp')->default(false)->after('remind_sms');

            // Add reminder sending status flags
            $table->boolean('email_sent')->default(false)->after('remind_whatsapp');
            $table->boolean('sms_sent')->default(false)->after('email_sent');
            $table->boolean('whatsapp_sent')->default(false)->after('sms_sent');
        });
    }

    public function down(): void {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['lead_id']);
            $table->dropColumn([
                'lead_id',
                'booking_date',
                'booking_time',
                'booking_type',
                'remind_email',
                'remind_sms',
                'remind_whatsapp',
                'email_sent',
                'sms_sent',
                'whatsapp_sent'
            ]);

            $table->uuid('user_id')->nullable(false)->change();
        });
    }
};
