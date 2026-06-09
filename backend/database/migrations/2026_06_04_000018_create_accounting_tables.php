<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // 1. Chart of Accounts Table
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->string('code');
            $table->string('name');
            $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
            $table->uuid('parent_id')->nullable();
            $table->boolean('is_reconciled')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('chart_of_accounts')->onDelete('cascade');
            $table->unique(['company_id', 'code']);
        });

        // 2. Cost Centers Table
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('code');
            $table->string('name');
            $table->uuid('parent_id')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('cost_centers')->onDelete('cascade');
            $table->unique(['company_id', 'code']);
        });

        // 3. Profit Centers Table
        Schema::create('profit_centers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('code');
            $table->string('name');
            $table->uuid('parent_id')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('profit_centers')->onDelete('cascade');
            $table->unique(['company_id', 'code']);
        });

        // 4. Journal Entries Table
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('entry_number')->unique();
            $table->string('reference')->nullable();
            $table->text('description');
            $table->date('entry_date');
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft');
            $table->uuid('created_by');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });

        // 5. Journal Lines Table
        Schema::create('journal_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('journal_entry_id');
            $table->uuid('account_id');
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('credit', 15, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->uuid('cost_center_id')->nullable();
            $table->uuid('profit_center_id')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('chart_of_accounts')->onDelete('cascade');
            $table->foreign('cost_center_id')->references('id')->on('cost_centers')->onDelete('set null');
            $table->foreign('profit_center_id')->references('id')->on('profit_centers')->onDelete('set null');
        });

        // 6. General Ledger Table
        Schema::create('general_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('account_id');
            $table->integer('fiscal_year');
            $table->integer('period'); // 1 to 12
            $table->decimal('opening_balance', 15, 2)->default(0.00);
            $table->decimal('debit_amount', 15, 2)->default(0.00);
            $table->decimal('credit_amount', 15, 2)->default(0.00);
            $table->decimal('closing_balance', 15, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('chart_of_accounts')->onDelete('cascade');
            $table->unique(['company_id', 'account_id', 'fiscal_year', 'period'], 'gl_unique_period');
        });

        // 7. Budgets Table
        Schema::create('budgets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('account_id');
            $table->integer('fiscal_year');
            $table->integer('period'); // 1 to 12
            $table->decimal('amount', 15, 2);
            $table->decimal('spent_amount', 15, 2)->default(0.00);
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('chart_of_accounts')->onDelete('cascade');
            $table->unique(['company_id', 'account_id', 'fiscal_year', 'period'], 'budget_unique_period');
        });
    }

    public function down(): void {
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('general_ledger');
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('profit_centers');
        Schema::dropIfExists('cost_centers');
        Schema::dropIfExists('chart_of_accounts');
    }
};
