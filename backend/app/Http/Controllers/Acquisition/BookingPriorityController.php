<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\BookingPriority;
use App\Models\EoiReservation;
use App\Services\Acquisition\BookingPriorityService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Booking Priority Board  (role: head_of_sales / admin)
 *
 * The Head of Sales sees everyone who paid the booking/EOI, with full
 * applicant data, a giant filter set, and an AI priority score they can
 * trust or override by manually ranking the queue.
 * ─────────────────────────────────────────────────────────
 */
class BookingPriorityController extends Controller
{
    public function __construct(private BookingPriorityService $service) {}

    /**
     * GET /v1/sales/booking-priorities
     * Giant filterable + sortable list of paid bookings with AI priority.
     */
    public function index(Request $request): JsonResponse
    {
        $q = $this->filtered($request)
            ->with([
                'lead:id,first_name,last_name,phone,email,national_id,is_vip,source,broker_id,lead_score',
                'priority',
            ])
            ->leftJoin('booking_priorities as bp', 'bp.eoi_reservation_id', '=', 'eoi_reservations.id')
            ->select('eoi_reservations.*');

        // ── Sorting ──
        $dir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        switch ($request->input('sort_by', 'priority')) {
            case 'priority': // manual rank first (nulls last), then AI score
                $q->orderByRaw('bp.manual_rank IS NULL asc')
                  ->orderBy('bp.manual_rank', 'asc')
                  ->orderBy('bp.ai_score', 'desc');
                break;
            case 'ai_score':        $q->orderBy('bp.ai_score', $dir); break;
            case 'payment_amount':  $q->orderBy('eoi_reservations.payment_amount', $dir); break;
            case 'monthly_income':  $q->orderBy('eoi_reservations.monthly_income', $dir); break;
            case 'queue_number':    $q->orderBy('eoi_reservations.queue_number', $dir); break;
            default:                $q->orderBy('eoi_reservations.created_at', $dir);
        }

        $page = $q->paginate($request->input('per_page', 25));

        $page->getCollection()->transform(fn (EoiReservation $r) => $this->present($r));

        return response()->json(['success' => true, 'data' => $page]);
    }

    /**
     * POST /v1/sales/booking-priorities/recompute
     * Run AI scoring over the filtered set (or a project).
     */
    public function recompute(Request $request): JsonResponse
    {
        $total = 0;
        $this->filtered($request)->with('lead')->chunkById(200, function ($chunk) use (&$total) {
            $total += $this->service->recompute($chunk);
        }, 'eoi_reservations.id', 'id');

        AuditLogService::log('BOOKING_PRIORITY_RECOMPUTE', $request->user()?->id, [
            'count'      => $total,
            'project_id' => $request->input('project_id'),
        ]);

        return response()->json([
            'success' => true,
            'message' => "AI recomputed priority for {$total} bookings.",
            'data'    => ['count' => $total],
        ]);
    }

    /**
     * PUT /v1/sales/booking-priorities/{eoiId}
     * Head of Sales manual override (rank / decision / note).
     */
    public function setPriority(Request $request, string $eoiId): JsonResponse
    {
        $fields = $request->validate([
            'manual_rank' => 'nullable|integer|min:1',
            'decision'    => 'nullable|string|in:pending,shortlisted,approved,waitlist,rejected',
            'note'        => 'nullable|string|max:2000',
        ]);

        $priority = $this->service->setManual($eoiId, $fields, $request->user()->id);

        AuditLogService::log('BOOKING_PRIORITY_SET', $request->user()?->id, [
            'eoi_reservation_id' => $eoiId,
            'manual_rank'        => $priority->manual_rank,
            'decision'           => $priority->decision,
        ]);

        return response()->json(['success' => true, 'message' => 'Priority updated.', 'data' => $priority]);
    }

