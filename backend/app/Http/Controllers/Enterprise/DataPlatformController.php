<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\DataPlatform\DataPlatformService;
use App\Models\KpiMetric;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DataPlatformController extends Controller
{
    protected DataPlatformService $dpService;

    public function __construct(DataPlatformService $dpService)
    {
        $this->dpService = $dpService;
    }

    /**
     * Get dashboard metrics structured for a specific role type.
     */
    public function getDashboard(Request $request, string $roleType): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id ?? null;
            $data = $this->dpService->getDashboardData($roleType, $companyId);
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading dashboard layout: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get raw list of KPI metrics.
     */
    public function getKpis(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id ?? null;
            $kpis = KpiMetric::where('company_id', $companyId)->get();
            return response()->json([
                'success' => true,
                'data' => $kpis
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching KPIs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Explicit trigger to force recalculation of cached KPIs.
     */
    public function recalculateKpis(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id ?? null;
            $this->dpService->recalculateMetrics($companyId);
            return response()->json([
                'success' => true,
                'message' => 'KPIs recalculated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recalculating KPIs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export KPI metrics as CSV stream.
     */
    public function exportDashboardData(Request $request)
    {
        try {
            $companyId = $request->user()->company_id ?? null;
            $kpis = KpiMetric::where('company_id', $companyId)->get();

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="REDP_KPI_Metrics_' . date('Ymd') . '.csv"',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0'
            ];

            $callback = function() use ($kpis) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['KPI Code', 'Display Name', 'Category', 'Period', 'Value', 'Target Value', 'Variance', 'Calculated At']);

                foreach ($kpis as $kpi) {
                    $value = (float)$kpi->value;
                    $target = (float)$kpi->target_value;
                    $variance = $target > 0 ? (($value - $target) / $target) * 100 : 0;
                    
                    fputcsv($file, [
                        $kpi->name,
                        $kpi->display_name,
                        $kpi->category,
                        $kpi->period,
                        $value,
                        $target,
                        round($variance, 2) . '%',
                        $kpi->calculated_at
                    ]);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting KPIs: ' . $e->getMessage()
            ], 500);
        }
    }
}
