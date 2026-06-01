<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Model: LeadLock
 * Broker anti-poaching system: 90-day exclusive lead lock.
 * ─────────────────────────────────────────────────────────
 */
class LeadLock extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const STATUS_ACTIVE   = 'active';
    public const STATUS_EXPIRED  = 'expired';
    public const STATUS_RELEASED = 'released';

    public const LOCK_DURATION_DAYS = 90;

    protected $fillable = [
        'id',
        'broker_id',
        'lead_id',
        'phone',
        'national_id',
        'locked_until',
        'status',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
        'deleted_at'   => 'datetime',
    ];

    // ── Relationships ──

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
                     ->where('locked_until', '>', now());
    }

    // ── Helpers ──

    /**
     * Check if this lock is currently valid.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && $this->locked_until->isFuture();
    }

    /**
     * Remaining days on this lock.
     */
    public function getRemainingDaysAttribute(): int
    {
        if (!$this->isActive()) return 0;
        return (int) now()->diffInDays($this->locked_until);
    }
}
