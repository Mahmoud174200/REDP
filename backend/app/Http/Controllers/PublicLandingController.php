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
        $projects = Project::withCount(['units' => function ($query) {
            $query->where('status', 'available');
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
        $units = Unit::where('project_id', $projectId)
            ->where('status', 'available')
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
}
