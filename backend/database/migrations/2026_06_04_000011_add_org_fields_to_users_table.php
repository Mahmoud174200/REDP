<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('company_id')->nullable()->after('status');
            $table->uuid('branch_id')->nullable()->after('company_id');
            $table->uuid('department_id')->nullable()->after('branch_id');
            $table->uuid('team_id')->nullable()->after('department_id');
            $table->uuid('position_id')->nullable()->after('team_id');
            $table->string('employee_number', 30)->nullable()->after('position_id');

            // Foreign keys — nullable since existing users won't have these yet
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('team_id')->references('id')->on('teams')->nullOnDelete();
            $table->foreign('position_id')->references('id')->on('positions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['team_id']);
            $table->dropForeign(['position_id']);
            $table->dropColumn(['company_id', 'branch_id', 'department_id', 'team_id', 'position_id', 'employee_number']);
        });
    }
};
