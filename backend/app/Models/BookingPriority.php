<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Booking Priority Board (Head of Sales)
 * Model: BookingPriority
 * ─────────────────────────────────────────────────────────
 */
class BookingPriority extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    public const DECISION_PENDING     = 'pending';
    public const DECISION_SHORTLISTED = 'shortlisted';
    public const DECISION_APPROVED    = 'approved';
    public const DECISION_WAITLIST    = 'waitlist';
    public const DECISION_REJECTED    = 'rejected';

    protected $fillable = [
        'id',
        'eoi_reservation_id',
        'project_id',
        'ai_score',
        'ai_reasons',
        'computed_at',
        'manual_rank',
        'decision',
        'note',
        'set_by',
    ];

    protected $casts = [
        'ai_score'    => 'decimal:2',
        'ai_reasons'  => 'array',
        'manual_rank' => 'integer',
        'computed_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function eoiReservation(): BelongsTo
    {
        return $this->belongsTo(EoiReservation::class, 'eoi_reservation_id');
    }

    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }
}
