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
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

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
            'owner' => '🔵 Finance Team (Finance)',
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
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

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
        // Reactive check and release expired reservations
        Reservation::checkAndReleaseExpired();

        $reservation = Reservation::with('unit')->findOrFail($reservationId);

        if ($reservation->status === 'expired') {
            return response()->json([
                'success' => false,
                'message' => 'This reservation has expired and cannot be contracted.',
            ], 400);
        }

        // Check if contract already exists
        $existing = Contract::where('reservation_id', $reservationId)->first();
        if ($existing) {
            if ($existing->status === 'draft') {
                // Safely delete the auto-generated draft to make way for the custom finalized contract
                \Illuminate\Support\Facades\DB::transaction(function () use ($existing) {
                    if ($existing->paymentPlan) {
                        Payment::where('payment_plan_id', $existing->paymentPlan->id)->delete();
                        $existing->paymentPlan->delete();
                    }
                    Payment::where('contract_id', $existing->id)->delete();
                    $existing->delete();
                });
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'A finalized or active contract already exists for this reservation.',
                    'contract' => $existing,
                ], 400);
            }
        }

        $request->validate([
            'type' => 'nullable|string|in:sale,reservation,installment',
            'total_installments' => 'nullable|integer|min:1|max:120',
            'notes' => 'nullable|string',
            'schedule' => 'nullable|array',
            'schedule.*.amount' => 'required|numeric',
            'schedule.*.dueDate' => 'required|string',
            'schedule.*.label' => 'required|string',
            'schedule.*.type' => 'required|string',
            'monthly_amount' => 'nullable|numeric',
        ]);

        $unit = $reservation->unit;
        $type = $request->type ?? 'installment';
        $schedule = $request->input('schedule', []);

        // Calculate paid today (EOI + Down Payment)
        $totalPaidToday = (float) $reservation->eoi_amount;
        $dpAmount = 0.0;
        if (!empty($schedule)) {
            foreach ($schedule as $item) {
                if ($item['type'] === 'down_payment') {
                    $dpAmount += (float) $item['amount'];
                }
            }
        }
        $totalPaidToday += $dpAmount;

        // Create the contract
        $contract = Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => Contract::generateContractNumber(),
            'reservation_id' => $reservationId,
            'unit_id' => $unit->id,
            'client_id' => $reservation->client_id,
            'total_amount' => $unit->price,
            'paid_amount' => $totalPaidToday,
            'type' => $type,
            'status' => 'draft',
            'notes' => $request->notes ?? 'Generated from reservation.',
        ]);

        // Generate payment plan and payments
        if (!empty($schedule)) {
            $futureInstallments = array_filter($schedule, function ($item) {
                return !in_array($item['type'], ['eoi', 'down_payment']);
            });
            $totalInstallmentsCount = count($futureInstallments);

            $paymentPlan = PaymentPlan::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract->id,
                'total_installments' => $totalInstallmentsCount,
                'unpaid_installments' => $totalInstallmentsCount,
                'monthly_amount' => (float) $request->input('monthly_amount', 0.0),
                'status' => 'active',
                'start_date' => now()->addMonth(),
            ]);

            $index = 1;
            foreach ($schedule as $item) {
                $isPaidToday = in_array($item['type'], ['eoi', 'down_payment']);

                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $paymentPlan->id,
                    'amount' => (float) $item['amount'],
                    'status' => $isPaidToday ? 'paid' : 'pending',
                    'transaction_reference' => $item['label'] ?? null,
                    'due_date' => isset($item['dueDate']) ? date('Y-m-d', strtotime($item['dueDate'])) : now(),
                    'installment_number' => $isPaidToday ? 0 : $index++,
                    'paid_at' => $isPaidToday ? now() : null,
                ]);
            }
        } else {
            $totalInstallments = $request->total_installments ?? 12;
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

            for ($i = 1; $i <= $totalInstallments; $i++) {
                Payment::create([
                    'id' => (string) Str::uuid(),
                    'contract_id' => $contract->id,
                    'payment_plan_id' => $paymentPlan->id,
                    'amount' => $monthlyAmount,
                    'status' => 'pending',
                    'due_date' => now()->addMonths($i * 3),
                    'installment_number' => $i,
                ]);
            }
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

    /**
     * Get all reserved/sold units with original vs contract pricing and payment progress.
     */
    public function getReservedUnits(Request $request)
    {
        $contracts = Contract::with(['client', 'unit.project', 'paymentPlan'])
            ->whereIn('status', ['active', 'pending_signature', 'completed'])
            ->latest()
            ->get();

        $data = $contracts->map(function ($contract) {
            $unit = $contract->unit;
            $client = $contract->client;
            
            $originalPrice = $unit ? (float) $unit->price : 0.0;
            $contractPrice = (float) $contract->total_amount;
            $paidAmount = (float) $contract->paid_amount;
            $remainingAmount = max(0.0, $contractPrice - $paidAmount);
            
            // Determine if there is a discount or interest markup
            $priceDifference = $contractPrice - $originalPrice;
            $priceStatus = 'exact';
            if ($priceDifference < 0) {
                $priceStatus = 'discounted'; // Discount applied (e.g. cash discount)
            } elseif ($priceDifference > 0) {
                $priceStatus = 'interest_markup'; // Installment interest markup
            }

            return [
                'id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'status' => $contract->status,
                'type' => $contract->type, // sale (cash), installment, reservation
                'unit_id' => $unit->id ?? null,
                'unit_number' => $unit->unit_number ?? 'N/A',
                'floor' => $unit->floor ?? 'N/A',
                'area' => $unit ? (float) $unit->area : 0.0,
                'unit_type' => $unit->type ?? 'N/A',
                'project_name' => $unit->project->name ?? 'N/A',
                'client_name' => $client->name ?? 'N/A',
                'client_email' => $client->email ?? 'N/A',
                'client_phone' => $client->phone ?? 'N/A',
                'original_price' => $originalPrice,
                'contract_price' => $contractPrice,
                'price_difference' => $priceDifference,
                'price_status' => $priceStatus,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'payment_progress' => $contractPrice > 0 ? round(($paidAmount / $contractPrice) * 100, 1) : 0.0,
                'total_installments' => $contract->paymentPlan->total_installments ?? 0,
                'unpaid_installments' => $contract->paymentPlan->unpaid_installments ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'data' => $data,
        ]);
    }

    /**
     * Submit contract for admin approval.
     */
    public function submitForApproval(Request $request, string $id)
    {
        $contract = Contract::with(['client', 'unit.project', 'paymentPlan'])->findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft contracts can be submitted for approval. Current status is: ' . $contract->status,
            ], 400);
        }

        $contract->update([
            'status' => 'pending_approval',
        ]);

        // Initiate the approval workflow using the ApprovalEngine
        $approvalEngine = app(\App\Services\ApprovalEngine::class);
        $approvalEngine->initiateApproval(
            'contract',
            $contract->id,
            $request->user(),
            [
                'contract_number' => $contract->contract_number,
                'client_name' => $contract->client->name ?? 'N/A',
                'unit_number' => $contract->unit->unit_number ?? 'N/A',
                'project_name' => $contract->unit->project->name ?? 'N/A',
                'total_amount' => (float)$contract->total_amount,
                'installments' => $contract->paymentPlan->total_installments ?? 0,
            ]
        );

        AuditLogService::log('CONTRACT_SUBMIT_APPROVAL', $request->user()->id, [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract submitted for approval successfully.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * Escalate contract delinquency status.
     * Stages: none -> reminder -> warning -> final_notice -> withdrawn
     */
    public function escalateWithdrawal(Request $request, string $id)
    {
        $contract = Contract::with(['unit', 'paymentPlan'])->findOrFail($id);

        $currentStage = $contract->withdrawal_status ?? 'none';
        
        $nextStages = [
            'none' => 'reminder',
            'reminder' => 'warning',
            'warning' => 'final_notice',
            'final_notice' => 'withdrawn',
            'withdrawn' => 'withdrawn'
        ];

        $nextStage = $nextStages[$currentStage] ?? 'none';

        if ($currentStage === 'withdrawn') {
            return response()->json([
                'success' => false,
                'message' => 'This unit is already withdrawn and the contract is terminated.',
            ], 400);
        }

        if ($nextStage === 'withdrawn') {
            // Transaction boundary to ensure data consistency
            \Illuminate\Support\Facades\DB::transaction(function () use ($contract) {
                // Update contract status
                $contract->update([
                    'status' => 'withdrawn',
                    'withdrawal_status' => 'withdrawn',
                ]);

                // Free up unit back to inventory
                if ($contract->unit_id) {
                    \App\Models\Unit::where('id', $contract->unit_id)->update([
                        'status' => 'available',
                    ]);
                }

                // Terminate/cancel payment plan
                if ($contract->paymentPlan) {
                    $contract->paymentPlan->update([
                        'status' => 'cancelled',
                    ]);
                }
            });

            AuditLogService::log('CONTRACT_UNIT_WITHDRAWN', $request->user()->id ?? null, [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'unit_id' => $contract->unit_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unit has been successfully withdrawn. Client has been dissociated, and the unit is returned to inventory.',
                'contract' => $contract->fresh(['unit', 'paymentPlan']),
            ]);
        }

        // Just update stage for other values
        $contract->update([
            'withdrawal_status' => $nextStage,
        ]);

        AuditLogService::log('CONTRACT_WITHDRAWAL_STAGE_UPDATED', $request->user()->id ?? null, [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'stage' => $nextStage,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract delinquency status escalated to: ' . ucfirst($nextStage),
            'contract' => $contract->fresh(),
        ]);
    }
}
