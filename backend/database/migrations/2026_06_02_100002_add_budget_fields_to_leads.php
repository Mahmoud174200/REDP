<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->decimal('budget', 15, 2)->nullable()->after('lead_score');
            $table->string('payment_method')->default('installment')->after('budget'); // cash, installment
            $table->uuid('interested_project_id')->nullable()->after('payment_method');

            $table->foreign('interested_project_id')
                  ->references('id')->on('projects')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['interested_project_id']);
            $table->dropColumn(['budget', 'payment_method', 'interested_project_id']);
        });
    }
};
