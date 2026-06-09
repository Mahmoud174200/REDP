<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // 1. Purchase Requests
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->uuid('requested_by');
            $table->uuid('department_id')->nullable();
            $table->decimal('estimated_cost', 15, 2);
            $table->date('required_by_date')->nullable();
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected', 'rfq_created', 'ordered', 'completed'])->default('draft');
            $table->json('items'); // [{name, description, quantity, estimated_unit_price}]
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        // 2. RFQs (Request For Quotations)
        Schema::create('rfqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('purchase_request_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('due_date');
            $table->enum('status', ['draft', 'sent', 'closed', 'completed'])->default('draft');
            $table->json('items'); // [{name, description, quantity}]
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->onDelete('set null');
        });

        // 3. Vendor Quotations
        Schema::create('vendor_quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('rfq_id');
            $table->uuid('vendor_id');
            $table->dateTime('submitted_date')->nullable();
            $table->decimal('total_quoted_amount', 15, 2);
            $table->integer('delivery_timeline_days')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'under_review', 'accepted', 'rejected'])->default('pending');
            $table->json('items'); // [{item_index, quoted_unit_price}]
            $table->timestamps();

            $table->foreign('rfq_id')->references('id')->on('rfqs')->onDelete('cascade');
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
        });

        // 4. Purchase Orders (PO)
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->string('po_number')->unique();
            $table->uuid('purchase_request_id')->nullable();
            $table->uuid('rfq_id')->nullable();
            $table->uuid('vendor_quotation_id')->nullable();
            $table->uuid('vendor_id');
            $table->string('title');
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected', 'sent_to_vendor', 'goods_received', 'partially_received', 'invoiced', 'completed', 'cancelled'])->default('draft');
            $table->uuid('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->json('items'); // [{name, quantity, unit_price}]
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->onDelete('set null');
            $table->foreign('rfq_id')->references('id')->on('rfqs')->onDelete('set null');
            $table->foreign('vendor_quotation_id')->references('id')->on('vendor_quotations')->onDelete('set null');
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });

        // 5. Goods Receipts
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('purchase_order_id');
            $table->uuid('received_by');
            $table->date('received_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['draft', 'verified', 'disputed'])->default('draft');
            $table->json('items'); // [{item_index, name, ordered_quantity, received_quantity, status}]
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('cascade');
        });

        // 6. Vendor Invoices
        Schema::create('vendor_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('vendor_id');
            $table->uuid('purchase_order_id')->nullable();
            $table->string('invoice_number');
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0.00);
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['pending_matching', 'matched', 'mismatch_disputed', 'approved', 'paid', 'cancelled'])->default('pending_matching');
            $table->text('matching_notes')->nullable();
            $table->json('items'); // [{name, quantity, unit_price}]
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('set null');
        });
    }

    public function down(): void {
        Schema::dropIfExists('vendor_invoices');
        Schema::dropIfExists('goods_receipts');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('vendor_quotations');
        Schema::dropIfExists('rfqs');
        Schema::dropIfExists('purchase_requests');
    }
};
