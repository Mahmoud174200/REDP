<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Project Phases ──
        Schema::create('project_phases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('tenant_id')->nullable();
            $table->string('name');
            $table->enum('status', ['planned', 'active', 'completed'])->default('planned');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });

        // ── Construction Milestones ──
        Schema::create('construction_milestones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('phase_id');
            $table->string('title');
            $table->decimal('weight', 5, 2); // percentage weight, e.g. 15.00
            $table->decimal('progress_percentage', 5, 2)->default(0.00); // 0.00 to 100.00
            $table->enum('status', ['pending', 'delayed', 'completed'])->default('pending');
            $table->date('due_date');
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('phase_id')->references('id')->on('project_phases')->cascadeOnDelete();
        });

        // ── Bill of Quantities (BOQ Items) ──
        Schema::create('boq_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('phase_id');
            $table->string('item_code');
            $table->string('description');
            $table->string('unit'); // tons, m3, sqm
            $table->decimal('planned_quantity', 15, 2);
            $table->decimal('actual_quantity', 15, 2)->default(0.00);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();

            $table->foreign('phase_id')->references('id')->on('project_phases')->cascadeOnDelete();
        });

        // ── Resource Allocations ──
        Schema::create('resource_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('milestone_id');
            $table->enum('resource_type', ['labor', 'equipment', 'material']);
            $table->string('name');
            $table->integer('quantity');
            $table->decimal('cost', 15, 2);
            $table->timestamps();

            $table->foreign('milestone_id')->references('id')->on('construction_milestones')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_allocations');
        Schema::dropIfExists('boq_items');
        Schema::dropIfExists('construction_milestones');
        Schema::dropIfExists('project_phases');
    }
};
