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
 * Model: EoiQueue (Expression of Interest Priority Queue)
 * Manages project launch express booking with microtime ordering.
 * ─────────────────────────────────────────────────────────
 */
class EoiQueue extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $table = 'eoi_queue';
    protected $keyType = 'string';
    public $incrementing = false;

    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_EXPIRED   = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'id',
        'lead_id',
        'project_id',
        'queue_number',
        'priority_score',
        'status',
        'eoi_amount',
        'notes',
    ];

    protected $casts = [
        'queue_number'   => 'integer',
        'priority_score' => 'decimal:6',
        'eoi_amount'     => 'decimal:2',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ── Scopes ──

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority_score', 'asc');
    }
}
