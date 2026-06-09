<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 20);
            $table->uuid('branch_id')->nullable();
            $table->uuid('company_id');
            $table->uuid('parent_department_id')->nullable();
            $table->uuid('head_id')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('parent_department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('head_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['company_id', 'branch_id']);
            $table->unique(['company_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
