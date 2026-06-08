<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Legal Cases ──
        Schema::create('legal_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('case_number')->unique();
            $table->string('title');
            $table->string('entity_type', 100)->nullable(); // e.g. 'App\Models\Contract'
            $table->uuid('entity_id')->nullable();
            $table->uuid('company_id')->nullable();
            $table->enum('type', ['litigation', 'arbitration', 'dispute', 'consultation'])->default('litigation');
            $table->enum('status', ['open', 'investigation', 'litigation', 'resolved', 'closed', 'archived'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->string('jurisdiction')->nullable();
            $table->string('court_name')->nullable();
            $table->text('description')->nullable();
            $table->decimal('claim_amount', 15, 2)->nullable();
            $table->decimal('legal_fees', 15, 2)->nullable();
            $table->uuid('assigned_lawyer_id')->nullable();
            $table->date('opened_at');
            $table->date('closed_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->foreign('assigned_lawyer_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['entity_type', 'entity_id']);
            $table->index(['status', 'priority']);
        });

        // ── Legal Parties (plaintiff, defendant, witnesses) ──
        Schema::create('legal_parties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->string('name');
            $table->enum('type', ['plaintiff', 'defendant', 'claimant', 'respondent', 'witness', 'expert'])->default('plaintiff');
            $table->enum('role', ['internal', 'external'])->default('external'); // Internal team vs external customer/entity
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('legal_cases')->cascadeOnDelete();
        });

        // ── Court Sessions / Hearings ──
        Schema::create('court_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->dateTime('session_date');
            $table->string('hall_number')->nullable();
            $table->string('judge_name')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled', 'attended', 'postponed', 'cancelled'])->default('scheduled');
            $table->dateTime('postponed_to')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('legal_cases')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['session_date', 'status']);
        });

        // ── Legal Documents Vault ──
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->string('name');
            $table->string('document_type', 100); // notice, power_of_attorney, brief, judgment
            $table->string('file_url');
            $table->uuid('uploaded_by')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('legal_cases')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        // ── Legal Actions / Deadlines ──
        Schema::create('legal_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->string('action_type', 100); // send_notice, file_suit, submit_defense
            $table->date('due_date')->nullable();
            $table->date('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('assigned_to')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('legal_cases')->cascadeOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['due_date', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_actions');
        Schema::dropIfExists('legal_documents');
        Schema::dropIfExists('court_sessions');
        Schema::dropIfExists('legal_parties');
        Schema::dropIfExists('legal_cases');
    }
};
