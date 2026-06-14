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
}
