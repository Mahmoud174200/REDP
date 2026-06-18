<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\EoiReservation;
use App\Models\Lead;
use App\Services\AuditLogService;
use App\Services\EoiEmailService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine
 * Controller: EoiReservationController
 *
 * EOI Reservation System with Payment Upload Workflow.
 * Handles: submit with receipt upload, accountant review
 * (approve/reject), order number generation, queue assignment,
 * and automatic email notifications.
 * ─────────────────────────────────────────────────────────
 */
class EoiReservationController extends Controller
{
    /**
     * GET /api/v1/acquisition/eoi-reservations/stats
     * Dashboard statistics for the EOI Reservation system.
     */
    public function stats(Request $request): JsonResponse
    {
        $projectId = $request->input('project_id');

        $query = EoiReservation::query();
        if ($projectId) {
            $query->forProject($projectId);
        }

        $total    = (clone $query)->count();
        $pending  = (clone $query)->pending()->count();
        $approved = (clone $query)->approved()->count();
        $rejected = (clone $query)->rejected()->count();

        $totalAmount    = (clone $query)->approved()->sum('payment_amount');
        $pendingAmount  = (clone $query)->pending()->sum('payment_amount');

        $recentActivity = EoiReservation::with('lead:id,first_name,last_name,email')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'client_name'    => $r->client_name,
                'status'         => $r->status,
                'payment_method' => $r->payment_method,
                'payment_amount' => $r->payment_amount,
                'order_number'   => $r->order_number,
                'queue_number'   => $r->queue_number,
                'updated_at'     => $r->updated_at,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'total'           => $total,
                'pending'         => $pending,
                'approved'        => $approved,
                'rejected'        => $rejected,
                'total_amount'    => (float) $totalAmount,
                'pending_amount'  => (float) $pendingAmount,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * GET /api/v1/acquisition/eoi-reservations
     * List all EOI reservations with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EoiReservation::with(['lead:id,first_name,last_name,email,phone', 'reviewer:id,name,email']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('project_id')) {
            $query->forProject($request->input('project_id'));
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }
        if ($request->filled('client_location')) {
            $query->where('client_location', $request->input('client_location'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('client_name', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%")
                  ->orWhere('client_phone', 'like', "%{$search}%")
                  ->orWhere('order_number', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        if ($sortBy === 'queue_number') {
            $query->orderByRaw('queue_number IS NULL, queue_number ASC');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $reservations = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $reservations,
        ]);
    }

    /**
     * POST /api/v1/acquisition/eoi-reservations
     * Submit a new EOI reservation with payment receipt upload.
     */
    public function store(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'lead_id'          => 'required|uuid|exists:leads,id',
            'project_id'       => 'required|uuid',
            'unit_id'          => 'nullable|uuid|exists:units,id',
            'client_name'      => 'required|string|max:255',
            'client_email'     => 'required|email|max:255',
            'client_phone'     => 'required|string|max:50',
            'client_location'  => ['required', Rule::in(['inside_egypt', 'outside_egypt'])],
            'payment_method'   => ['required', Rule::in(['cash', 'bank_transfer', 'cheque', 'international_bank_transfer', 'instapay'])],
            'payment_amount'   => 'required|numeric|min:0.01',
            'receipt'          => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf',
            'passport'         => 'required_if:client_location,outside_egypt|file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf',
        ]);

        // Validate payment method matches location
        if (!EoiReservation::isValidPaymentMethod($fields['client_location'], $fields['payment_method'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment method for the selected location.',
                'errors'  => [
                    'payment_method' => [
                        $fields['client_location'] === 'inside_egypt'
                            ? 'Inside Egypt: Only Cash, Bank Transfer, Cheque, or InstaPay are accepted.'
                            : 'Outside Egypt: Only International Bank Transfer is accepted.'
                    ],
                ],
            ], 422);
        }

        // Check for duplicate EOI for same lead + project
        $existing = EoiReservation::where('lead_id', $fields['lead_id'])
            ->where('project_id', $fields['project_id'])
            ->whereIn('status', ['pending_review', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'An active EOI reservation already exists for this lead and project.',
                'data'    => $existing,
            ], 409);
        }

        // Handle receipt file upload
        $receiptPath = $request->file('receipt')->store('eoi-receipts', 'public');

        // Handle passport file upload
        $passportPath = null;
        if ($request->hasFile('passport')) {
            $passportPath = $request->file('passport')->store('eoi-passports', 'public');
            // Update passport path on lead
            $lead = Lead::find($fields['lead_id']);
            if ($lead) {
                $lead->update([
                    'passport_path' => $passportPath,
                ]);
            }
        }

        $reservation = DB::transaction(function () use ($fields, $receiptPath, $passportPath) {
            return EoiReservation::create([
                'id'              => (string) Str::uuid(),
                'lead_id'         => $fields['lead_id'],
                'project_id'      => $fields['project_id'],
                'unit_id'         => $fields['unit_id'] ?? null,
                'client_name'     => $fields['client_name'],
                'client_email'    => $fields['client_email'],
                'client_phone'    => $fields['client_phone'],
                'client_location' => $fields['client_location'],
                'payment_method'  => $fields['payment_method'],
                'payment_amount'  => $fields['payment_amount'],
                'receipt_path'    => $receiptPath,
                'passport_path'   => $passportPath,
                'status'          => EoiReservation::STATUS_PENDING_REVIEW,
            ]);
        });

        AuditLogService::log('EOI_RESERVATION_SUBMIT', $request->user()?->id, [
            'eoi_reservation_id' => $reservation->id,
            'lead_id'            => $reservation->lead_id,
            'project_id'         => $reservation->project_id,
            'payment_method'     => $reservation->payment_method,
            'payment_amount'     => (float) $reservation->payment_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'EOI reservation submitted successfully. Your payment receipt is pending review.',
            'data'    => $reservation,
        ], 201);
    }

    /**
     * GET /api/v1/acquisition/eoi-reservations/{id}
     * Show a single EOI reservation with full details.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $reservation = EoiReservation::with([
            'lead:id,first_name,last_name,email,phone',
            'unit:id,unit_number,floor_number,area_sqm,price',
            'reviewer:id,name,email',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $reservation,
        ]);
    }

    /**
     * POST /api/v1/acquisition/eoi-reservations/{id}/approve
     * Accountant approves an EOI reservation.
     * Generates order number, assigns queue number, and sends confirmation email.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $reservation = EoiReservation::findOrFail($id);

        if ($reservation->status !== EoiReservation::STATUS_PENDING_REVIEW) {
            return response()->json([
                'success' => false,
                'message' => "Cannot approve reservation with status '{$reservation->status}'.",
            ], 422);
        }

        $reservation = DB::transaction(function () use ($reservation, $request) {
            $orderNumber = EoiReservation::generateOrderNumber();

            $reservation->update([
                'status'       => EoiReservation::STATUS_APPROVED,
                'order_number' => $orderNumber,
                'queue_number' => null,
                'reviewer_id'  => $request->user()?->id,
                'review_notes' => $request->input('notes'),
                'reviewed_at'  => now(),
            ]);

            return $reservation->fresh();
        });

        // Recalculate queue numbers for the project
        try {
            EoiReservation::recalculateQueueNumbers($reservation->project_id);
            $reservation = $reservation->fresh();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to recalculate queue numbers on approval: " . $e->getMessage());
        }

        // Send confirmation email
        try {
            EoiEmailService::sendApprovalEmail($reservation);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("EOI approval email failed: " . $e->getMessage());
        }

        AuditLogService::log('EOI_RESERVATION_APPROVE', $request->user()?->id, [
            'eoi_reservation_id' => $reservation->id,
            'order_number'       => $reservation->order_number,
            'queue_number'       => $reservation->queue_number,
            'lead_id'            => $reservation->lead_id,
        ]);

        return response()->json([
            'success'      => true,
            'message'      => "EOI reservation approved. Order #{$reservation->order_number}, Queue #{$reservation->queue_number}.",
            'data'         => $reservation,
            'order_number' => $reservation->order_number,
            'queue_number' => $reservation->queue_number,
        ]);
    }

    /**
     * POST /api/v1/acquisition/eoi-reservations/{id}/reject
     * Accountant rejects an EOI reservation.
     * Sends rejection notification email with reason.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $reservation = EoiReservation::findOrFail($id);

        if ($reservation->status !== EoiReservation::STATUS_PENDING_REVIEW) {
            return response()->json([
                'success' => false,
                'message' => "Cannot reject reservation with status '{$reservation->status}'.",
            ], 422);
        }

        $reservation->update([
            'status'       => EoiReservation::STATUS_REJECTED,
            'reviewer_id'  => $request->user()?->id,
            'review_notes' => $fields['notes'],
            'reviewed_at'  => now(),
        ]);

        // Send rejection email
        try {
            EoiEmailService::sendRejectionEmail($reservation, $fields['notes']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("EOI rejection email failed: " . $e->getMessage());
        }

        AuditLogService::log('EOI_RESERVATION_REJECT', $request->user()?->id, [
            'eoi_reservation_id' => $reservation->id,
            'lead_id'            => $reservation->lead_id,
            'reason'             => $fields['notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'EOI reservation rejected.',
            'data'    => $reservation->fresh(),
        ]);
    }

    /**
     * POST /api/v1/acquisition/eoi-reservations/invite-batch
     * Invite a batch of approved EOI reservations to reserve their unit (FIFO order).
     */
    public function inviteBatch(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'project_id'                 => 'required|uuid',
            'count'                      => 'required|integer|min:1|max:500',
            'contracting_deadline_hours' => 'required|integer|min:1|max:720',
        ]);

