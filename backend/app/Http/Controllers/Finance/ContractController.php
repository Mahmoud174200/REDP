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

        // A reservation must have exactly ONE contract. Block if a signed/active one
        // exists; otherwise wipe ALL stale contracts (auto-draft, draft, cancelled,
        // withdrawn, plan-approval placeholders) so the fresh one is the only record.
        $existingContracts = Contract::where('reservation_id', $reservationId)->get();
        $blocking = $existingContracts->first(fn($c) => in_array($c->status, ['active', 'completed', 'pending_signature']));
        if ($blocking) {
            return response()->json([
                'success' => false,
                'message' => 'A finalized or active contract already exists for this reservation.',
                'contract' => $blocking,
            ], 400);
        }
        if ($existingContracts->isNotEmpty()) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($existingContracts) {
                foreach ($existingContracts as $ex) {
                    if ($ex->paymentPlan) {
                        Payment::where('payment_plan_id', $ex->paymentPlan->id)->delete();
                        $ex->paymentPlan->delete();
                    }
                    Payment::where('contract_id', $ex->id)->delete();
                    $ex->delete();
                }
            });
        }

        $request->validate([
            'type' => 'nullable|string|in:sale,reservation,installment,cash',
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
        $isCustom = $request->boolean('is_custom');
        $requiresApproval = $request->boolean('requires_approval');

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

        // Validate minimum down payment for installment plans
        if ($type === 'installment' && $unit && $unit->min_down_payment !== null) {
            $minDp = (float) $unit->min_down_payment;
            if ($dpAmount < $minDp) {
                return response()->json([
                    'success' => false,
                    'message' => "The down payment (" . number_format($dpAmount) . " EGP) is less than the minimum required down payment for this unit (" . number_format($minDp) . " EGP).",
                ], 400);
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
            'is_custom_plan' => $isCustom,
            'plan_approval_status' => $requiresApproval ? 'pending' : 'not_required',
            'status' => 'draft',
            'notes' => $request->notes ?? 'Generated from reservation.',
        ]);

        // Notify accountants (finance officers) when a custom plan needs review.
        if ($requiresApproval) {
            try {
                foreach (\App\Models\User::where('role', 'finance_officer')->where('status', 'active')->get() as $fo) {
                    \App\Services\NotificationService::send(
                        $fo->id,
                        'push',
                        $fo->email,
                        'Custom payment plan needs approval / خطة دفع مخصّصة بانتظار الموافقة',
                        "Contract {$contract->contract_number} has a custom payment plan awaiting your review."
                    );
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Custom-plan approval notification failed: ' . $e->getMessage());
            }
        }

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

        // A custom payment plan must be approved by Accounting before signing.
        if ($contract->plan_approval_status === 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This custom payment plan is still pending accountant approval.',
            ], 422);
        }
        if ($contract->plan_approval_status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'This custom payment plan was rejected by Accounting. Please revise the plan.',
            ], 422);
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

        // Onboard the client to their Homeowner Portal. On their FIRST signed unit
        // we (re)set a fresh password and email the login details; for later units
        // we just notify them (so we don't reset a password they already use).
        try {
            $client = \App\Models\User::find($contract->client_id);
            if ($client && $client->email) {
                $alreadyOnboarded = Contract::where('client_id', $contract->client_id)
                    ->where('id', '!=', $contract->id)
                    ->whereIn('status', ['active', 'completed'])->exists();

                if (!$alreadyOnboarded) {
                    $newPassword = \Illuminate\Support\Str::random(10);
                    $client->update(['password' => \Illuminate\Support\Facades\Hash::make($newPassword), 'status' => 'active']);
                    \App\Services\NotificationService::send(
                        $client->id, 'email', $client->email,
                        'Welcome to your Homeowner Portal / مرحباً بك في بوابة الملاك',
                        $this->buildWelcomeEmail($client, $contract->fresh(['unit']), $newPassword)
                    );
                } else {
                    \App\Services\NotificationService::send(
                        $client->id, 'push', $client->email,
                        'New unit added to your portal / تمت إضافة وحدة جديدة',
                        "Your contract {$contract->contract_number} is now active. View it in your Homeowner Portal."
                    );
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Homeowner onboarding on sign failed: ' . $e->getMessage());
        }

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

    private function buildWelcomeEmail(\App\Models\User $client, Contract $contract, string $password): string
    {
        $name = htmlspecialchars($client->name ?? 'Valued Client', ENT_QUOTES);
        $email = htmlspecialchars($client->email, ENT_QUOTES);
        $unit = htmlspecialchars($contract->unit->unit_number ?? '—', ENT_QUOTES);
        $num = htmlspecialchars($contract->contract_number, ENT_QUOTES);
        $loginUrl = 'http://localhost:5173/client-login';
        return <<<HTML
        <div style="font-family:Arial,sans-serif;background:#f4f6fc;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,61,166,.06)">
            <div style="background:linear-gradient(135deg,#001A70,#003DA6);padding:34px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Welcome Home 🎉</h1>
              <p style="color:#C5A880;margin:6px 0 0;font-size:12px;letter-spacing:.15em;text-transform:uppercase">مرحباً بك في بوابة الملاك</p>
            </div>
            <div style="padding:32px">
              <p style="color:#0f172a;font-size:15px">Dear <strong>{$name}</strong>,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6">
                Congratulations! Your contract <strong>{$num}</strong> for <strong>Unit {$unit}</strong> is now active.
                Use the credentials below to access your Homeowner Portal — track your unit, your installment schedule, what you’ve paid and what remains.
              </p>
              <div style="background:#F8FAFC;border:1px solid rgba(0,61,166,.08);border-radius:12px;padding:18px;margin:18px 0">
                <table style="width:100%;font-size:13px;color:#0f172a">
                  <tr><td style="color:#64748b;padding:6px 0">Login email</td><td style="text-align:right;font-weight:700">{$email}</td></tr>
                  <tr><td style="color:#64748b;padding:6px 0;border-top:1px dashed #e2e8f0">Temporary password</td><td style="text-align:right;font-weight:800;font-family:monospace;color:#003DA6;border-top:1px dashed #e2e8f0">{$password}</td></tr>
                </table>
              </div>
              <div style="text-align:center;margin:24px 0">
                <a href="{$loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#003DA6,#001A70);color:#fff;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:30px;font-size:14px">Open my Homeowner Portal</a>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center">Please change your password after your first login.</p>
            </div>
            <div style="background:#F8FAFC;padding:22px;text-align:center;color:#94a3b8;font-size:11px">© 2026 Mountain View Developments</div>
          </div>
        </div>
        HTML;
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
    /**
     * GET /api/v1/finance/contracts/pending-plan-approval
     * Accountant queue: custom payment plans awaiting approval.
     */
    public function pendingPlanApprovals(Request $request)
    {
        $contracts = Contract::where('plan_approval_status', 'pending')
            ->with([
                'client:id,name,email,phone',
                'unit:id,unit_number,price,project_id,building,floor',
                'unit.project:id,name',
                'paymentPlan',
                'payments' => fn($q) => $q->orderBy('installment_number'),
            ])
            ->orderBy('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $contracts]);
    }

    /**
     * POST /api/v1/finance/contracts/{id}/approve-plan
     * Accountant approves a custom payment plan → emails the client to complete the contract.
     */
    public function approvePlan(Request $request, string $id)
    {
        $contract = Contract::with(['client', 'unit.project', 'paymentPlan'])->findOrFail($id);

        if ($contract->plan_approval_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This plan is not pending approval (current: ' . $contract->plan_approval_status . ').',
            ], 422);
        }

        $contract->update([
            'plan_approval_status' => 'approved',
            'plan_reviewed_by'     => $request->user()?->id,
            'plan_reviewed_at'     => now(),
            'plan_approval_notes'  => $request->input('notes'),
        ]);

        // Email the client that the plan was accepted.
        try {
            if ($contract->client) {
                \App\Services\NotificationService::send(
                    $contract->client->id,
                    'email',
                    $contract->client->email,
                    'Your payment plan is approved / تمت الموافقة على خطة السداد',
                    $this->buildPlanApprovedEmail($contract)
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Plan approval email failed: ' . $e->getMessage());
        }

        AuditLogService::log('CONTRACT_PLAN_APPROVED', $request->user()?->id, [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Custom payment plan approved. The client has been notified by email.',
            'contract' => $contract->fresh(),
        ]);
    }

    /**
     * POST /api/v1/finance/contracts/{id}/reject-plan
     * Accountant rejects a custom payment plan with a reason.
     */
    public function rejectPlan(Request $request, string $id)
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $contract = Contract::with('client')->findOrFail($id);

        if ($contract->plan_approval_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This plan is not pending approval (current: ' . $contract->plan_approval_status . ').',
            ], 422);
        }

        $contract->update([
            'plan_approval_status' => 'rejected',
            'plan_reviewed_by'     => $request->user()?->id,
            'plan_reviewed_at'     => now(),
            'plan_approval_notes'  => $request->input('notes'),
        ]);

        AuditLogService::log('CONTRACT_PLAN_REJECTED', $request->user()?->id, [
            'contract_id' => $contract->id,
            'contract_number' => $contract->contract_number,
            'reason' => $request->input('notes'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Custom payment plan rejected. Sales can revise and resubmit.',
            'contract' => $contract->fresh(),
        ]);
    }

    private function buildPlanApprovedEmail(Contract $contract): string
    {
        $client = $contract->client?->name ?? 'Valued Client';
        $num = $contract->contract_number;
        $unit = $contract->unit?->unit_number ?? '—';
        $project = $contract->unit?->project?->name ?? 'your project';
        $total = number_format((float) $contract->total_amount, 2);
        $months = $contract->paymentPlan?->total_installments ?? 0;

        return <<<HTML
        <div style="font-family:Arial,sans-serif;background:#f4f6fc;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,61,166,.06)">
            <div style="background:linear-gradient(135deg,#001A70,#003DA6);padding:34px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Payment Plan Approved</h1>
              <p style="color:#C5A880;margin:6px 0 0;font-size:12px;letter-spacing:.15em;text-transform:uppercase">تمت الموافقة على خطة السداد</p>
            </div>
            <div style="padding:32px">
              <p style="color:#0f172a;font-size:15px">Dear <strong>{$client}</strong>,</p>
              <p style="color:#475569;font-size:14px;line-height:1.6">
                Good news! Your customized payment plan for <strong>Unit {$unit}</strong> in <strong>{$project}</strong>
                has been reviewed and <strong>approved</strong> by our finance department.
              </p>
              <div style="background:#F8FAFC;border:1px solid rgba(0,61,166,.08);border-radius:12px;padding:18px;margin:18px 0">
                <table style="width:100%;font-size:13px;color:#0f172a">
                  <tr><td style="color:#64748b;padding:6px 0">Contract</td><td style="text-align:right;font-weight:700">{$num}</td></tr>
                  <tr><td style="color:#64748b;padding:6px 0">Total Value</td><td style="text-align:right;font-weight:700">EGP {$total}</td></tr>
                  <tr><td style="color:#64748b;padding:6px 0">Installments</td><td style="text-align:right;font-weight:700">{$months}</td></tr>
                </table>
              </div>
              <p style="color:#475569;font-size:14px;line-height:1.6">
                Please visit our offices to <strong>complete and sign your contract</strong>. Our sales team is ready to welcome you.
                / يرجى التوجه لمقر الشركة لاستكمال وتوقيع العقد.
              </p>
            </div>
            <div style="background:#F8FAFC;padding:22px;text-align:center;color:#94a3b8;font-size:11px">© 2026 Mountain View Developments</div>
          </div>
        </div>
        HTML;
    }

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
