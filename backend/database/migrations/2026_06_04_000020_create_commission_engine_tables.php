<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // 1. Commission Rules Table
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('title');
            $table->uuid('project_id')->nullable();
            $table->string('unit_type')->nullable();
            $table->enum('tier_type', ['tier_1', 'tier_2', 'tier_3', 'broker', 'sales_agent', 'manager', 'director']);
            $table->decimal('min_deal_size', 15, 2)->default(0.00);
            $table->decimal('max_deal_size', 15, 2)->default(999999999.00);
            $table->decimal('commission_percentage', 5, 2);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // 2. Commission Payouts Table
        Schema::create('commission_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('payout_number')->unique();
            $table->enum('recipient_type', ['user', 'broker']);
            $table->uuid('user_id')->nullable();
            $table->uuid('broker_id')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['pending_approval', 'approved', 'rejected', 'paid'])->default('pending_approval');
            $table->uuid('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('broker_id')->references('id')->on('brokers')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });

        // 3. Commission Calculations Table
        Schema::create('commission_calculations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('payment_id');
            $table->uuid('contract_id');
            $table->uuid('rule_id');
            $table->uuid('payout_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('broker_id')->nullable();
            $table->decimal('deal_amount', 15, 2);
            $table->decimal('calculated_percentage', 5, 2);
            $table->decimal('calculated_amount', 15, 2);
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('payment_id')->references('id')->on('payments')->onDelete('cascade');
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
            $table->foreign('rule_id')->references('id')->on('commission_rules')->onDelete('cascade');
            $table->foreign('payout_id')->references('id')->on('commission_payouts')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('broker_id')->references('id')->on('brokers')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('commission_calculations');
        Schema::dropIfExists('commission_payouts');
        Schema::dropIfExists('commission_rules');
    }
};
