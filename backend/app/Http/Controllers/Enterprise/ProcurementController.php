<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\Rfq;
use App\Models\VendorQuotation;
use App\Models\PurchaseOrder;
use App\Models\GoodsReceipt;
use App\Models\VendorInvoice;
use App\Models\Company;
use App\Services\ProcurementService;
use Illuminate\Http\Request;

class ProcurementController extends Controller
{
    protected ProcurementService $procurementService;

    public function __construct(ProcurementService $procurementService)
    {
        $this->procurementService = $procurementService;
    }

    protected function getCompanyId(Request $request): string
    {
        $companyId = $request->user()?->company_id;
        if (!$companyId) {
            $company = Company::first();
            if (!$company) {
                $company = Company::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'name' => 'Default Company Holding',
                    'legal_name' => 'Default Real Estate Holding Co.',
                    'type' => 'holding',
                    'status' => 'active',
                ]);
            }
            $companyId = $company->id;
        }
        return $companyId;
    }

    // ── PURCHASE REQUESTS (PR) ──

    public function getPurchaseRequests(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $prs = PurchaseRequest::with(['requester', 'department'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $prs
        ]);
    }

    public function createPurchaseRequest(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'estimated_cost' => 'required|numeric|min:0',
            'required_by_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.estimated_unit_price' => 'required|numeric|min:0',
        ]);

        $fields['company_id'] = $companyId;

        $pr = $this->procurementService->createPurchaseRequest($fields, $request->user());

        return response()->json([
            'success' => true,
            'data' => $pr
        ], 201);
    }

    public function showPurchaseRequest(string $id)
    {
        $pr = PurchaseRequest::with(['requester', 'department', 'rfqs', 'purchaseOrders'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $pr
        ]);
    }

    public function updatePurchaseRequest(Request $request, string $id)
    {
        $pr = PurchaseRequest::findOrFail($id);
        if ($pr->status !== 'draft' && $pr->status !== 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft or rejected requests can be updated.'
            ], 400);
        }

        $fields = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'estimated_cost' => 'required|numeric|min:0',
            'required_by_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.estimated_unit_price' => 'required|numeric|min:0',
        ]);

        $pr->update($fields);

        return response()->json([
            'success' => true,
            'data' => $pr
        ]);
    }

    public function submitPRApproval(Request $request, string $id)
    {
        try {
            $pr = $this->procurementService->submitPRForApproval($id, $request->user());
            return response()->json([
                'success' => true,
                'data' => $pr
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // ── REQUESTS FOR QUOTATION (RFQ) ──

    public function getRFQs(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $rfqs = Rfq::with(['purchaseRequest', 'quotations.vendor'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rfqs
        ]);
    }

    public function createRFQ(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'purchase_request_id' => 'nullable|uuid|exists:purchase_requests,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'due_date' => 'required|date|after:now',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        $fields['company_id'] = $companyId;

        $rfq = $this->procurementService->createRFQ($fields, $request->user());

        return response()->json([
            'success' => true,
            'data' => $rfq
        ], 201);
    }

    public function showRFQ(string $id)
    {
        $rfq = Rfq::with(['purchaseRequest', 'quotations.vendor'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $rfq
        ]);
    }

    public function submitVendorQuotation(Request $request, string $rfqId)
    {
        $fields = $request->validate([
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'total_quoted_amount' => 'required|numeric|min:0',
            'delivery_timeline_days' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.item_index' => 'required|integer',
            'items.*.quoted_unit_price' => 'required|numeric|min:0',
        ]);

        $fields['rfq_id'] = $rfqId;

        $quote = $this->procurementService->submitVendorQuotation($fields);

        return response()->json([
            'success' => true,
            'data' => $quote
        ], 201);
    }

    public function getRFQQuotations(string $rfqId)
    {
        $quotes = VendorQuotation::with('vendor')
            ->where('rfq_id', $rfqId)
            ->orderBy('total_quoted_amount', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $quotes
        ]);
    }

    public function updateQuotationStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,under_review,accepted,rejected',
        ]);

        $quote = $this->procurementService->updateQuotationStatus($id, $request->input('status'));

        return response()->json([
            'success' => true,
            'data' => $quote
        ]);
    }

    // ── PURCHASE ORDERS (PO) ──

    public function getPurchaseOrders(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $pos = PurchaseOrder::with(['purchaseRequest', 'rfq', 'vendorQuotation', 'vendor', 'approver'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pos
        ]);
    }

    public function createPurchaseOrder(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'purchase_request_id' => 'nullable|uuid|exists:purchase_requests,id',
            'rfq_id' => 'nullable|uuid|exists:rfqs,id',
            'vendor_quotation_id' => 'nullable|uuid|exists:vendor_quotations,id',
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'title' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $fields['company_id'] = $companyId;

        $po = $this->procurementService->createPurchaseOrder($fields, $request->user());

        return response()->json([
            'success' => true,
            'data' => $po
        ], 201);
    }

    public function showPurchaseOrder(string $id)
    {
        $po = PurchaseOrder::with(['purchaseRequest', 'rfq', 'vendorQuotation', 'vendor', 'approver', 'goodsReceipts', 'vendorInvoices'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $po
        ]);
    }

    public function submitPOApproval(Request $request, string $id)
    {
        try {
            $po = $this->procurementService->submitPOForApproval($id, $request->user());
            return response()->json([
                'success' => true,
                'data' => $po
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // ── GOODS RECEIPTS (GR) ──

    public function getGoodsReceipts(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $receipts = GoodsReceipt::with(['purchaseOrder.vendor', 'receiver'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $receipts
        ]);
    }

    public function createGoodsReceipt(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'purchase_order_id' => 'required|uuid|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.item_index' => 'required|integer',
            'items.*.name' => 'required|string|max:255',
            'items.*.ordered_quantity' => 'required|numeric|min:0',
            'items.*.received_quantity' => 'required|numeric|min:0',
            'items.*.status' => 'required|string|in:good,damaged,shortage',
        ]);

        $fields['company_id'] = $companyId;

        $gr = $this->procurementService->createGoodsReceipt($fields, $request->user());

        return response()->json([
            'success' => true,
            'data' => $gr
        ], 201);
    }

    public function showGoodsReceipt(string $id)
    {
        $gr = GoodsReceipt::with(['purchaseOrder.vendor', 'receiver'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $gr
        ]);
    }

    // ── VENDOR INVOICES & MATCHING ──

    public function getVendorInvoices(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $invoices = VendorInvoice::with(['vendor', 'purchaseOrder'])
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }

    public function createVendorInvoice(Request $request)
    {
        $companyId = $this->getCompanyId($request);
        $fields = $request->validate([
            'vendor_id' => 'required|uuid|exists:vendors,id',
            'purchase_order_id' => 'nullable|uuid|exists:purchase_orders,id',
            'invoice_number' => 'required|string|max:255',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $fields['company_id'] = $companyId;
        $fields['tax_amount'] = $fields['tax_amount'] ?? 0.00;

        $invoice = $this->procurementService->createVendorInvoice($fields, $request->user());

        return response()->json([
            'success' => true,
            'data' => $invoice
        ], 201);
    }

    public function showVendorInvoice(string $id)
    {
        $invoice = VendorInvoice::with(['vendor', 'purchaseOrder.goodsReceipts'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }

    public function matchInvoice(Request $request, string $id)
    {
        $result = $this->procurementService->performThreeWayMatch($id);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }
}
