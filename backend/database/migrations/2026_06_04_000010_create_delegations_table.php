<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('delegator_id'); // person delegating authority
            $table->uuid('delegate_id');  // person receiving authority
            $table->uuid('company_id');
            $table->enum('type', ['full', 'approval_only', 'view_only'])->default('full');
            $table->text('reason')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->uuid('created_by');
            $table->timestamps();

            $table->foreign('delegator_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('delegate_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['delegator_id', 'status']);
            $table->index(['delegate_id', 'status']);
            $table->index(['end_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegations');
    }
};
