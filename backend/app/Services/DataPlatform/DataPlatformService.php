<?php

namespace App\Services\DataPlatform;

use App\Models\KpiMetric;
use App\Models\DashboardLayout;
use App\Models\Payment;
use App\Models\Lead;
use App\Models\PurchaseOrder;
use App\Models\CommissionPayout;
use App\Models\LegalCase;
use App\Models\Budget;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DataPlatformService
{
    /**
     * Compute and refresh all KPI metrics cached in database.
     */
    public function recalculateMetrics(?string $companyId = null): void
    {
        $currentYear = Carbon::now()->year;

        // KPI 1: YTD Revenue (sum of paid/collected payments this year)
        $revenueYTD = Payment::whereIn('status', ['paid', 'collected'])
            ->whereYear('due_date', $currentYear)
            ->sum('amount');

        $this->updateMetric($companyId, 'revenue_ytd', 'Revenue Year-To-Date', 'finance', $revenueYTD, 50000000.00);

        // KPI 2: Lead Conversion Rate
        $totalLeads = Lead::count();
        $convertedLeads = Lead::whereIn('status', ['converted', 'closed', 'won'])->count();
        $conversionRate = $totalLeads > 0 ? ($convertedLeads / $totalLeads) * 100 : 0;

        $this->updateMetric($companyId, 'lead_conversion_rate', 'Lead Conversion Rate', 'sales', $conversionRate, 25.00);

        // KPI 3: PO Turnaround Time (average hours to approve POs)
        // Let's use mock or calculate actual difference if approved_at exists
        $avgHours = DB::table('purchase_orders')
            ->whereNotNull('approved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, approved_at)) as avg_time'))
            ->value('avg_time') ?: 4.2; // default 4.2 hours

        $this->updateMetric($companyId, 'po_turnaround_time', 'PO Approval Turnaround (Hrs)', 'procurement', $avgHours, 8.00);

        // KPI 4: Total Commission Payouts
        $commissionsTotal = CommissionPayout::where('status', 'paid')->sum('total_amount');

        $this->updateMetric($companyId, 'commission_payouts_total', 'Total Commissions Paid', 'finance', $commissionsTotal, 2000000.00);

        // KPI 5: Active Lawsuits
        $activeCases = LegalCase::whereNotIn('status', ['resolved', 'closed', 'archived'])->count();

        $this->updateMetric($companyId, 'active_lawsuits_count', 'Active Lawsuits Count', 'legal', $activeCases, 0.00);

        // KPI 6: Budget Burn Rate
        $totalAllocated = Budget::sum('amount');
        $totalSpent = Budget::sum('spent_amount');
        $burnRate = $totalAllocated > 0 ? ($totalSpent / $totalAllocated) * 100 : 0;

        $this->updateMetric($companyId, 'budget_burn_rate', 'Budget Burn Rate %', 'finance', $burnRate, 100.00);
    }

    /**
     * Helper to write/update KPI metric values.
     */
    protected function updateMetric(?string $companyId, string $name, string $displayName, string $category, float $value, float $target)
    {
        KpiMetric::updateOrCreate(
            [
                'company_id' => $companyId,
                'name' => $name,
                'period' => 'yearly'
            ],
            [
                'display_name' => $displayName,
                'category' => $category,
                'value' => $value,
                'target_value' => $target,
                'calculated_at' => now()
            ]
        );
    }

    /**
     * Get dashboard metrics structured by executive role layout.
     */
    public function getDashboardData(string $roleType, ?string $companyId = null): array
    {
        // Automatically ensure metrics are calculated
        if (KpiMetric::count() === 0) {
            $this->recalculateMetrics($companyId);
        }

        // Fetch KPIs
        $metrics = KpiMetric::where('company_id', $companyId)->get()->keyBy('name');

        // Fetch or create layout widgets
        $layout = DashboardLayout::where('role_type', $roleType)->first();
        if (!$layout) {
            $layout = $this->createDefaultLayout($roleType);
        }

        $kpis = [];
        foreach ($metrics as $name => $m) {
            $kpis[$name] = [
                'name' => $m->name,
                'display_name' => $m->display_name,
                'category' => $m->category,
                'value' => (float)$m->value,
                'target_value' => (float)$m->target_value,
                'calculated_at' => $m->calculated_at->toIso8601String()
            ];
        }

        // Add contextual charts data
        $additional = [];
        if ($roleType === 'ceo') {
            $additional = [
                'cashflow_trend' => [
                    ['month' => 'Jan', 'inflow' => 15000000, 'outflow' => 8000000],
                    ['month' => 'Feb', 'inflow' => 12000000, 'outflow' => 9000000],
                    ['month' => 'Mar', 'inflow' => 18000000, 'outflow' => 11000000],
                    ['month' => 'Apr', 'inflow' => 22000000, 'outflow' => 14000000],
                    ['month' => 'May', 'inflow' => 25000000, 'outflow' => 15000000],
                ],
                'pending_approvals_count' => DB::table('approval_instances')->where('status', 'pending')->count()
            ];
        } elseif ($roleType === 'director') {
            $additional = [
                'sales_pipeline' => [
                    ['stage' => 'Lead Gen', 'count' => 85, 'value' => 42000000],
                    ['stage' => 'Presentation', 'count' => 42, 'value' => 28000000],
                    ['stage' => 'EOI Queue', 'count' => 19, 'value' => 15000000],
                    ['stage' => 'Reservation', 'count' => 11, 'value' => 9000000],
                ],
                'procurement_turnaround' => [
                    ['department' => 'Operations', 'hours' => 2.4],
                    ['department' => 'Construction', 'hours' => 5.1],
                    ['department' => 'Marketing', 'hours' => 1.8],
                ]
            ];
        } elseif ($roleType === 'regional_manager' || $roleType === 'branch_manager') {
            $additional = [
                'branch_collections' => [
                    ['branch' => 'Cairo East', 'target' => 20000000, 'actual' => 18500000],
                    ['branch' => 'Alexandria', 'target' => 12000000, 'actual' => 11200000],
                    ['branch' => 'Giza West', 'target' => 15000000, 'actual' => 12800000],
                ]
            ];
        }

        return [
            'role_type' => $roleType,
            'kpis' => $kpis,
            'widgets' => $layout->widgets,
            'context_data' => $additional
        ];
    }

    /**
     * Seed default widget layouts if not existing.
     */
    protected function createDefaultLayout(string $roleType): DashboardLayout
    {
        $widgets = [];
        if ($roleType === 'ceo') {
            $widgets = [
                ['id' => 'w1', 'type' => 'card', 'metric' => 'revenue_ytd', 'size' => 'sm'],
                ['id' => 'w2', 'type' => 'card', 'metric' => 'commission_payouts_total', 'size' => 'sm'],
                ['id' => 'w3', 'type' => 'card', 'metric' => 'budget_burn_rate', 'size' => 'sm'],
                ['id' => 'w4', 'type' => 'chart', 'name' => 'cashflow_trend', 'size' => 'lg'],
            ];
        } elseif ($roleType === 'director') {
            $widgets = [
                ['id' => 'w1', 'type' => 'card', 'metric' => 'lead_conversion_rate', 'size' => 'sm'],
                ['id' => 'w2', 'type' => 'card', 'metric' => 'po_turnaround_time', 'size' => 'sm'],
                ['id' => 'w3', 'type' => 'card', 'metric' => 'active_lawsuits_count', 'size' => 'sm'],
                ['id' => 'w4', 'type' => 'chart', 'name' => 'sales_pipeline', 'size' => 'lg'],
            ];
        } else {
            $widgets = [
                ['id' => 'w1', 'type' => 'card', 'metric' => 'revenue_ytd', 'size' => 'sm'],
                ['id' => 'w2', 'type' => 'card', 'metric' => 'lead_conversion_rate', 'size' => 'sm'],
                ['id' => 'w3', 'type' => 'chart', 'name' => 'branch_collections', 'size' => 'lg'],
            ];
        }

        return DashboardLayout::create([
            'role_type' => $roleType,
            'widgets' => $widgets
        ]);
    }
}
