<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->uuid('company_id');
            $table->uuid('country_id')->nullable();
            $table->uuid('region_id')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->uuid('manager_id')->nullable();
            $table->string('latitude', 20)->nullable();
            $table->string('longitude', 20)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('country_id')->references('id')->on('enterprise_countries')->nullOnDelete();
            $table->foreign('region_id')->references('id')->on('regions')->nullOnDelete();
            $table->foreign('manager_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
