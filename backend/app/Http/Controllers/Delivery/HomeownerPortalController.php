<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\FamilyMember;
use App\Models\Vehicle;
use App\Models\ServiceRequest;
use App\Models\ResaleRequest;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Unit;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HomeownerPortalController extends Controller
{
    // ═══════════════════════════════════════
    // HOMEOWNER DASHBOARD
    // ═══════════════════════════════════════

    /**
     * Get full homeowner portal data: unit info, family, vehicles, payments, service requests, resale status.
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        // Find unit owned by this user (via active reservation or contract)
        $contract = Contract::where('client_id', $userId)
            ->whereIn('status', ['active', 'completed', 'pending_signature'])
            ->with(['unit.project', 'payments' => function ($q) {
                $q->orderBy('due_date', 'asc');
            }])
            ->first();

        $reservation = Reservation::where('client_id', $userId)
            ->where('status', 'confirmed')
            ->with('unit.project')
            ->first();

        $unit = $contract?->unit ?? $reservation?->unit;

        // Family Members
        $familyMembers = FamilyMember::where('user_id', $userId)->orderBy('created_at', 'desc')->get();

        // Vehicles
        $vehicles = Vehicle::where('user_id', $userId)->orderBy('created_at', 'desc')->get();

        // Service Requests
        $serviceRequests = ServiceRequest::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Resale Requests
        $resaleRequests = ResaleRequest::where('user_id', $userId)
            ->with('unit.project')
            ->orderBy('created_at', 'desc')
            ->get();

        // Payment Summary
        $payments = $contract ? $contract->payments : collect([]);
        $totalAmount = $contract ? (float) $contract->total_amount : 0;
        $paidAmount = $payments->where('status', 'paid')->sum('amount');
        $pendingPayments = $payments->where('status', 'pending');
        $overduePayments = $pendingPayments->filter(function ($p) {
            return $p->due_date && $p->due_date->isPast();
        });

        return response()->json([
            'success' => true,
            'unit' => $unit ? [
                'id' => $unit->id,
                'unit_number' => $unit->unit_number,
                'type' => $unit->type,
                'area' => $unit->area,
                'bedrooms' => $unit->bedrooms,
                'bathrooms' => $unit->bathrooms,
                'floor' => $unit->floor,
                'building' => $unit->building,
                'view_type' => $unit->view_type,
                'status' => $unit->status,
                'handover_date' => $unit->handover_date,
                'project_name' => $unit->project?->name ?? 'N/A',
                'project_delivery_date' => $unit->project?->delivery_date ?? null,
            ] : null,
            'financial_summary' => [
                'total_amount' => $totalAmount,
                'paid_amount' => (float) $paidAmount,
                'outstanding' => (float) max(0, $totalAmount - $paidAmount),
                'total_installments' => $payments->count(),
                'paid_installments' => $payments->where('status', 'paid')->count(),
                'pending_installments' => $pendingPayments->count(),
                'overdue_installments' => $overduePayments->count(),
                'next_due' => $pendingPayments->sortBy('due_date')->first(),
            ],
            'payments' => $payments->map(function ($p) {
                return [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'status' => $p->status,
                    'due_date' => $p->due_date?->format('Y-m-d'),
                    'paid_at' => $p->paid_at?->format('Y-m-d'),
                    'installment_number' => $p->installment_number,
                    'is_overdue' => $p->isOverdue(),
                ];
            })->values(),
            'family_members' => $familyMembers,
            'vehicles' => $vehicles,
            'service_requests' => $serviceRequests,
            'resale_requests' => $resaleRequests,
        ]);
    }

    // ═══════════════════════════════════════
    // FAMILY MEMBERS CRUD
    // ═══════════════════════════════════════

    public function addFamilyMember(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'relationship' => 'required|string|in:spouse,child,parent,sibling,other',
            'national_id' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
        ]);

        $member = FamilyMember::create([
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'relationship' => $request->relationship,
            'national_id' => $request->national_id,
            'phone' => $request->phone,
            'date_of_birth' => $request->date_of_birth,
        ]);

        AuditLogService::log('FAMILY_MEMBER_ADDED', $request->user()->id, [
            'member_id' => $member->id,
            'name' => $member->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Family member added successfully.',
            'data' => $member,
        ], 201);
    }

    public function removeFamilyMember(Request $request, string $id)
    {
        $member = FamilyMember::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Family member removed.',
        ]);
    }

    // ═══════════════════════════════════════
    // VEHICLES CRUD
    // ═══════════════════════════════════════

    public function addVehicle(Request $request)
    {
        $request->validate([
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'color' => 'required|string|max:50',
            'plate_number' => 'required|string|max:30',
            'year' => 'nullable|integer|min:1990|max:2030',
        ]);

        $vehicle = Vehicle::create([
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'make' => $request->make,
            'model' => $request->model,
            'color' => $request->color,
            'plate_number' => $request->plate_number,
            'year' => $request->year,
        ]);

        AuditLogService::log('VEHICLE_REGISTERED', $request->user()->id, [
            'vehicle_id' => $vehicle->id,
            'plate' => $vehicle->plate_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle registered successfully.',
            'data' => $vehicle,
        ], 201);
    }

    public function removeVehicle(Request $request, string $id)
    {
        $vehicle = Vehicle::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle removed.',
        ]);
    }

    // ═══════════════════════════════════════
    // SERVICE REQUESTS
    // ═══════════════════════════════════════

    public function createServiceRequest(Request $request)
    {
        $request->validate([
            'unit_id' => 'required|string|exists:units,id',
            'service_type' => 'required|string|in:electrician,plumber,carpenter,ac_technician,painter,general',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        $sr = ServiceRequest::create([
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'unit_id' => $request->unit_id,
            'service_type' => $request->service_type,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'status' => 'pending',
        ]);

        AuditLogService::log('SERVICE_REQUEST_CREATED', $request->user()->id, [
            'request_id' => $sr->id,
            'type' => $sr->service_type,
            'title' => $sr->title,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service request submitted successfully. Our team will contact you soon.',
            'data' => $sr,
        ], 201);
    }

    // ═══════════════════════════════════════
    // RESALE REQUEST
    // ═══════════════════════════════════════

    public function requestResale(Request $request)
    {
        $request->validate([
            'unit_id' => 'required|string|exists:units,id',
            'asking_price' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string',
        ]);

        // Check if there's already a pending resale request for this unit
        $existing = ResaleRequest::where('user_id', $request->user()->id)
            ->where('unit_id', $request->unit_id)
            ->whereIn('status', ['pending', 'approved', 'listed'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active resale request for this unit.',
            ], 409);
        }

        $resale = ResaleRequest::create([
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'unit_id' => $request->unit_id,
            'asking_price' => $request->asking_price,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        // Mark unit for resale consideration
        $unit = Unit::find($request->unit_id);
        if ($unit) {
            // Don't change status yet — company sales will review
            AuditLogService::log('RESALE_REQUEST_SUBMITTED', $request->user()->id, [
                'resale_id' => $resale->id,
                'unit_id' => $unit->id,
                'unit_number' => $unit->unit_number,
                'asking_price' => $request->asking_price,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Resale request submitted. Company sales team will review your request.',
            'data' => $resale,
        ], 201);
    }

    public function cancelResale(Request $request, string $id)
    {
        $resale = ResaleRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending'])
            ->firstOrFail();

        $resale->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Resale request cancelled.',
        ]);
    }

    // ═══════════════════════════════════════
    // COMPANY SALES: Manage Resale Requests
    // ═══════════════════════════════════════

    public function getResaleRequests(Request $request)
    {
        $requests = ResaleRequest::with(['user', 'unit.project'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    public function reviewResale(Request $request, string $id)
    {
        $request->validate([
            'action' => 'required|string|in:approve,reject',
            'notes' => 'nullable|string',
        ]);

        $resale = ResaleRequest::findOrFail($id);

        if ($request->action === 'approve') {
            $resale->update([
                'status' => 'listed',
                'reviewed_by' => $request->user()->id,
                'review_notes' => $request->notes,
                'reviewed_at' => now(),
            ]);

            // Mark the unit as for_resale so company sales can see it
            $unit = Unit::find($resale->unit_id);
            if ($unit) {
                $unit->update(['status' => 'available']); // Re-list for sale
                AuditLogService::log('RESALE_APPROVED_UNIT_RELISTED', $request->user()->id, [
                    'resale_id' => $resale->id,
                    'unit_id' => $unit->id,
                ]);
            }
        } else {
            $resale->update([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'review_notes' => $request->notes,
                'reviewed_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Resale request ' . ($request->action === 'approve' ? 'approved and unit re-listed' : 'rejected') . '.',
            'data' => $resale->fresh(),
        ]);
    }
}
