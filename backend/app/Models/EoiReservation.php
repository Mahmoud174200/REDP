<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine
 * Model: EoiReservation (EOI Reservation with Payment Workflow)
 * Manages EOI submissions with receipt upload, accountant review,
 * sequential order/queue number generation, and email notifications.
 * ─────────────────────────────────────────────────────────
 */
class EoiReservation extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $table = 'eoi_reservations';
    protected $keyType = 'string';
    public $incrementing = false;

    // ── Status Constants ──
    public const STATUS_PENDING_REVIEW = 'pending_review';
    public const STATUS_APPROVED       = 'approved';
    public const STATUS_REJECTED       = 'rejected';

    // ── Location Constants ──
    public const LOCATION_INSIDE_EGYPT  = 'inside_egypt';
    public const LOCATION_OUTSIDE_EGYPT = 'outside_egypt';

    // ── Payment Method Constants ──
    public const PAYMENT_CASH                       = 'cash';
    public const PAYMENT_BANK_TRANSFER              = 'bank_transfer';
    public const PAYMENT_CHEQUE                      = 'cheque';
    public const PAYMENT_INTERNATIONAL_BANK_TRANSFER = 'international_bank_transfer';

    /**
     * Payment methods available per location.
     */
    public const PAYMENT_METHODS = [
        self::LOCATION_INSIDE_EGYPT  => [
            self::PAYMENT_CASH,
            self::PAYMENT_BANK_TRANSFER,
            self::PAYMENT_CHEQUE,
        ],
        self::LOCATION_OUTSIDE_EGYPT => [
            self::PAYMENT_INTERNATIONAL_BANK_TRANSFER,
        ],
    ];

    protected $fillable = [
        'id',
        'lead_id',
        'project_id',
        'unit_id',
        'client_name',
        'client_email',
        'client_phone',
        'client_location',
        'payment_method',
        'payment_amount',
        'receipt_path',
        'status',
        'order_number',
        'queue_number',
        'reviewer_id',
        'review_notes',
        'reviewed_at',
        'email_sent_at',
    ];

    protected $casts = [
        'payment_amount' => 'decimal:2',
        'queue_number'   => 'integer',
        'reviewed_at'    => 'datetime',
        'email_sent_at'  => 'datetime',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    // ── Scopes ──

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING_REVIEW);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeForProject(Builder $query, string $projectId): Builder
    {
        return $query->where('project_id', $projectId);
    }

    // ── Business Logic ──

    /**
     * Generate a unique sequential order number.
     * Format: EOI-YYYY-NNNNNN (e.g., EOI-2026-000001)
     */
    public static function generateOrderNumber(): string
    {
        $year = now()->year;
        $prefix = "EOI-{$year}-";

        // Get the highest existing sequence number for this year
        $lastOrder = self::where('order_number', 'like', "{$prefix}%")
            ->orderByRaw("CAST(SUBSTRING(order_number, " . (strlen($prefix) + 1) . ") AS UNSIGNED) DESC")
            ->value('order_number');

        if ($lastOrder) {
            $lastSequence = (int) substr($lastOrder, strlen($prefix));
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix . str_pad($nextSequence, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Generate the next queue number for a given project.
     */
    public static function getNextQueueNumber(string $projectId): int
    {
        $maxQueue = self::where('project_id', $projectId)
            ->whereNotNull('queue_number')
            ->max('queue_number');

        return ($maxQueue ?? 0) + 1;
    }

    /**
     * Validate that a payment method is valid for the given location.
     */
    public static function isValidPaymentMethod(string $location, string $method): bool
    {
        return in_array($method, self::PAYMENT_METHODS[$location] ?? []);
    }

    /**
     * Check if the client is a past client.
     */
    public function isPastClient(): bool
    {
        $lead = $this->lead;
        if (!$lead) {
            return false;
        }

        if ($lead->status === Lead::STATUS_CONTRACTED) {
            return true;
        }

        // Match by email or phone to users, then check contracts or reservations
        $user = User::where(function($q) use ($lead) {
            if ($lead->email) {
                $q->where('email', $lead->email);
            }
            if ($lead->phone) {
                $q->orWhere('phone', $lead->phone);
            }
        })->first();

        if ($user) {
            $hasContract = DB::table('contracts')->where('client_id', $user->id)->exists();
            $hasReservation = DB::table('reservations')->where('client_id', $user->id)->exists();
            if ($hasContract || $hasReservation) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if client is Egyptian.
     */
    public function isEgyptian(): bool
    {
        if ($this->client_location === self::LOCATION_INSIDE_EGYPT) {
            return true;
        }
        $lead = $this->lead;
        if ($lead && $lead->national_id) {
            return true;
        }
        return false;
    }

    /**
     * Check if client is Foreigner.
     */
    public function isForeigner(): bool
    {
        if ($this->client_location === self::LOCATION_OUTSIDE_EGYPT) {
            return true;
        }
        $lead = $this->lead;
        if ($lead && $lead->passport_no && !$lead->national_id) {
            return true;
        }
        return false;
    }

    /**
     * Evaluate custom admin rule on this reservation.
     */
    public function evaluateCustomRule(array $rule): bool
    {
        $field = $rule['field'] ?? '';
        $operator = $rule['operator'] ?? '';
        $value = $rule['value'] ?? '';

        $fieldValue = null;
        if (in_array($field, ['payment_amount', 'payment_method', 'client_location', 'status'])) {
            $fieldValue = $this->{$field};
        } else {
            $lead = $this->lead;
            if ($lead && in_array($field, ['lead_score', 'source', 'status'])) {
                $fieldValue = $lead->{$field};
            }
        }

        if (is_null($fieldValue)) {
            return false;
        }

        switch ($operator) {
            case '>':  return floatval($fieldValue) > floatval($value);
            case '<':  return floatval($fieldValue) < floatval($value);
            case '>=': return floatval($fieldValue) >= floatval($value);
            case '<=': return floatval($fieldValue) <= floatval($value);
            case '=':  return strtolower((string)$fieldValue) == strtolower((string)$value);
            case '!=': return strtolower((string)$fieldValue) != strtolower((string)$value);
            default:   return false;
        }
    }

    /**
     * Recalculate queue numbers for all approved reservations of a project.
     */
    public static function recalculateQueueNumbers(string $projectId): void
    {
        $reservations = self::where('project_id', $projectId)
            ->where('status', self::STATUS_APPROVED)
            ->with('lead')
            ->get();

        $queueMode = DB::table('system_configs')->where('key', 'eoi_queue_mode')->value('value') ?: 'normal';

        if ($queueMode === 'smart') {
            $weightPastClient = (int) (DB::table('system_configs')->where('key', 'eoi_queue_weight_past_client')->value('value') ?: 100);
            $weightCash = (int) (DB::table('system_configs')->where('key', 'eoi_queue_weight_cash')->value('value') ?: 50);
            $weightVip = (int) (DB::table('system_configs')->where('key', 'eoi_queue_weight_vip')->value('value') ?: 150);
            $nationalityPriority = DB::table('system_configs')->where('key', 'eoi_queue_nationality_priority')->value('value') ?: 'none';
            $weightNationality = (int) (DB::table('system_configs')->where('key', 'eoi_queue_weight_nationality')->value('value') ?: 40);
            $customRulesJson = DB::table('system_configs')->where('key', 'eoi_queue_custom_rules')->value('value') ?: '[]';
            $customRules = json_decode($customRulesJson, true) ?: [];

            foreach ($reservations as $res) {
                $score = 0;

                if ($res->isPastClient()) {
                    $score += $weightPastClient;
                }

                if ($res->payment_method === self::PAYMENT_CASH) {
                    $score += $weightCash;
                }

                if ($res->lead && $res->lead->is_vip) {
                    $score += $weightVip;
                }

                if ($nationalityPriority !== 'none') {
                    $isEgyptian = $res->isEgyptian();
                    $isForeigner = $res->isForeigner();
                    if (($nationalityPriority === 'egyptian' && $isEgyptian) ||
                        ($nationalityPriority === 'foreigner' && $isForeigner)) {
                        $score += $weightNationality;
                    }
                }

                foreach ($customRules as $rule) {
                    if ($res->evaluateCustomRule($rule)) {
                        $score += (int) ($rule['weight'] ?? 0);
                    }
                }

                $res->calculated_score = $score;
            }

            // Sort: highest score first, then FIFO by reviewed_at (or created_at)
            $sorted = $reservations->sort(function ($a, $b) {
                if ($a->calculated_score != $b->calculated_score) {
                    return $b->calculated_score <=> $a->calculated_score;
                }
                $timeA = $a->reviewed_at ? $a->reviewed_at->timestamp : $a->created_at->timestamp;
                $timeB = $b->reviewed_at ? $b->reviewed_at->timestamp : $b->created_at->timestamp;
                return $timeA <=> $timeB;
            });
        } else {
            // Normal Queue: strictly FIFO by approval time
            $sorted = $reservations->sort(function ($a, $b) {
                $timeA = $a->reviewed_at ? $a->reviewed_at->timestamp : $a->created_at->timestamp;
                $timeB = $b->reviewed_at ? $b->reviewed_at->timestamp : $b->created_at->timestamp;
                return $timeA <=> $timeB;
            });
        }

        // Update queue numbers in database
        $queueIndex = 1;
        foreach ($sorted as $res) {
            DB::table('eoi_reservations')
                ->where('id', $res->id)
                ->update(['queue_number' => $queueIndex]);
            $queueIndex++;
        }
    }
}
