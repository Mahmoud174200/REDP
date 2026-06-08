<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enterprise_countries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code', 3)->unique(); // ISO 3166-1 alpha-2/3
            $table->string('phone_code', 10)->nullable();
            $table->string('currency_code', 3)->nullable();
            $table->string('timezone', 50)->default('UTC');
            $table->string('flag_emoji', 10)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enterprise_countries');
    }
};
