<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── KPI Metrics ──
        Schema::create('kpi_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->string('name'); // e.g. 'revenue_ytd', 'lead_conversion_rate', etc.
            $table->string('display_name');
            $table->string('category'); // e.g. 'finance', 'sales', 'procurement'
            $table->decimal('value', 15, 2); // Numerical metric value
            $table->decimal('target_value', 15, 2)->nullable(); // Target for goal tracking
            $table->string('period', 20); // e.g. 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
            $table->dateTime('calculated_at');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->unique(['company_id', 'name', 'period']);
        });

        // ── Dashboard Layouts ──
        Schema::create('dashboard_layouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('role_type')->unique(); // e.g. 'ceo', 'director', 'regional_manager', 'branch_manager'
            $table->json('widgets')->nullable(); // List of widgets configured for this role
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_layouts');
        Schema::dropIfExists('kpi_metrics');
    }
};
