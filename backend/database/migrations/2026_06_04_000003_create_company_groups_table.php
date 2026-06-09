<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->uuid('parent_group_id')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('parent_group_id')->references('id')->on('company_groups')->nullOnDelete();
        });

        Schema::create('company_group_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_group_id');
            $table->uuid('company_id');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('company_group_id')->references('id')->on('company_groups')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->unique(['company_group_id', 'company_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_group_members');
        Schema::dropIfExists('company_groups');
    }
};
