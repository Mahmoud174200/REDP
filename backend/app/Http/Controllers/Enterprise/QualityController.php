<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Quality\QualityControlService;
use App\Models\SiteInspection;
use App\Models\NcrReport;
use App\Models\CapaAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QualityController extends Controller
{
    protected QualityControlService $qualityService;

    public function __construct(QualityControlService $qualityService)
    {
        $this->qualityService = $qualityService;
    }

    /**
     * Get quality inspections logs.
     */
    public function getInspections(Request $request): JsonResponse
    {
        try {
            $projectId = $request->query('project_id');
            $query = SiteInspection::with(['project', 'milestone', 'inspector', 'ncrReport']);

            if ($projectId) {
                $query->where('project_id', $projectId);
            }

            $inspections = $query->orderBy('created_at', 'desc')->get();
            return response()->json([
                'success' => true,
                'data' => $inspections
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading inspections: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record quality inspection.
     */
    public function createInspection(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'milestone_id' => 'nullable|exists:construction_milestones,id',
            'inspection_date' => 'required|date',
            'status' => 'required|in:passed,failed,pending_action',
            'comments' => 'nullable|string',
            'ncr_description' => 'required_if:status,failed|string',
            'ncr_severity' => 'required_if:status,failed|in:low,medium,high,critical'
        ]);

        try {
            $data = $request->all();
            // Assign inspector_id to user
            $data['inspector_id'] = $request->user()->id;

            $inspection = $this->qualityService->logInspection($data);

            return response()->json([
                'success' => true,
                'message' => 'Quality inspection logged successfully.',
                'data' => $inspection
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recording inspection: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get non-conformance reports.
     */
    public function getNcrs(Request $request): JsonResponse
    {
        try {
            $ncrs = NcrReport::with(['inspection.project', 'inspection.milestone', 'assignedEngineer', 'capaActions'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ncrs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading NCR tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve NCR defect.
     */
    public function resolveNcr(Request $request, string $id): JsonResponse
    {
        try {
            $engineerId = $request->user()->id;
            $ncr = $this->qualityService->resolveNcr($id, $engineerId);

            return response()->json([
                'success' => true,
                'message' => 'Non-Conformance Report resolved and marked passed.',
                'data' => $ncr
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resolving NCR: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create CAPA.
     */
    public function createCapa(Request $request): JsonResponse
    {
        $request->validate([
            'ncr_id' => 'required|exists:ncr_reports,id',
            'action_plan' => 'required|string',
            'due_date' => 'required|date'
        ]);

        try {
            $capa = $this->qualityService->createCapa($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Corrective action plan (CAPA) recorded.',
                'data' => $capa
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recording CAPA action: ' . $e->getMessage()
            ], 500);
        }
    }
}
