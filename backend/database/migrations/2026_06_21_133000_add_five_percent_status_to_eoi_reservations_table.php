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
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->string('five_percent_status')->nullable()->after('five_percent_paid_at');
            $table->text('five_percent_review_notes')->nullable()->after('five_percent_status');
            $table->uuid('five_percent_reviewer_id')->nullable()->after('five_percent_review_notes');
            $table->timestamp('five_percent_reviewed_at')->nullable()->after('five_percent_reviewer_id');
            
            $table->foreign('five_percent_reviewer_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->dropForeign(['five_percent_reviewer_id']);
            $table->dropColumn([
                'five_percent_status',
                'five_percent_review_notes',
                'five_percent_reviewer_id',
                'five_percent_reviewed_at'
            ]);
        });
    }
};
