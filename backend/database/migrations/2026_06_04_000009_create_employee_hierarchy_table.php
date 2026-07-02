<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_hierarchy', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('company_id');
            $table->uuid('branch_id')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('team_id')->nullable();
            $table->uuid('position_id')->nullable();
            $table->uuid('direct_manager_id')->nullable();
            $table->uuid('indirect_manager_id')->nullable();
            $table->uuid('matrix_manager_id')->nullable();
            $table->string('employee_number', 30)->nullable();
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_leave', 'terminated', 'probation'])->default('active');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('team_id')->references('id')->on('teams')->nullOnDelete();
            $table->foreign('position_id')->references('id')->on('positions')->nullOnDelete();
            $table->foreign('direct_manager_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('indirect_manager_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('matrix_manager_id')->references('id')->on('users')->nullOnDelete();

            $table->unique(['user_id', 'company_id']);
            $table->index(['company_id', 'department_id', 'status']);
            $table->index(['direct_manager_id']);
            $table->unique('employee_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_hierarchy');
    }
};
