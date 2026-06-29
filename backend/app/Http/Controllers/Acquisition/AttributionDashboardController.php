<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Campaign;
use App\Models\EoiReservation;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Controller: AttributionDashboardController
 *
 * GET /v1/acquisition/dashboard/attribution
 *
 * Aggregated CRM analytics, computed from authoritative tables
 * (leads / eoi_reservations / campaigns / brokers) so it works
 * on existing data — not only on newly-tracked attribution rows.
 *
 * Query params:
 *   from        Y-m-d   (default: 30 days ago)
 *   to          Y-m-d   (default: today)
 *   project_id  uuid    (optional filter on leads.interested_project_id)
 * ─────────────────────────────────────────────────────────
 */
class AttributionDashboardController extends Controller
{
    public function attribution(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $projectId = $request->input('project_id');

        // Reusable base lead query (respects date range + optional project).
        $baseLeads = fn () => Lead::query()
            ->whereBetween('created_at', [$from, $to])
            ->when($projectId, fn ($q) => $q->where('interested_project_id', $projectId));

        $totalLeads = (clone $baseLeads())->count();

        // ── Funnel counts (authoritative) ──
        $eoiLeadIds = EoiReservation::query()
            ->where('status', EoiReservation::STATUS_APPROVED)
            ->when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->whereBetween('created_at', [$from, $to])
            ->distinct()->pluck('lead_id')->filter();
        $eoiPaid = $eoiLeadIds->count();

        $reserved = (clone $baseLeads())
            ->whereIn('status', [Lead::STATUS_RESERVED, Lead::STATUS_CONTRACTED])->count();
        $contracted = (clone $baseLeads())
            ->where('status', Lead::STATUS_CONTRACTED)->count();

        $rate = fn ($num) => $totalLeads > 0 ? round($num / $totalLeads * 100, 2) : 0.0;

        // ── Breakdowns ──
        $leadsBySource = (clone $baseLeads())
            ->select('source', DB::raw('COUNT(*) as total'))
            ->groupBy('source')->pluck('total', 'source');

        $byBrokerRaw = (clone $baseLeads())
            ->whereNotNull('broker_id')
            ->select('broker_id', DB::raw('COUNT(*) as total'))
            ->groupBy('broker_id')->get();
        $brokerNames = Broker::whereIn('id', $byBrokerRaw->pluck('broker_id'))
            ->pluck('agency_name', 'id');
        $leadsByBroker = $byBrokerRaw->map(fn ($r) => [
            'broker_id'   => $r->broker_id,
            'broker_name' => $brokerNames[$r->broker_id] ?? 'Unknown',
            'leads'       => (int) $r->total,
        ])->sortByDesc('leads')->values();

        $byCampaignRaw = (clone $baseLeads())
            ->whereNotNull('campaign_id')
            ->select('campaign_id', DB::raw('COUNT(*) as total'))
            ->groupBy('campaign_id')->get();
        $campaignNames = Campaign::whereIn('id', $byCampaignRaw->pluck('campaign_id'))
            ->pluck('name', 'id');
        $leadsByCampaign = $byCampaignRaw->map(fn ($r) => [
            'campaign_id'   => $r->campaign_id,
            'campaign_name' => $campaignNames[$r->campaign_id] ?? 'Unknown',
            'leads'         => (int) $r->total,
        ])->sortByDesc('leads')->values();

        // ── Revenue (collected EOI revenue, joined via lead → broker / campaign) ──
        $revenueByBroker = EoiReservation::query()
            ->where('eoi_reservations.status', EoiReservation::STATUS_APPROVED)
            ->join('leads', 'leads.id', '=', 'eoi_reservations.lead_id')
            ->whereNotNull('leads.broker_id')
            ->whereBetween('eoi_reservations.created_at', [$from, $to])
            ->select('leads.broker_id', DB::raw('SUM(eoi_reservations.payment_amount) as revenue'), DB::raw('COUNT(*) as deals'))
            ->groupBy('leads.broker_id')->get()
            ->map(fn ($r) => [
                'broker_id'   => $r->broker_id,
                'broker_name' => $brokerNames[$r->broker_id] ?? Broker::where('id', $r->broker_id)->value('agency_name') ?? 'Unknown',
                'revenue'     => (float) $r->revenue,
                'deals'       => (int) $r->deals,
            ])->sortByDesc('revenue')->values();

        $revenueByCampaign = EoiReservation::query()
            ->where('eoi_reservations.status', EoiReservation::STATUS_APPROVED)
            ->join('leads', 'leads.id', '=', 'eoi_reservations.lead_id')
            ->whereNotNull('leads.campaign_id')
            ->whereBetween('eoi_reservations.created_at', [$from, $to])
            ->select('leads.campaign_id', DB::raw('SUM(eoi_reservations.payment_amount) as revenue'), DB::raw('COUNT(*) as deals'))
            ->groupBy('leads.campaign_id')->get()
            ->map(fn ($r) => [
                'campaign_id'   => $r->campaign_id,
                'campaign_name' => $campaignNames[$r->campaign_id] ?? Campaign::where('id', $r->campaign_id)->value('name') ?? 'Unknown',
                'revenue'       => (float) $r->revenue,
                'deals'         => (int) $r->deals,
            ])->sortByDesc('revenue')->values();

        $totalRevenue = (float) EoiReservation::where('status', EoiReservation::STATUS_APPROVED)
            ->when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->whereBetween('created_at', [$from, $to])
            ->sum('payment_amount');

        return response()->json([
            'success' => true,
            'data'    => [
                'range'   => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'project_id' => $projectId],
                'totals'  => [
                    'total_leads'    => $totalLeads,
                    'eoi_paid'       => $eoiPaid,
                    'reserved'       => $reserved,
                    'contracted'     => $contracted,
                    'total_revenue'  => $totalRevenue,
                ],
                'conversion' => [
                    'eoi_conversion_rate' => $rate($eoiPaid),
                    'reservation_rate'    => $rate($reserved),
                    'sales_rate'          => $rate($contracted),
                ],
                'funnel' => [
                    ['stage' => 'lead',            'count' => $totalLeads],
                    ['stage' => 'eoi_paid',        'count' => $eoiPaid],
                    ['stage' => 'unit_reserved',   'count' => $reserved],
                    ['stage' => 'contract_signed', 'count' => $contracted],
                ],
                'leads_by_source'    => $leadsBySource,
                'leads_by_broker'    => $leadsByBroker,
                'leads_by_campaign'  => $leadsByCampaign,
                'revenue_by_broker'  => $revenueByBroker,
                'revenue_by_campaign'=> $revenueByCampaign,
                'top_brokers'        => $leadsByBroker->take(10),
                'top_campaigns'      => $leadsByCampaign->take(10),
                'daily_leads'        => $this->series($baseLeads(), 'day', 30),
                'monthly_leads'      => $this->series($baseLeads(), 'month', 12),
                'yearly_leads'       => $this->series($baseLeads(), 'year', 5),
            ],
        ]);
    }

    // ───────────────────────── helpers ─────────────────────────

    /** @return array{0: Carbon, 1: Carbon} */
    private function range(Request $request): array
    {
        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : (clone $to)->subDays(30)->startOfDay();

        return [$from, $to];
    }

    /**
     * Time-bucketed lead counts. NOTE: ignores the controller date range
     * to always return the trailing window for charts.
     */
    private function series($leadQuery, string $unit, int $points)
    {
        $format = match ($unit) {
            'day'   => '%Y-%m-%d',
            'month' => '%Y-%m',
            'year'  => '%Y',
        };
        $start = match ($unit) {
            'day'   => now()->subDays($points)->startOfDay(),
            'month' => now()->subMonths($points)->startOfMonth(),
            'year'  => now()->subYears($points)->startOfYear(),
        };

        // Rebuild a clean base (strip the outer date-range constraint).
        $model = get_class($leadQuery->getModel());
        return $model::query()
            ->where('created_at', '>=', $start)
            ->select(DB::raw("DATE_FORMAT(created_at, '{$format}') as bucket"), DB::raw('COUNT(*) as total'))
            ->groupBy('bucket')->orderBy('bucket')
            ->get()->map(fn ($r) => ['bucket' => $r->bucket, 'leads' => (int) $r->total]);
    }
}
