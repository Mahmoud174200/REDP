<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Currencies Table ──
        Schema::create('currencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 10)->unique(); // USD, EGP, SAR, AED
            $table->string('name');
            $table->string('symbol', 10);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // ── Exchange Rates Table ──
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_currency_id');
            $table->uuid('to_currency_id');
            $table->decimal('rate', 12, 6); // Exchange multiplier rate
            $table->dateTime('last_updated_at');
            $table->timestamps();

            $table->foreign('from_currency_id')->references('id')->on('currencies')->cascadeOnDelete();
            $table->foreign('to_currency_id')->references('id')->on('currencies')->cascadeOnDelete();
            $table->unique(['from_currency_id', 'to_currency_id']);
        });

        // ── Database translations Table ──
        Schema::create('translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('locale', 10); // e.g. en, ar
            $table->string('group'); // e.g. ui, errors
            $table->string('key'); // e.g. welcome_message
            $table->text('value'); // translated text
            $table->timestamps();

            $table->unique(['locale', 'group', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('currencies');
    }
};
