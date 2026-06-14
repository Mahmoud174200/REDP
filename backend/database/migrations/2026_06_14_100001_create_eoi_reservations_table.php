<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * ─────────────────────────────────────────────────────────
     * REDP — Acquisition & Sales Engine
     * Table: eoi_reservations (EOI Reservation with Payment Workflow)
     * Manages EOI submissions with receipt upload, accountant review,
     * order number generation, queue assignment, and email notification.
     * ─────────────────────────────────────────────────────────
     */
    public function up(): void
    {
        Schema::create('eoi_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // ── Client & Project Links ──
            $table->uuid('lead_id');
            $table->uuid('project_id')->comment('Loose-link to projects table');
            $table->uuid('unit_id')->nullable()->comment('Optional unit reference');

            // ── Client Information ──
            $table->string('client_name');
            $table->string('client_email');
            $table->string('client_phone');

            // ── Payment Details ──
            $table->enum('client_location', ['inside_egypt', 'outside_egypt']);
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'international_bank_transfer']);
            $table->decimal('payment_amount', 15, 2)->default(0.00);
            $table->string('receipt_path')->comment('Uploaded payment receipt file path');

            // ── Workflow Status ──
            $table->enum('status', ['pending_review', 'approved', 'rejected'])->default('pending_review');
            $table->string('order_number')->nullable()->unique()->comment('Generated on approval: EOI-YYYY-NNNNNN');
            $table->integer('queue_number')->nullable()->comment('Per-project sequential queue position');

            // ── Review Details ──
            $table->uuid('reviewer_id')->nullable()->comment('Accountant who reviewed');
            $table->text('review_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('email_sent_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // ── Indexes ──
            $table->index('lead_id', 'idx_eoi_res_lead');
            $table->index('project_id', 'idx_eoi_res_project');
            $table->index('status', 'idx_eoi_res_status');
            $table->index('queue_number', 'idx_eoi_res_queue');
            $table->index('order_number', 'idx_eoi_res_order');
            $table->index('client_email', 'idx_eoi_res_email');
            $table->unique(['lead_id', 'project_id'], 'uq_eoi_res_lead_project');

            // ── Foreign Keys ──
            $table->foreign('lead_id')
                  ->references('id')->on('leads')
                  ->onDelete('cascade');
            $table->foreign('unit_id')
                  ->references('id')->on('units')
                  ->onDelete('set null');
            $table->foreign('reviewer_id')
                  ->references('id')->on('users')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eoi_reservations');
    }
};
