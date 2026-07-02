<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Family Members table
        Schema::create('family_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // homeowner
            $table->string('name');
            $table->string('relationship'); // 'spouse', 'child', 'parent', 'sibling', 'other'
            $table->string('national_id')->nullable();
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Vehicles table
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // homeowner
            $table->string('make'); // e.g. Toyota, BMW
            $table->string('model'); // e.g. Camry, X5
            $table->string('color');
            $table->string('plate_number');
            $table->integer('year')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Service Requests table (electrician, plumber, etc.)
        Schema::create('service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // homeowner
            $table->uuid('unit_id');
            $table->string('service_type'); // 'electrician', 'plumber', 'carpenter', 'ac_technician', 'painter', 'general'
            $table->string('title');
            $table->text('description');
            $table->string('priority')->default('medium'); // 'low', 'medium', 'high', 'urgent'
            $table->string('status')->default('pending'); // 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
            $table->string('assigned_vendor')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });

        // Resale Requests table
        Schema::create('resale_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // homeowner requesting resale
            $table->uuid('unit_id');
            $table->decimal('asking_price', 15, 2)->nullable();
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // 'pending', 'approved', 'listed', 'sold', 'rejected', 'cancelled'
            $table->uuid('reviewed_by')->nullable(); // company sales who reviewed
            $table->text('review_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resale_requests');
        Schema::dropIfExists('service_requests');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('family_members');
    }
};
