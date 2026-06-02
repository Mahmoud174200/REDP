<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Models\Project;
use App\Models\Reservation;
use App\Services\AuditLogService;
use App\Events\ReservationConfirmed;
use App\Events\Finance\UnitStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    /**
     * Get units index with advanced filtering and pagination.
     * Blueprint H.5 — Unit Inventory with database level locks
     */
    public function index(Request $request)
    {
        $query = Unit::with('project');

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->has('type') && $request->type !== 'all') {
            $query->byType($request->type);
        }
        if ($request->has('project_id')) {
            $query->byProject($request->project_id);
        }
        if ($request->has('min_price') && $request->has('max_price')) {
            $query->priceRange((float) $request->min_price, (float) $request->max_price);
        }
        if ($request->has('floor')) {
            $query->where('floor', $request->floor);
        }
        if ($request->has('search')) {
            $query->where('unit_number', 'LIKE', '%' . $request->search . '%');
        }

        $units = $query->latest()->get();

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'data' => $units,
        ]);
    }

    /**
     * Get single unit with full details.
     */
    public function show(string $id)
    {
        $unit = Unit::with(['project', 'reservations.client', 'activeReservation'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $unit,
        ]);
    }

    /**
     * Block / Reserve a unit using concurrent transactional locks.
     * Blueprint H.5 — Strict Row Locking prevents double-booking.
     */
    public function reserveUnit(Request $request, string $id)
    {
        $request->validate([
            'eoi_amount' => 'nullable|numeric|min:1000',
        ]);

        $clientId = $request->user()->id;
        $eoiAmount = $request->eoi_amount ?? 50000.00;

        try {
            $reservation = DB::transaction(function () use ($id, $clientId, $eoiAmount) {
                // Strict Row Locking to block other processes (Blueprint H.5)
                $unit = Unit::where('id', $id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($unit->status !== 'available') {
                    throw new \Exception('Unit is already reserved or sold. Concurrent lock prevented double-booking.');
                }

                $previousStatus = $unit->status;

                // 1. Lock the unit
                $unit->update(['status' => 'reserved']);

                // 2. Create the reservation record
                $resId = (string) Str::uuid();
                $res = Reservation::create([
                    'id' => $resId,
                    'unit_id' => $unit->id,
                    'client_id' => $clientId,
                    'eoi_amount' => $eoiAmount,
                    'status' => 'confirmed',
                    'expires_at' => now()->addDays(7),
                ]);

                // 3. Emit unit status change event
                event(new UnitStatusChanged($unit->id, $previousStatus, 'reserved', $clientId));

                return $res;
            });

            // 4. Emit decoupled event per Core Decoupling Protocol
            event(new ReservationConfirmed($reservation->id, $reservation->unit_id, $reservation->client_id));

            AuditLogService::log('UNIT_RESERVE', $clientId, [
                'unit_id' => $id,
                'reservation_id' => $reservation->id,
                'eoi_amount' => $eoiAmount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Unit reserved successfully. Contract draft and inspection tickets have been event-triggered.',
                'reservation' => $reservation,
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Release a locked/reserved unit (Admin only).
     */
    public function releaseUnit(Request $request, string $id)
    {
        $unit = Unit::findOrFail($id);

        if ($unit->status === 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Unit is already available.',
            ], 400);
        }

        $previousStatus = $unit->status;
        $unit->update(['status' => 'available']);

        // Cancel any active reservations
        Reservation::where('unit_id', $id)
            ->where('status', 'confirmed')
            ->update(['status' => 'cancelled']);

        event(new UnitStatusChanged($id, $previousStatus, 'available', $request->user()->id));
        AuditLogService::log('UNIT_RELEASE', $request->user()->id, ['unit_id' => $id, 'previous_status' => $previousStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Unit released and made available again.',
        ]);
    }

    /**
     * Update unit pricing (Admin / Finance officer).
     */
    public function updatePricing(Request $request, string $id)
    {
        $request->validate([
            'price' => 'required|numeric|min:0',
        ]);

        $unit = Unit::findOrFail($id);
        $oldPrice = $unit->price;
        $unit->update(['price' => $request->price]);

        AuditLogService::log('PRICING_UPDATE', $request->user()->id, [
            'unit_id' => $id,
            'old_price' => $oldPrice,
            'new_price' => $request->price,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit price updated successfully.',
            'unit' => $unit->fresh(),
        ]);
    }

    /**
     * Get dashboard statistics for the inventory module.
     */
    public function getStats()
    {
        $totalUnits = Unit::count();
        $available = Unit::where('status', 'available')->count();
        $reserved = Unit::where('status', 'reserved')->count();
        $sold = Unit::where('status', 'sold')->count();
        $blocked = Unit::where('status', 'blocked')->count();

        $totalValue = Unit::sum('price');
        $soldValue = Unit::where('status', 'sold')->sum('price');
        $reservedValue = Unit::where('status', 'reserved')->sum('price');

        $projects = Project::withCount('units')->get();

        return response()->json([
            'success' => true,
            'owner' => '🔵 Finance Team (Finance)',
            'stats' => [
                'total_units' => $totalUnits,
                'available' => $available,
                'reserved' => $reserved,
                'sold' => $sold,
                'blocked' => $blocked,
                'total_portfolio_value' => (float) $totalValue,
                'sold_value' => (float) $soldValue,
                'reserved_value' => (float) $reservedValue,
                'occupancy_rate' => $totalUnits > 0 ? round((($sold + $reserved) / $totalUnits) * 100, 1) : 0,
            ],
            'projects' => $projects,
        ]);
    }
}
