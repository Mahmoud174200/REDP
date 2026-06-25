<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Unit;
use App\Models\Lead;
use App\Models\EoiQueue;
use App\Models\EoiReservation;
use App\Models\Reservation;
use App\Models\Interaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicLandingController extends Controller
{
    /**
     * Get all active/planning projects with payment plans and count of available units.
     */
    public function getProjects(): JsonResponse
    {
        $driver = DB::connection()->getDriverName();
        $concatSql = $driver === 'sqlite' 
            ? "projects.released_phases LIKE '%\"' || units.phase || '\"%'" 
            : "projects.released_phases LIKE CONCAT('%\"', units.phase, '\"%')";

        $projects = Project::withCount(['units' => function ($query) use ($concatSql) {
            $query->where('status', 'available')
                ->where(function ($q) use ($concatSql) {
                    $q->whereRaw("projects.released_phases IS NULL AND units.phase = 'Phase 1'")
                      ->orWhereRaw($concatSql);
                });
        }])->with(['paymentPlans', 'media'])->get();

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * Get available units for a specific project.
     */
    public function getProjectUnits(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $releasedPhases = $project->released_phases; // Calls the array cast/accessor (defaults to ['Phase 1'])

        $units = Unit::where('project_id', $projectId)
            ->whereNotNull('building_id')
            ->where('building_id', '!=', '')
            ->whereIn('status', ['available', 'coming_soon'])
            ->whereIn('phase', $releasedPhases)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }

    /**
     * Get the logged-in client's active EOI invitation details.
     */
    public function getClientEoiInvitation(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Find approved and invited EOI reservation
        $invitation = EoiReservation::where(function ($q) use ($user) {
                $q->where('client_email', $user->email)
                  ->orWhere('client_phone', $user->phone);
            })
            ->where('status', EoiReservation::STATUS_APPROVED)
            ->whereNotNull('invited_at')
            ->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'No active invitation found.',
            ], 444);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $invitation->id,
                'project_id' => $invitation->project_id,
                'client_name' => $invitation->client_name,
                'client_email' => $invitation->client_email,
                'client_phone' => $invitation->client_phone,
                'queue_number' => $invitation->queue_number,
                'contracting_deadline_hours' => $invitation->contracting_deadline_hours,
                'invited_at' => $invitation->invited_at,
            ],
        ]);
    }

    /**
     * Submit an EOI (Expression of Interest) priority queue request.
     */
    public function submitEoi(Request $request): JsonResponse
    {
        $user = auth()->guard('sanctum')->user();
        $isUnitReservation = false;
        $eoiRes = null;

        if ($user && $request->filled('unit_id')) {
            $eoiRes = EoiReservation::where('project_id', $request->input('project_id'))
                ->where(function ($q) use ($user) {
                    $q->where('client_email', $user->email)
                      ->orWhere('client_phone', $user->phone);
                })
                ->where('status', EoiReservation::STATUS_APPROVED)
                ->whereNotNull('invited_at')
                ->first();

            if ($eoiRes) {
                $isUnitReservation = true;
            }
        }

        if ($isUnitReservation) {
            $fields = $request->validate([
                'project_id' => 'required|uuid|exists:projects,id',
                'unit_id'    => 'required|uuid|exists:units,id',
            ]);

            try {
                $result = DB::transaction(function () use ($fields, $user, $eoiRes) {
                    $unit = Unit::where('id', $fields['unit_id'])
                        ->where('project_id', $fields['project_id'])
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($unit->status !== 'available') {
                        throw new \Exception('This unit is no longer available. / هذه الوحدة لم تعد متاحة.');
                    }

                    $unit->update(['status' => 'reserved']);
                    $eoiRes->update(['unit_id' => $unit->id]);

                    $deadlineHours = $eoiRes->contracting_deadline_hours ?: 48;
                    $reservation = Reservation::create([
                        'id' => (string) Str::uuid(),
                        'unit_id' => $unit->id,
                        'client_id' => $user->id,
                        'eoi_amount' => $eoiRes->payment_amount,
                        'status' => 'confirmed',
                        'expires_at' => now()->addHours($deadlineHours),
                        'payment_receipt_path' => $eoiRes->receipt_path,
                    ]);

                    event(new \App\Events\Finance\UnitStatusChanged($unit->id, 'available', 'reserved', $user->id));
                    event(new \App\Events\ReservationConfirmed($reservation->id, $reservation->unit_id, $reservation->client_id));

                    return [
                        'reservation' => $reservation,
                        'deadline_hours' => $deadlineHours,
                    ];
                });

                try {
                    \App\Services\EoiEmailService::sendUnitReservedEmail($result['reservation'], $result['deadline_hours']);
                } catch (\Throwable $emailEx) {
                    \Illuminate\Support\Facades\Log::error("Failed to send unit reserved email: " . $emailEx->getMessage());
                }

                \App\Services\AuditLogService::log('UNIT_RESERVE_EOI', $user->id, [
                    'unit_id' => $fields['unit_id'],
                    'reservation_id' => $result['reservation']->id,
                    'eoi_reservation_id' => $eoiRes->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Unit reserved successfully. / تم حجز الوحدة بنجاح.',
                    'data' => $result['reservation'],
                ], 201);

            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }
        }

        $fields = $request->validate([
            'first_name'       => 'required|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'required|email|max:255',
            'phone'            => 'required|string|max:255',
            'national_id'      => 'nullable|string|max:255',
            'project_id'       => 'required|uuid|exists:projects,id',
            'unit_id'          => 'nullable|uuid|exists:units,id',
            'eoi_amount'       => 'nullable|numeric|min:0',
            'client_location'  => 'required|string|in:inside_egypt,outside_egypt',
            'payment_method'   => 'required|string|in:cash,bank_transfer,cheque,international_bank_transfer,instapay',
            'receipt'          => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf',
            'passport'         => 'required_if:client_location,outside_egypt|file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf',
            
            // Standard of Living Fields
            'education'          => 'nullable|string|max:255',
            'job_title'          => 'nullable|string|max:255',
            'monthly_income'     => 'nullable|numeric|min:0',
            'income_currency'    => 'nullable|string|max:10',
            'marital_status'     => 'nullable|string|max:50',
            'number_of_children' => 'nullable|integer|min:0',
            'children_ages'      => 'nullable|string|max:255',
            'children_schools'   => 'nullable|string|max:255',
            'current_residence'  => 'nullable|string|max:255',
            'residence_type'     => 'nullable|string|max:50',
            'cars_owned'         => 'nullable|string',
            'club_memberships'   => 'nullable|string|max:255',
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

        try {
            // Handle files first (before database transaction)
            $receiptPath = $request->file('receipt')->store('eoi-receipts', 'public');
            $passportPath = null;
            if ($request->hasFile('passport')) {
                $passportPath = $request->file('passport')->store('eoi-passports', 'public');
            }

            $result = DB::transaction(function () use ($fields, $receiptPath, $passportPath) {
                // Find or create lead by email/phone
                $lead = Lead::where('email', $fields['email'])
                    ->orWhere('phone', $fields['phone'])
                    ->first();

                if (!$lead) {
                    $lead = Lead::create([
                        'id'                    => (string) Str::uuid(),
                        'first_name'            => $fields['first_name'],
                        'last_name'             => $fields['last_name'],
                        'email'                 => $fields['email'],
                        'phone'                 => $fields['phone'],
                        'national_id'           => $fields['national_id'] ?? null,
                        'status'                => Lead::STATUS_NEW,
                        'source'                => 'website_eoi',
                        'interested_project_id' => $fields['project_id'],
                    ]);
                }

                if ($passportPath) {
                    $lead->update([
                        'passport_path' => $passportPath,
                    ]);
                }

                // Check for duplicate EOI
                $existing = EoiReservation::where('lead_id', $lead->id)
                    ->where('project_id', $fields['project_id'])
                    ->whereIn('status', [EoiReservation::STATUS_PENDING_REVIEW, EoiReservation::STATUS_APPROVED])
                    ->first();

                if ($existing) {
                    return [
                        'duplicate'    => true,
                        'queue_number' => $existing->queue_number,
                        'data'         => $existing,
                    ];
                }

                $eoi = EoiReservation::create([
                    'id'              => (string) Str::uuid(),
                    'lead_id'         => $lead->id,
                    'project_id'      => $fields['project_id'],
                    'unit_id'         => $fields['unit_id'] ?? null,
                    'client_name'     => $fields['first_name'] . ' ' . $fields['last_name'],
                    'client_email'    => $fields['email'],
                    'client_phone'    => $fields['phone'],
                    'client_location' => $fields['client_location'],
                    'payment_method'  => $fields['payment_method'],
                    'payment_amount'  => $fields['eoi_amount'] ?? 50000.00,
                    'receipt_path'    => $receiptPath,
                    'passport_path'   => $passportPath,
                    'status'          => EoiReservation::STATUS_PENDING_REVIEW,
                    
                    'education'          => $fields['education'] ?? null,
                    'job_title'          => $fields['job_title'] ?? null,
                    'monthly_income'     => $fields['monthly_income'] ?? null,
                    'income_currency'    => $fields['income_currency'] ?? null,
                    'marital_status'     => $fields['marital_status'] ?? null,
                    'number_of_children' => $fields['number_of_children'] ?? 0,
                    'children_ages'      => $fields['children_ages'] ?? null,
                    'children_schools'   => $fields['children_schools'] ?? null,
                    'current_residence'  => $fields['current_residence'] ?? null,
                    'residence_type'     => $fields['residence_type'] ?? null,
                    'cars_owned'         => $fields['cars_owned'] ?? null,
                    'club_memberships'   => $fields['club_memberships'] ?? null,
                ]);

                // Optional: If a unit is specified, we can temporarily block it or note it
                if (!empty($fields['unit_id'])) {
                    $unit = Unit::find($fields['unit_id']);
                    if ($unit && $unit->status === 'available') {
                        // Mark as reserved
                        $unit->update(['status' => 'reserved']);
                    }
                }

                return [
                    'duplicate'    => false,
                    'queue_number' => $eoi->queue_number,
                    'data'         => $eoi,
                ];
            });

            if ($result['duplicate']) {
                return response()->json([
                    'success'      => false,
                    'message'      => 'An active reservation already exists for these contact details. / يوجد بالفعل طلب حجز نشط مسجل لبيانات الاتصال هذه.',
                    'queue_number' => $result['queue_number'],
                    'data'         => $result['data'],
                ], 409);
            }

            return response()->json([
                'success'      => true,
                'message'      => "Expression of Interest submitted successfully. Your payment receipt is pending review.",
                'queue_number' => null,
                'data'         => $result['data'],
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Submit a contact inquiry.
     */
    public function submitContact(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'required|string|max:255',
            'message'    => 'required|string|max:2000',
        ]);

        try {
            DB::transaction(function () use ($fields) {
                // Find or create lead
                $lead = Lead::where('email', $fields['email'])
                    ->orWhere('phone', $fields['phone'])
                    ->first();

                if (!$lead) {
                    $lead = Lead::create([
                        'id'         => (string) Str::uuid(),
                        'first_name' => $fields['first_name'],
                        'last_name'  => $fields['last_name'],
                        'email'      => $fields['email'],
                        'phone'      => $fields['phone'],
                        'status'     => Lead::STATUS_NEW,
                        'source'     => 'website_contact',
                    ]);
                }

                // Log interaction
                Interaction::create([
                    'id'      => (string) Str::uuid(),
                    'lead_id' => $lead->id,
                    'type'    => Interaction::TYPE_EMAIL,
                    'notes'   => "Website Contact Message: " . $fields['message'],
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Your message was received successfully. Our sales team will contact you shortly.',
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get project units grouped by building and floor for interactive 3D unit selection.
     */
    public function getProjectUnitsByBuilding(string $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $releasedPhases = $project->released_phases;

        $units = Unit::where('project_id', $projectId)
            ->whereNotNull('building_id')
            ->where('building_id', '!=', '')
            ->whereIn('phase', $releasedPhases)
            ->orderBy('building')
            ->orderBy('floor')
            ->orderBy('unit_number')
            ->get();

        // Group units by building, then by floor
        $buildingsMap = [];
        foreach ($units as $unit) {
            $buildingName = $unit->building ?: 'Main Building';
            $floor = (int) $unit->floor;

            if (!isset($buildingsMap[$buildingName])) {
                $buildingsMap[$buildingName] = [];
            }
            if (!isset($buildingsMap[$buildingName][$floor])) {
                $buildingsMap[$buildingName][$floor] = [];
            }
            $buildingsMap[$buildingName][$floor][] = $unit;
        }

        // Structure the response
        $buildings = [];
        foreach ($buildingsMap as $buildingName => $floors) {
            $floorData = [];
            $totalAvailable = 0;
            $totalUnits = 0;

            ksort($floors);
            foreach ($floors as $floorNum => $floorUnits) {
                $available = collect($floorUnits)->where('status', 'available')->count();
                $totalAvailable += $available;
                $totalUnits += count($floorUnits);

                $floorData[] = [
                    'floor' => $floorNum,
                    'units' => $floorUnits,
                    'total_units' => count($floorUnits),
                    'available_units' => $available,
                ];
            }

            $buildings[] = [
                'name' => $buildingName,
                'total_floors' => count($floors),
                'total_units' => $totalUnits,
                'available_units' => $totalAvailable,
                'floors' => $floorData,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'location' => $project->location,
                    'status' => $project->status,
                    'delivery_date' => $project->delivery_date,
                ],
                'buildings' => $buildings,
            ],
        ]);
    }
}
