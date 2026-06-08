<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('code', 20);
            $table->uuid('company_id');
            $table->uuid('department_id')->nullable();
            $table->integer('level')->default(5); // 1=C-Suite, 2=VP, 3=Director, 4=Manager, 5=Staff
            $table->decimal('min_salary', 14, 2)->nullable();
            $table->decimal('max_salary', 14, 2)->nullable();
            $table->text('description')->nullable();
            $table->json('responsibilities')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->unique(['company_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
