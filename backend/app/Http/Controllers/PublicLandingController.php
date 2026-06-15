<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Unit;
use App\Models\Lead;
use App\Models\EoiQueue;
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
        }])->with('paymentPlans')->get();

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
            ->whereIn('status', ['available', 'coming_soon'])
            ->whereIn('phase', $releasedPhases)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }

    /**
     * Submit an EOI (Expression of Interest) priority queue request.
     */
    public function submitEoi(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'first_name'  => 'required|string|max:255',
            'last_name'   => 'required|string|max:255',
            'email'       => 'required|email|max:255',
            'phone'       => 'required|string|max:255',
            'national_id' => 'nullable|string|max:255',
            'project_id'  => 'required|uuid|exists:projects,id',
            'unit_id'     => 'nullable|uuid|exists:units,id',
            'eoi_amount'  => 'nullable|numeric|min:0',
            'notes'       => 'nullable|string|max:1000',
        ]);

        try {
            $result = DB::transaction(function () use ($fields) {
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

                // Check for duplicate EOI
                $existing = EoiQueue::where('lead_id', $lead->id)
                    ->where('project_id', $fields['project_id'])
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->first();

                if ($existing) {
                    return [
                        'duplicate'    => true,
                        'queue_number' => $existing->queue_number,
                        'data'         => $existing,
                    ];
                }

                // Calculate priority score
                $priorityScore = microtime(true);
                $queueNumber = EoiQueue::where('project_id', $fields['project_id'])->count() + 1;

                $eoi = EoiQueue::create([
                    'id'             => (string) Str::uuid(),
                    'lead_id'        => $lead->id,
                    'project_id'     => $fields['project_id'],
                    'queue_number'   => $queueNumber,
                    'priority_score' => $priorityScore,
                    'status'         => EoiQueue::STATUS_PENDING,
                    'eoi_amount'     => $fields['eoi_amount'] ?? 50000.00,
                    'notes'          => $fields['notes'] ?? ($fields['unit_id'] ? "Reserved Unit: {$fields['unit_id']}" : null),
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
                    'success'      => true,
                    'message'      => "You already have an active reservation queue ticket #{$result['queue_number']}.",
                    'queue_number' => $result['queue_number'],
                    'data'         => $result['data'],
                ], 200);
            }

            return response()->json([
                'success'      => true,
                'message'      => "Expression of Interest submitted. Your priority queue number is #{$result['queue_number']}.",
                'queue_number' => $result['queue_number'],
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
