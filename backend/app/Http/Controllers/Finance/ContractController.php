<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Reservation;
use App\Models\Unit;
use App\Models\PaymentPlan;
use App\Models\Payment;
use App\Services\AuditLogService;
use App\Events\ContractSigned;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    /**
     * List all contracts with filtering.
     * Blueprint N+O — Contract generation, PDF rendering
     */
    public function index(Request $request)
    {
        $query = Contract::with(['client', 'unit.project', 'paymentPlan']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->byStatus($request->status);
        }
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'LIKE', "%{$search}%")
                  ->orWhereHas('client', fn($q2) => $q2->where('name', 'LIKE', "%{$search}%"));
            });
        }

        $contracts = $query->latest()->get();

        // Summary stats
        $totalContracts = Contract::count();
        $activeContracts = Contract::active()->count();
        $totalValue = Contract::sum('total_amount');
        $totalPaid = Contract::sum('paid_amount');

        return response()->json([
            'success' => true,
            'owner' => '🔵 Melwany (Finance)',
            'data' => $contracts,
            'summary' => [
                'total_contracts' => $totalContracts,
                'active_contracts' => $activeContracts,
                'total_value' => (float) $totalValue,
                'total_paid' => (float) $totalPaid,
                'collection_rate' => $totalValue > 0 ? round(($totalPaid / $totalValue) * 100, 1) : 0,
            ],
        ]);
    }

    /**
     * Show single contract with full details.
     */
    public function show(string $id)
    {
        $contract = Contract::with([
            'client',
            'unit.project',
            'reservation',
            'paymentPlan',
            'payments' => fn($q) => $q->orderBy('installment_number'),
            'cancellation',
            'reschedulingRequests',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $contract,
        ]);
    }

    /**
     * Generate a new contract from a confirmed reservation.
     * Blueprint N+O — Contract generation
     */
    public function generate(Request $request, string $reservationId)
    {
        $reservation = Reservation::with('unit')->findOrFail($reservationId);

        // Check if contract already exists
        $existing = Contract::where('reservation_id', $reservationId)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A contract already exists for this reservation.',
                'contract' => $existing,
            ], 400);
        }

        $request->validate([
            'type' => 'nullable|string|in:sale,reservation,installment',
            'total_installments' => 'nullable|integer|min:1|max:120',
            'notes' => 'nullable|string',
        ]);

        $unit = $reservation->unit;
        $totalInstallments = $request->total_installments ?? 12;
        $type = $request->type ?? 'installment';

        // Create the contract
        $contract = Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => Contract::generateContractNumber(),
            'reservation_id' => $reservationId,
            'unit_id' => $unit->id,
            'client_id' => $reservation->client_id,
            'total_amount' => $unit->price,
            'paid_amount' => $reservation->eoi_amount,
            'type' => $type,
            'status' => 'draft',
            'notes' => $request->notes ?? 'Generated from reservation.',
        ]);

        // Generate payment plan
        $remainingAmount = $unit->price - $reservation->eoi_amount;
        $monthlyAmount = round($remainingAmount / $totalInstallments, 2);

        $paymentPlan = PaymentPlan::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract->id,
            'total_installments' => $totalInstallments,
            'unpaid_installments' => $totalInstallments,
            'monthly_amount' => $monthlyAmount,
            'status' => 'active',
            'start_date' => now()->addMonth(),
        ]);

        // Create installment entries
        for ($i = 1; $i <= $totalInstallments; $i++) {
            Payment::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract->id,
                'payment_plan_id' => $paymentPlan->id,
                'amount' => $monthlyAmount,
                'status' => 'pending',
                'due_date' => now()->addMonths($i * 3), // Quarterly installments
                'installment_number' => $i,
            ]);
        }

        AuditLogService::log('CONTRACT_GENERATED', $request->user()->id, [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'reservation_id' => $reservationId,
            'total_amount' => $unit->price,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract generated successfully with payment plan.',
            'contract' => $contract->load(['paymentPlan', 'payments']),
        ], 201);
    }

    /**
     * Sign a contract.
     * Emits ContractSigned event for decoupled modules.
     */
    public function sign(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);

        if (!in_array($contract->status, ['draft', 'pending_signature'])) {
            return response()->json([
                'success' => false,
                'message' => 'Contract cannot be signed in its current status: ' . $contract->status,
            ], 400);
        }

        $contract->update([
            'status' => 'active',
            'signed_at' => now(),
        ]);

        // Update unit status to sold
        if ($contract->unit_id) {
            Unit::where('id', $contract->unit_id)->update(['status' => 'sold']);
        }

        // Emit decoupled event per Core Decoupling Protocol
        event(new ContractSigned(
            $contract->id,
            $contract->client_id,
            $contract->unit_id,
            $contract->reservation_id
        ));

        AuditLogService::log('CONTRACT_SIGNED', $request->user()->id, [
            'contract_id' => $id,
            'contract_number' => $contract->contract_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract signed successfully. Unit marked as sold. Decoupled events emitted.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * Cancel a contract.
     */
    public function cancel(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Contract is already cancelled.',
            ], 400);
        }

        $contract->update(['status' => 'cancelled']);

        // Release the unit
        if ($contract->unit_id) {
            Unit::where('id', $contract->unit_id)->update(['status' => 'available']);
        }

        // Cancel payment plan
        if ($contract->paymentPlan) {
            $contract->paymentPlan->update(['status' => 'cancelled']);
        }

        AuditLogService::log('CONTRACT_CANCELLED', $request->user()->id, [
            'contract_id' => $id,
            'contract_number' => $contract->contract_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract cancelled. Unit released back to inventory.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * Generate contract PDF placeholder.
     * Blueprint N+O — PDF rendering
     */
    public function downloadPdf(string $id)
    {
        $contract = Contract::with(['client', 'unit.project', 'paymentPlan', 'payments'])->findOrFail($id);

        // In production, this would generate a real PDF using DomPDF or Snappy
        // For now, return contract data as JSON for frontend rendering
        return response()->json([
            'success' => true,
            'message' => 'PDF generation data prepared. Integrate DomPDF for production rendering.',
            'pdf_data' => [
                'contract_number' => $contract->contract_number,
                'client_name' => $contract->client->name ?? 'N/A',
                'client_email' => $contract->client->email ?? 'N/A',
                'unit_number' => $contract->unit->unit_number ?? 'N/A',
                'project_name' => $contract->unit->project->name ?? 'N/A',
                'total_amount' => $contract->total_amount,
                'paid_amount' => $contract->paid_amount,
                'outstanding' => $contract->outstanding_amount,
                'status' => $contract->status,
                'signed_at' => $contract->signed_at,
                'installments_count' => $contract->paymentPlan->total_installments ?? 0,
                'monthly_amount' => $contract->paymentPlan->monthly_amount ?? 0,
                'created_at' => $contract->created_at,
            ],
        ]);
    }
}