    /**
     * POST /v1/sales/booking-priorities/reorder
     * Apply a full manual ordering of the queue.
     */
    public function reorder(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'ordered_ids'   => 'required|array|min:1',
            'ordered_ids.*' => 'uuid',
        ]);

        $count = $this->service->reorder($fields['ordered_ids'], $request->user()->id);

        AuditLogService::log('BOOKING_PRIORITY_REORDER', $request->user()?->id, ['count' => $count]);

        return response()->json(['success' => true, 'message' => "Reordered {$count} bookings.", 'data' => ['count' => $count]]);
    }

    /**
     * GET /v1/sales/booking-priorities/criteria
     * The active AI scoring criteria (weights + custom rules) + the fields
     * that can be used in custom rules.
     */
    public function getCriteria(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'weights'         => $this->service->weights(),
                'defaults'        => BookingPriorityService::DEFAULT_WEIGHTS,
                'available_fields'=> [
                    'payment_amount', 'payment_method', 'client_location',
                    'monthly_income', 'education', 'job_title', 'marital_status',
                    'number_of_children', 'cars_owned', 'residence_type',
                ],
                'operators' => ['>', '<', '>=', '<=', '=', '!='],
            ],
        ]);
    }

    /**
     * PUT /v1/sales/booking-priorities/criteria
     * Head of Sales defines the standard the AI scores/ranks on.
     */
    public function setCriteria(Request $request): JsonResponse
    {
        $weights = $request->validate([
            'cash'         => 'nullable|numeric|min:0|max:100',
            'past_client'  => 'nullable|numeric|min:0|max:100',
            'vip'          => 'nullable|numeric|min:0|max:100',
            'income_high'  => 'nullable|numeric|min:0|max:100',
            'income_mid'   => 'nullable|numeric|min:0|max:100',
            'income_low'   => 'nullable|numeric|min:0|max:100',
            'payment_high' => 'nullable|numeric|min:0|max:100',
            'payment_mid'  => 'nullable|numeric|min:0|max:100',
            'completeness' => 'nullable|numeric|min:0|max:100',
            'lead_score'   => 'nullable|numeric|min:0|max:100',
            'ai_blend'     => 'nullable|numeric|min:0|max:1',
            'rank_by'      => 'nullable|string|in:ai_score,priority,monthly_income,payment_amount,created_at',
            'custom_rules' => 'nullable|array',
            'custom_rules.*.field'    => 'required_with:custom_rules|string',
            'custom_rules.*.operator' => 'required_with:custom_rules|string|in:>,<,>=,<=,=,!=',
            'custom_rules.*.value'    => 'nullable',
            'custom_rules.*.weight'   => 'nullable|numeric',
            'custom_rules.*.label'    => 'nullable|string|max:120',
        ]);

        $saved = $this->service->saveWeights($weights);

        AuditLogService::log('BOOKING_PRIORITY_CRITERIA_SET', $request->user()?->id, ['weights' => $saved]);

        return response()->json([
            'success' => true,
            'message' => 'Scoring criteria saved. Recompute to apply.',
            'data'    => $saved,
        ]);
    }

    /**
     * GET /v1/sales/booking-priorities/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $base = $this->filtered($request);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_paid_bookings' => (clone $base)->count(),
                'total_eoi_value'     => (float) (clone $base)->sum('payment_amount'),
                'cash_buyers'         => (clone $base)->where('payment_method', EoiReservation::PAYMENT_CASH)->count(),
                'by_decision'         => BookingPriority::query()
                    ->select('decision', DB::raw('COUNT(*) as total'))
                    ->groupBy('decision')->pluck('total', 'decision'),
                'avg_ai_score'        => round((float) BookingPriority::avg('ai_score'), 2),
            ],
        ]);
    }

    // ───────────────────────── filtering ─────────────────────────

    /**
     * The "giant filter". Returns an EoiReservation query (paid bookings).
     */
    private function filtered(Request $request)
    {
        $statuses = $request->filled('status')
            ? (array) $request->input('status')
            : [EoiReservation::STATUS_PENDING_REVIEW, EoiReservation::STATUS_APPROVED];

        $q = EoiReservation::query()->whereIn('eoi_reservations.status', $statuses);

        // ── Deal / payment ──
        $q->when($request->filled('project_id'), fn ($x) => $x->where('eoi_reservations.project_id', $request->input('project_id')))
          ->when($request->filled('unit_id'), fn ($x) => $x->where('eoi_reservations.unit_id', $request->input('unit_id')))
          ->when($request->filled('payment_method'), fn ($x) => $x->where('payment_method', $request->input('payment_method')))
          ->when($request->filled('client_location'), fn ($x) => $x->where('client_location', $request->input('client_location')))
          ->when($request->filled('min_payment'), fn ($x) => $x->where('payment_amount', '>=', $request->float('min_payment')))
          ->when($request->filled('max_payment'), fn ($x) => $x->where('payment_amount', '<=', $request->float('max_payment')));

        // ── Standard-of-living ──
        $q->when($request->filled('min_income'), fn ($x) => $x->where('monthly_income', '>=', $request->float('min_income')))
          ->when($request->filled('max_income'), fn ($x) => $x->where('monthly_income', '<=', $request->float('max_income')))
          ->when($request->filled('education'), fn ($x) => $x->where('education', 'like', '%' . $request->input('education') . '%'))
          ->when($request->filled('job_title'), fn ($x) => $x->where('job_title', 'like', '%' . $request->input('job_title') . '%'))
          ->when($request->filled('marital_status'), fn ($x) => $x->where('marital_status', $request->input('marital_status')))
          ->when($request->filled('min_children'), fn ($x) => $x->where('number_of_children', '>=', $request->integer('min_children')))
          ->when($request->filled('max_children'), fn ($x) => $x->where('number_of_children', '<=', $request->integer('max_children')))
          ->when($request->filled('min_cars'), fn ($x) => $x->where('cars_owned', '>=', $request->input('min_cars')))
          ->when($request->filled('residence_type'), fn ($x) => $x->where('residence_type', $request->input('residence_type')));

        // ── Lead attributes ──
        $q->when($request->filled('is_vip'), fn ($x) => $x->whereHas('lead', fn ($l) => $l->where('is_vip', $request->boolean('is_vip'))))
          ->when($request->filled('source'), fn ($x) => $x->whereHas('lead', fn ($l) => $l->where('source', $request->input('source'))))
          ->when($request->filled('broker_id'), fn ($x) => $x->whereHas('lead', fn ($l) => $l->where('broker_id', $request->input('broker_id'))));

        // ── Priority board attributes ──
        $q->when($request->filled('decision'), fn ($x) => $x->whereHas('priority', fn ($p) => $p->where('decision', $request->input('decision'))))
          ->when($request->filled('min_ai_score'), fn ($x) => $x->whereHas('priority', fn ($p) => $p->where('ai_score', '>=', $request->float('min_ai_score'))));

        // ── Dates + free-text search ──
        $q->when($request->filled('date_from'), fn ($x) => $x->whereDate('eoi_reservations.created_at', '>=', $request->input('date_from')))
          ->when($request->filled('date_to'), fn ($x) => $x->whereDate('eoi_reservations.created_at', '<=', $request->input('date_to')))
          ->when($request->filled('search'), function ($x) use ($request) {
              $s = $request->input('search');
              $x->where(function ($w) use ($s) {
                  $w->where('client_name', 'like', "%{$s}%")
                    ->orWhere('client_phone', 'like', "%{$s}%")
                    ->orWhere('client_email', 'like', "%{$s}%")
                    ->orWhere('order_number', 'like', "%{$s}%");
              });
          });

        return $q;
    }

    private function present(EoiReservation $r): array
    {
        return [
            'id'              => $r->id,
            'order_number'    => $r->order_number,
            'queue_number'    => $r->queue_number,
            'status'          => $r->status,
            'project_id'      => $r->project_id,
            'unit_id'         => $r->unit_id,
            // applicant + payment
            'client_name'     => $r->client_name,
            'client_phone'    => $r->client_phone,
            'client_email'    => $r->client_email,
            'client_location' => $r->client_location,
            'payment_method'  => $r->payment_method,
            'payment_amount'  => $r->payment_amount,
            'paid_at'         => $r->reviewed_at,
            // standard-of-living snapshot
            'profile'         => [
                'education'          => $r->education,
                'job_title'          => $r->job_title,
                'monthly_income'     => $r->monthly_income,
                'income_currency'    => $r->income_currency,
                'marital_status'     => $r->marital_status,
                'number_of_children' => $r->number_of_children,
                'cars_owned'         => $r->cars_owned,
                'club_memberships'   => $r->club_memberships,
                'residence_type'     => $r->residence_type,
            ],
            'lead'            => $r->lead,
            // AI + manual priority
            'ai_score'        => $r->priority?->ai_score,
            'ai_reasons'      => $r->priority?->ai_reasons,
            'manual_rank'     => $r->priority?->manual_rank,
            'decision'        => $r->priority?->decision ?? BookingPriority::DECISION_PENDING,
            'note'            => $r->priority?->note,
            'computed_at'     => $r->priority?->computed_at,
        ];
    }
}
