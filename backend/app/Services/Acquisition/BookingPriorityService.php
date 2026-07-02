<?php

namespace App\Services\Acquisition;

use App\Models\BookingPriority;
use App\Models\EoiReservation;
use App\Models\SystemConfig;
use App\Services\Ai\AiService;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Booking Priority Board (Head of Sales)
 * Service: BookingPriorityService
 *
 * Produces an explainable, AI-assisted priority score (0..100) for
 * every paid EOI/booking so the Head of Sales can rank who gets to
 * book first. The score blends a transparent weighted model with the
 * AI lead score; the Head of Sales can always override via manual rank.
 * ─────────────────────────────────────────────────────────
 */
class BookingPriorityService
{
    /** SystemConfig key holding the Head-of-Sales-defined criteria. */
    public const CONFIG_KEY = 'booking_priority_weights';

    /** Default, explainable weight model (used until the HoS customizes it). */
    public const DEFAULT_WEIGHTS = [
        'cash'           => 25,   // cash buyer
        'past_client'    => 20,   // returning client
        'vip'            => 20,   // VIP lead
        'income_high'    => 25,   // monthly income > 100k
        'income_mid'     => 15,   // 50k–100k
        'income_low'     => 8,    // 20k–50k
        'payment_high'   => 15,   // EOI amount > 100k
        'payment_mid'    => 8,    // EOI amount > 50k
        'completeness'   => 10,   // full standard-of-living profile
        'lead_score'     => 10,   // scaled from CRM lead score
        'ai_blend'       => 0.30, // share of the AI lead score in the final blend (0 = off)
        'rank_by'        => 'ai_score', // primary ranking factor the board sorts on
        'custom_rules'   => [],   // [{field, operator, value, weight, label}]
    ];

    /** Allowed primary ranking factors. */
    public const RANK_OPTIONS = ['ai_score', 'priority', 'monthly_income', 'payment_amount', 'created_at'];

    public function __construct(private ?AiService $ai = null)
    {
        $this->ai = $ai ?? app(AiService::class);
    }

    /**
     * The active scoring criteria: HoS-defined values merged over defaults.
     */
    public function weights(): array
    {
        $stored = json_decode((string) SystemConfig::where('key', self::CONFIG_KEY)->value('value'), true);
        if (!is_array($stored)) {
            return self::DEFAULT_WEIGHTS;
        }
        $w = array_merge(self::DEFAULT_WEIGHTS, $stored);
        $w['custom_rules'] = is_array($stored['custom_rules'] ?? null) ? $stored['custom_rules'] : [];
        return $w;
    }

    /**
     * Persist a new set of criteria (Head of Sales).
     */
    public function saveWeights(array $weights): array
    {
        $clean = array_merge(self::DEFAULT_WEIGHTS, array_intersect_key($weights, self::DEFAULT_WEIGHTS));
        // numeric coercion for the scalar weights (rank_by/custom_rules are not numbers)
        foreach ($clean as $k => $v) {
            if (!in_array($k, ['custom_rules', 'rank_by'], true)) {
                $clean[$k] = (float) $v;
            }
        }
        $clean['rank_by'] = in_array($weights['rank_by'] ?? null, self::RANK_OPTIONS, true)
            ? $weights['rank_by']
            : 'ai_score';
        $clean['custom_rules'] = array_values(array_filter(
            is_array($weights['custom_rules'] ?? null) ? $weights['custom_rules'] : [],
            fn ($r) => !empty($r['field']) && isset($r['operator'])
        ));

        SystemConfig::updateOrCreate(['key' => self::CONFIG_KEY], ['value' => json_encode($clean)]);
        return $clean;
    }