        $projectId = $fields['project_id'];
        $count = (int) $fields['count'];
        $deadlineHours = (int) $fields['contracting_deadline_hours'];

        // Fetch approved reservations that haven't been invited yet, ordered by queue_number (FIFO)
        $reservations = EoiReservation::where('project_id', $projectId)
            ->where('status', EoiReservation::STATUS_APPROVED)
            ->whereNull('invited_at')
            ->orderByRaw('queue_number IS NULL, queue_number ASC')
            ->limit($count)
            ->get();

        if ($reservations->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No approved EOI reservations found that are eligible for invitation.',
            ], 404);
        }

        $invitedClients = [];

        foreach ($reservations as $reservation) {
            DB::transaction(function () use ($reservation, $deadlineHours, &$invitedClients) {
                // Find or create User account for client login
                $user = \App\Models\User::where('email', $reservation->client_email)->first();
                $generatedPassword = null;

                if (!$user) {
                    $generatedPassword = Str::random(10);
                    $user = \App\Models\User::create([
                        'id'        => (string) Str::uuid(),
                        'name'      => $reservation->client_name,
                        'email'     => $reservation->client_email,
                        'phone'     => $reservation->client_phone,
                        'password'  => bcrypt($generatedPassword),
                        'role'      => 'client',
                        'status'    => 'active',
                    ]);
                } else {
                    $generatedPassword = Str::random(10);
                    $user->update([
                        'password'  => bcrypt($generatedPassword),
                    ]);
                }

                // Update reservation record with invitation details
                $reservation->update([
                    'invited_at'                 => now(),
                    'contracting_deadline_hours' => $deadlineHours,
                ]);

                // Send Email 2 (Invitation with temp password)
                try {
                    EoiEmailService::sendInvitationEmail($reservation, $generatedPassword);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send invitation email: " . $e->getMessage());
                }

                $invitedClients[] = [
                    'name'         => $reservation->client_name,
                    'email'        => $reservation->client_email,
                    'queue_number' => $reservation->queue_number,
                ];
            });
        }

        // Log audit trail
        AuditLogService::log('EOI_INVITE_BATCH', $request->user()?->id, [
            'project_id'                 => $projectId,
            'count'                      => count($invitedClients),
            'contracting_deadline_hours' => $deadlineHours,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Successfully invited ' . count($invitedClients) . ' clients.',
            'data'    => $invitedClients,
        ]);
    }
}
