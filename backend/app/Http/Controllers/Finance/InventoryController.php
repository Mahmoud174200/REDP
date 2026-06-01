<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Services\AuditLogService;
use App\Events\ReservationConfirmed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    /**
     * Get units index.
     */
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🔵 Melwany (Finance)',
            'data' => Unit::with('project')->latest()->get()
        ]);
    }

    /**
     * Block / Reserve a unit using concurrent transactional locks.
     */
    public function reserveUnit(Request $request, string $id)
    {
        $clientId = $request->user()->id;

        try {
            $reservation = DB::transaction(function () use ($id, $clientId) {
                // Strict Row Locking to block other processes (Blueprint H.5)
                $unit = Unit::where('id', $id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($unit->status !== 'available') {
                    throw new \Exception('Unit is already reserved or sold.');
                }

                // 1. Lock the unit
                $unit->update([
                    'status' => 'reserved'
                ]);

                // 2. Create the reservation record
                $resId = (string) Str::uuid();
                $res = \App\Models\Reservation::create([
                    'id' => $resId,
                    'unit_id' => $unit->id,
                    'client_id' => $clientId,
                    'eoi_amount' => 50000.00, // standard EOI
                    'status' => 'confirmed',
                    'expires_at' => now()->addDays(7),
                ]);

                return $res;
            });

            // 3. Emit decoupled event per Core Decoupling Protocol
            event(new ReservationConfirmed($reservation->id, $reservation->unit_id, $reservation->client_id));

            AuditLogService::log('UNIT_RESERVE', $clientId, ['unit_id' => $id, 'reservation_id' => $reservation->id]);

            return response()->json([
                'success' => true,
                'message' => 'Unit reserved successfully. Contract draft and inspection tickets have been event-triggered.',
                'reservation' => $reservation
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
