<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Construction\ConstructionService;
use App\Models\ProjectPhase;
use App\Models\ConstructionMilestone;
use App\Models\BoqItem;
use App\Models\ResourceAllocation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;


class ConstructionController extends Controller
{
    protected ConstructionService $constructionService;

    public function __construct(ConstructionService $constructionService)
    {
        $this->constructionService = $constructionService;
    }

    /**
     * Get list of project phases with milestones and progress calculations.
     */
    public function getPhases(Request $request): JsonResponse
    {
        try {
            $projectId = $request->query('project_id');
            $query = ProjectPhase::with(['milestones', 'boqItems']);
            
            if ($projectId) {
                $query->where('project_id', $projectId);
            }

            $phases = $query->get();

            // Calculate live weighted progress for each phase object
            foreach ($phases as $phase) {
                $phase->progress_percentage = $this->constructionService->calculatePhaseProgress($phase->id);
            }

            return response()->json([
                'success' => true,
                'data' => $phases
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading phases: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of construction milestones.
     */
    public function getMilestones(Request $request): JsonResponse
    {
        try {
            $projectId = $request->query('project_id');
            $query = ConstructionMilestone::query();

            if ($projectId) {
                $query->whereHas('phase', function ($q) use ($projectId) {
                    $q->where('project_id', $projectId);
                });
            }

            $milestones = $query->get();

            return response()->json([
                'success' => true,
                'data' => $milestones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading milestones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create project phase.
     */
    public function createPhase(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        try {
            $phase = $this->constructionService->createPhase($request->all());
            
            // Seed a few default milestones and BOQ items for demo
            $this->seedMilestonesAndBOQ($phase);

            return response()->json([
                'success' => true,
                'message' => 'Project phase created successfully.',
                'data' => $phase
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating phase: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update milestone progress percentage.
     */
    public function updateMilestone(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'progress_percentage' => 'required|numeric|min:0|max:100'
        ]);

        try {
            $milestone = $this->constructionService->updateMilestoneProgress(
                $id,
                (float)$request->input('progress_percentage')
            );

            return response()->json([
                'success' => true,
                'message' => 'Milestone progress updated.',
                'data' => $milestone
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating milestone: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get BOQ items.
     */
    public function getBoq(Request $request): JsonResponse
    {
        try {
            $phaseId = $request->query('phase_id');
            $query = BoqItem::with('phase');
            if ($phaseId) {
                $query->where('phase_id', $phaseId);
            }
            $items = $query->get();
            return response()->json([
                'success' => true,
                'data' => $items
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading BOQ ledger: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Allocate resources to milestone.
     */
    public function createResource(Request $request): JsonResponse
    {
        $request->validate([
            'milestone_id' => 'required|exists:construction_milestones,id',
            'resource_type' => 'required|in:labor,equipment,material',
            'name' => 'required|string|max:100',
            'quantity' => 'required|integer|min:1',
            'cost' => 'required|numeric|min:0'
        ]);

        try {
            $resource = ResourceAllocation::create($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Resource allocated successfully.',
                'data' => $resource
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error allocating resource: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to populate default milestones and BOQ lines for demonstration purposes.
     */
    protected function seedMilestonesAndBOQ(ProjectPhase $phase)
    {
        // 1. Seed Milestones
        $milestones = [
            ['title' => 'Site Excavation and Piling', 'weight' => 20.00, 'due_offset' => 10],
            ['title' => 'Foundation Pouring and Curing', 'weight' => 30.00, 'due_offset' => 25],
            ['title' => 'Superstructure Masonry Framing', 'weight' => 50.00, 'due_offset' => 45],
        ];

        foreach ($milestones as $m) {
            ConstructionMilestone::create([
                'phase_id' => $phase->id,
                'title' => $m['title'],
                'weight' => $m['weight'],
                'progress_percentage' => 0.00,
                'status' => 'pending',
                'due_date' => Carbon::parse($phase->start_date)->addDays($m['due_offset'])->toDateString()
            ]);
        }

        // 2. Seed BOQ items
        $boq = [
            ['code' => 'BOQ-01', 'desc' => 'High Grade Portland Cement', 'unit' => 'tons', 'qty' => 150, 'price' => 2200],
            ['code' => 'BOQ-02', 'desc' => 'Deformed Rebar Steel Bars', 'unit' => 'tons', 'qty' => 45, 'price' => 38000],
            ['code' => 'BOQ-03', 'desc' => 'Fine Sand Aggregate Material', 'unit' => 'm3', 'qty' => 600, 'price' => 450],
        ];

        foreach ($boq as $item) {
            BoqItem::create([
                'phase_id' => $phase->id,
                'item_code' => $item['code'],
                'description' => $item['desc'],
                'unit' => $item['unit'],
                'planned_quantity' => $item['qty'],
                'actual_quantity' => 0.00,
                'unit_price' => $item['price'],
                'total_price' => $item['qty'] * $item['price']
            ]);
        }
    }
}
