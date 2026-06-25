<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->string('education')->nullable()->comment('What they graduated from');
            $table->string('job_title')->nullable()->comment('Current occupation');
            $table->decimal('monthly_income', 15, 2)->nullable()->comment('Monthly income amount');
            $table->string('income_currency')->nullable()->comment('Chosen currency for income');
            $table->string('marital_status')->nullable()->comment('Marital status');
            $table->integer('number_of_children')->nullable()->default(0)->comment('Number of children');
            $table->string('children_ages')->nullable()->comment('Ages of children (comma separated or text)');
            $table->string('children_schools')->nullable()->comment('Schools or universities of children');
            $table->string('current_residence')->nullable()->comment('Current residence address');
            $table->string('residence_type')->nullable()->comment('Owned or rented');
            $table->text('cars_owned')->nullable()->comment('Details of cars owned');
            $table->string('club_memberships')->nullable()->comment('Club memberships');
        });
    }

    public function down(): void
    {
        Schema::table('eoi_reservations', function (Blueprint $table) {
            $table->dropColumn([
                'education',
                'job_title',
                'monthly_income',
                'income_currency',
                'marital_status',
                'number_of_children',
                'children_ages',
                'children_schools',
                'current_residence',
                'residence_type',
                'cars_owned',
                'club_memberships',
            ]);
        });
    }
};
