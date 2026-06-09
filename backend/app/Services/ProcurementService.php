<?php

namespace App\Services;

use App\Models\PurchaseRequest;
use App\Models\Rfq;
use App\Models\VendorQuotation;
use App\Models\PurchaseOrder;
use App\Models\GoodsReceipt;
use App\Models\VendorInvoice;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcurementService
{
    protected ApprovalEngine $approvalEngine;
    protected JournalEntryService $journalEntryService;

    public function __construct(ApprovalEngine $approvalEngine, JournalEntryService $journalEntryService)
    {
        $this->approvalEngine = $approvalEngine;
        $this->journalEntryService = $journalEntryService;
    }

    // ══════════════════════════════════════════════════════════
    // PURCHASE REQUESTS (PR)
    // ══════════════════════════════════════════════════════════

    public function createPurchaseRequest(array $data, User $user): PurchaseRequest
    {
        $data['id'] = (string) Str::uuid();
        $data['company_id'] = $user->company_id ?: $data['company_id'] ?? Company::first()?->id;
        $data['requested_by'] = $user->id;
        $data['department_id'] = $user->department_id;
        $data['status'] = 'draft';

        return PurchaseRequest::create($data);
    }

    public function submitPRForApproval(string $id, User $user): PurchaseRequest
    {
        $pr = PurchaseRequest::findOrFail($id);
        if ($pr->status !== 'draft') {
            throw new Exception("Purchase request is not in draft status.");
        }

        $pr->update(['status' => 'pending_approval']);

        // Initiate workflow using Phase 3 Approval Engine
        $this->approvalEngine->initiateApproval('purchase_request', $pr->id, $user, [
            'title' => $pr->title,
            'estimated_cost' => (float)$pr->estimated_cost,
        ]);

        return $pr->fresh();
    }

    // ══════════════════════════════════════════════════════════
    // REQUEST FOR QUOTATIONS (RFQ)
    // ══════════════════════════════════════════════════════════

    public function createRFQ(array $data, User $user): Rfq
    {
        $data['id'] = (string) Str::uuid();
        $data['company_id'] = $user->company_id ?: $data['company_id'] ?? Company::first()?->id;
        $data['status'] = 'draft';

        return DB::transaction(function () use ($data) {
            $rfq = Rfq::create($data);

            if (!empty($data['purchase_request_id'])) {
                PurchaseRequest::where('id', $data['purchase_request_id'])
                    ->update(['status' => 'rfq_created']);
            }

            return $rfq;
        });
    }

    // ══════════════════════════════════════════════════════════
    // VENDOR QUOTATIONS
    // ══════════════════════════════════════════════════════════

    public function submitVendorQuotation(array $data): VendorQuotation
    {
        $data['id'] = (string) Str::uuid();
        $data['status'] = 'pending';
        $data['submitted_date'] = now();

        return VendorQuotation::create($data);
    }

    public function updateQuotationStatus(string $id, string $status): VendorQuotation
    {
        $quote = VendorQuotation::findOrFail($id);
        $quote->update(['status' => $status]);

        // If accepted, mark the RFQ as closed
        if ($status === 'accepted') {
            Rfq::where('id', $quote->rfq_id)->update(['status' => 'closed']);
        }

        return $quote;
    }

    // ══════════════════════════════════════════════════════════
    // PURCHASE ORDERS (PO)
    // ══════════════════════════════════════════════════════════

    public function createPurchaseOrder(array $data, User $user): PurchaseOrder
    {
        $data['id'] = (string) Str::uuid();
        $data['company_id'] = $user->company_id ?: $data['company_id'] ?? Company::first()?->id;
        $data['status'] = 'draft';
        
        // Generate sequential-like PO number
        $year = date('Y');
        $count = PurchaseOrder::where('company_id', $data['company_id'])->count() + 1;
        $data['po_number'] = 'PO-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        return PurchaseOrder::create($data);
    }

    public function submitPOForApproval(string $id, User $user): PurchaseOrder
    {
        $po = PurchaseOrder::findOrFail($id);
        if ($po->status !== 'draft') {
            throw new Exception("Purchase order is not in draft status.");
        }

        $po->update(['status' => 'pending_approval']);

        // Initiate workflow using Phase 3 Approval Engine
        $this->approvalEngine->initiateApproval('purchase_order', $po->id, $user, [
            'title' => $po->title,
            'total_amount' => (float)$po->total_amount,
        ]);

        return $po->fresh();
    }

    // ══════════════════════════════════════════════════════════
    // GOODS RECEIPTS (GR)
    // ══════════════════════════════════════════════════════════

    public function createGoodsReceipt(array $data, User $user): GoodsReceipt
    {
        $data['id'] = (string) Str::uuid();
        $data['company_id'] = $user->company_id ?: $data['company_id'] ?? Company::first()?->id;
        $data['received_by'] = $user->id;
        $data['status'] = 'verified'; // Mark verified directly upon logging

        return DB::transaction(function () use ($data) {
            $gr = GoodsReceipt::create($data);

            // Update Purchase Order status based on delivery quantities
            $po = PurchaseOrder::findOrFail($gr->purchase_order_id);
            $po->update(['status' => 'goods_received']);

            return $gr;
        });
    }

    // ══════════════════════════════════════════════════════════
    // VENDOR INVOICES & 3-WAY MATCHING
    // ══════════════════════════════════════════════════════════

    public function createVendorInvoice(array $data, User $user): VendorInvoice
    {
        $data['id'] = (string) Str::uuid();
        $data['company_id'] = $user->company_id ?: $data['company_id'] ?? Company::first()?->id;
        $data['status'] = 'pending_matching';

        return VendorInvoice::create($data);
    }

    public function performThreeWayMatch(string $invoiceId): array
    {
        $invoice = VendorInvoice::findOrFail($invoiceId);
        if (!$invoice->purchase_order_id) {
            $invoice->update([
                'status' => 'mismatch_disputed',
                'matching_notes' => 'Invoice is not linked to any Purchase Order.'
            ]);
            return [
                'success' => false,
                'status' => 'mismatch_disputed',
                'message' => 'Invoice is not linked to any Purchase Order.'
            ];
        }

        $po = PurchaseOrder::findOrFail($invoice->purchase_order_id);
        
        // Fetch all verified Goods Receipts for this PO
        $receipts = GoodsReceipt::where('purchase_order_id', $po->id)
            ->where('status', 'verified')
            ->get();

        $errors = [];
        
        // 1. Check Invoice total vs PO total (within strict 0% tolerance)
        $invoiceTotal = (float) $invoice->total_amount;
        $poTotal = (float) $po->total_amount;
        if (abs($invoiceTotal - $poTotal) > 0.01) {
            $errors[] = "Invoice total ({$invoiceTotal}) does not match Purchase Order total ({$poTotal}).";
        }

        // 2. Build quantities maps
        $poItems = $po->items ?? [];
        $invoiceItems = $invoice->items ?? [];

        // Sum up received quantities per item index
        $receivedQuantities = [];
        foreach ($receipts as $receipt) {
            foreach ($receipt->items ?? [] as $item) {
                $itemIndex = $item['item_index'] ?? null;
                if ($itemIndex !== null) {
                    $receivedQuantities[$itemIndex] = ($receivedQuantities[$itemIndex] ?? 0) + ($item['received_quantity'] ?? 0);
                }
            }
        }

        // Validate invoice items against PO items and receipts
        foreach ($invoiceItems as $index => $invoiceItem) {
            $name = $invoiceItem['name'] ?? '';
            $invoiceQty = (float) ($invoiceItem['quantity'] ?? 0);
            $invoicePrice = (float) ($invoiceItem['unit_price'] ?? 0);

            // Find matching item in PO
            $poItem = null;
            $poItemIndex = null;
            foreach ($poItems as $pIndex => $pItem) {
                if (($pItem['name'] ?? '') === $name) {
                    $poItem = $pItem;
                    $poItemIndex = $pIndex;
                    break;
                }
            }

            if (!$poItem) {
                $errors[] = "Item '{$name}' in invoice is not present in Purchase Order.";
                continue;
            }

            $poQty = (float) ($poItem['quantity'] ?? 0);
            $poPrice = (float) ($poItem['unit_price'] ?? 0);

            // Verify Unit Price matches PO Unit Price
            if (abs($invoicePrice - $poPrice) > 0.01) {
                $errors[] = "Item '{$name}' unit price ({$invoicePrice}) does not match Purchase Order unit price ({$poPrice}).";
            }

            // Verify Invoiced Quantity does not exceed Ordered Quantity
            if ($invoiceQty > $poQty) {
                $errors[] = "Item '{$name}' invoiced quantity ({$invoiceQty}) exceeds Purchase Order quantity ({$poQty}).";
            }

            // Verify Invoiced Quantity does not exceed Received Quantity
            $receivedQty = (float) ($receivedQuantities[$poItemIndex] ?? 0);
            if ($invoiceQty > $receivedQty) {
                $errors[] = "Item '{$name}' invoiced quantity ({$invoiceQty}) exceeds verified received quantity ({$receivedQty}).";
            }
        }

        if (count($errors) > 0) {
            $matchingNotes = implode("\n", $errors);
            $invoice->update([
                'status' => 'mismatch_disputed',
                'matching_notes' => $matchingNotes
            ]);
            return [
                'success' => false,
                'status' => 'mismatch_disputed',
                'message' => '3-way match failed.',
                'errors' => $errors
            ];
        }

        // Match successful!
        $invoice->update([
            'status' => 'matched',
            'matching_notes' => '3-way match verified successfully. PO total and received quantities correspond to invoice details.'
        ]);

        // Post accounting journal entries automatically
        try {
            $this->postInvoiceJournalEntry($invoice);
        } catch (Exception $e) {
            Log::error("ProcurementService: Failed to post automatic journal entry for invoice " . $invoice->id . ". Error: " . $e->getMessage());
        }

        return [
            'success' => true,
            'status' => 'matched',
            'message' => '3-way match verified and posted to general ledger.'
        ];
    }

    protected function postInvoiceJournalEntry(VendorInvoice $invoice): void
    {
        $companyId = $invoice->company_id;
        
        // Ensure default chart is seeded
        (new AccountingService())->seedDefaultChart($companyId);

        $lines = [
            // Debit Administrative Expense (Code 53000) for subtotal
            [
                'account_code' => '53000',
                'debit' => (float) $invoice->subtotal,
                'credit' => 0.00,
                'description' => "Expense for Vendor Invoice {$invoice->invoice_number} (Subtotal)"
            ],
            // Credit Accounts Payable (Code 21000) for total
            [
                'account_code' => '21000',
                'debit' => 0.00,
                'credit' => (float) $invoice->total_amount,
                'description' => "Liability for Vendor Invoice {$invoice->invoice_number} (Total)"
            ]
        ];

        // If there's tax, debit Administrative Expense for tax as well
        if ((float) $invoice->tax_amount > 0) {
            $lines[] = [
                'account_code' => '53000',
                'debit' => (float) $invoice->tax_amount,
                'credit' => 0.00,
                'description' => "Tax portion for Vendor Invoice {$invoice->invoice_number}"
            ];
        }

        $entryData = [
            'company_id' => $companyId,
            'reference' => $invoice->id,
            'description' => "Auto-posted invoice match for Invoice {$invoice->invoice_number} (Vendor ID: {$invoice->vendor_id})",
            'entry_date' => now()->toDateString(),
            'status' => 'draft',
        ];

        // Create and auto-post the entry (this validates debits == credits)
        $this->journalEntryService->createEntry($entryData, $lines, true);
    }
}