    /**
     * Score a single reservation. Returns the 0..100 score plus a
     * human-readable breakdown of how it was reached.
     *
     * @return array{score: float, reasons: array<int, array{factor:string, points:float, detail:string}>}
     */
    public function score(EoiReservation $res, ?array $w = null): array
    {
        $w = $w ?? $this->weights();
        $reasons = [];
        $raw = 0.0;

        if ($w['cash'] > 0 && $res->payment_method === EoiReservation::PAYMENT_CASH) {
            $raw += $w['cash'];
            $reasons[] = $this->reason('payment_method', $w['cash'], 'Cash buyer');
        }

        if ($w['past_client'] > 0 && $res->isPastClient()) {
            $raw += $w['past_client'];
            $reasons[] = $this->reason('past_client', $w['past_client'], 'Returning client');
        }

        if ($w['vip'] > 0 && $res->lead && $res->lead->is_vip) {
            $raw += $w['vip'];
            $reasons[] = $this->reason('vip', $w['vip'], 'VIP lead');
        }

        $income = (float) ($res->monthly_income ?? 0);
        if ($income > 100000 && $w['income_high'] > 0) {
            $raw += $w['income_high'];
            $reasons[] = $this->reason('monthly_income', $w['income_high'], 'High monthly income (>100k)');
        } elseif ($income >= 50000 && $w['income_mid'] > 0) {
            $raw += $w['income_mid'];
            $reasons[] = $this->reason('monthly_income', $w['income_mid'], 'Mid monthly income (50k–100k)');
        } elseif ($income >= 20000 && $w['income_low'] > 0) {
            $raw += $w['income_low'];
            $reasons[] = $this->reason('monthly_income', $w['income_low'], 'Moderate monthly income (20k–50k)');
        }

        $amount = (float) ($res->payment_amount ?? 0);
        if ($amount > 100000 && $w['payment_high'] > 0) {
            $raw += $w['payment_high'];
            $reasons[] = $this->reason('payment_amount', $w['payment_high'], 'Large EOI payment (>100k)');
        } elseif ($amount > 50000 && $w['payment_mid'] > 0) {
            $raw += $w['payment_mid'];
            $reasons[] = $this->reason('payment_amount', $w['payment_mid'], 'Sizeable EOI payment (>50k)');
        }

        $completeness = $this->profileCompleteness($res);
        if ($completeness > 0 && $w['completeness'] > 0) {
            $pts = round($w['completeness'] * $completeness, 2);
            $raw += $pts;
            $reasons[] = $this->reason('profile_completeness', $pts, round($completeness * 100) . '% profile completeness');
        }

        if ($w['lead_score'] > 0 && $res->lead && $res->lead->lead_score) {
            $pts = round($w['lead_score'] * min(1, $res->lead->lead_score / 100), 2);
            if ($pts > 0) {
                $raw += $pts;
                $reasons[] = $this->reason('lead_score', $pts, "CRM lead score {$res->lead->lead_score}");
            }
        }

        // Head-of-Sales custom rules (field / operator / value / weight).
        foreach ($w['custom_rules'] ?? [] as $rule) {
            $weight = (float) ($rule['weight'] ?? 0);
            if ($weight != 0 && $res->evaluateCustomRule($rule)) {
                $raw += $weight;
                $reasons[] = $this->reason('custom', $weight, $rule['label'] ?? ("Rule: {$rule['field']} {$rule['operator']} {$rule['value']}"));
            }
        }

        // Deterministic component is already on a 0..100-ish scale; clamp it.
        $deterministic = min(100, $raw);

        // Fold in the AI lead score when available (graceful fallback).
        $blend = (float) ($w['ai_blend'] ?? 0);
        $final = $deterministic;
        if ($blend > 0 && $res->lead) {
            try {
                $aiResult = $this->ai->getLeadScore($res->lead);
                $aiScore = (float) ($aiResult['score'] ?? $aiResult['lead_score'] ?? 0);
                if ($aiScore > 0) {
                    $final = round((1 - $blend) * $deterministic + $blend * min(100, $aiScore), 2);
                    $reasons[] = $this->reason('ai_lead_score', round($blend * min(100, $aiScore), 2), "AI lead score {$aiScore} blended in");
                }
            } catch (\Throwable $e) {
                Log::info('[BookingPriority] AI lead score unavailable, using deterministic only: ' . $e->getMessage());
            }
        }

        return ['score' => min(100, $final), 'reasons' => $reasons];
    }

    /**
     * (Re)compute and persist AI scores for a set of reservations.
     *
     * @param \Illuminate\Support\Collection|array $reservations  EoiReservation models
     * @return int number of priorities computed
     */
    public function recompute($reservations): int
    {
        $w = $this->weights(); // load criteria once for the whole batch
        $count = 0;
        foreach ($reservations as $res) {
            $result = $this->score($res, $w);

            BookingPriority::updateOrCreate(
                ['eoi_reservation_id' => $res->id],
                [
                    'project_id'  => $res->project_id,
                    'ai_score'    => $result['score'],
                    'ai_reasons'  => $result['reasons'],
                    'computed_at' => now(),
                ]
            );
            $count++;
        }
        return $count;
    }

    /**
     * Head of Sales manual override for a single booking.
     */
    public function setManual(string $eoiReservationId, array $data, string $userId): BookingPriority
    {
        $res = EoiReservation::findOrFail($eoiReservationId);

        return BookingPriority::updateOrCreate(
            ['eoi_reservation_id' => $res->id],
            array_filter([
                'project_id'  => $res->project_id,
                'manual_rank' => $data['manual_rank'] ?? null,
                'decision'    => $data['decision'] ?? null,
                'note'        => $data['note'] ?? null,
                'set_by'      => $userId,
            ], fn ($v) => !is_null($v))
        );
    }

    /**
     * Apply a full manual ordering: ids in desired order → ranks 1..n.
     */
    public function reorder(array $orderedEoiIds, string $userId): int
    {
        $rank = 1;
        foreach ($orderedEoiIds as $eoiId) {
            $res = EoiReservation::find($eoiId);
            if (!$res) {
                continue;
            }
            BookingPriority::updateOrCreate(
                ['eoi_reservation_id' => $eoiId],
                ['project_id' => $res->project_id, 'manual_rank' => $rank, 'set_by' => $userId]
            );
            $rank++;
        }
        return $rank - 1;
    }

    // ───────────────────────── helpers ─────────────────────────

    private function profileCompleteness(EoiReservation $res): float
    {
        $fields = ['education', 'job_title', 'monthly_income', 'marital_status',
            'current_residence', 'residence_type', 'cars_owned', 'club_memberships'];
        $filled = 0;
        foreach ($fields as $f) {
            if (!is_null($res->{$f}) && $res->{$f} !== '') {
                $filled++;
            }
        }
        return count($fields) ? $filled / count($fields) : 0;
    }

    private function reason(string $factor, float $points, string $detail): array
    {
        return ['factor' => $factor, 'points' => $points, 'detail' => $detail];
    }
}
