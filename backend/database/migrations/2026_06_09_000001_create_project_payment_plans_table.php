<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('project_payment_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('name');
            $table->string('name_ar');
            $table->decimal('down_payment_pct', 5, 2)->default(0.00);
            $table->integer('installments')->default(0);
            $table->decimal('discount_pct', 5, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('project_payment_plans');
    }
};
