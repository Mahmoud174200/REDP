<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('tax_id')->nullable();
            $table->enum('type', ['holding', 'subsidiary', 'branch_company'])->default('subsidiary');
            $table->uuid('parent_company_id')->nullable();
            $table->string('logo_url')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->uuid('country_id')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('country_id')->references('id')->on('enterprise_countries')->nullOnDelete();
            $table->index(['parent_company_id']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
