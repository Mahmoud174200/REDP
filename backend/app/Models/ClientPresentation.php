<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Model: ClientPresentation
 *
 * Tracks broker (Tier 2) presentations to clients.
 * Provides the audit trail showing which clients a broker
 * presented to, which units/projects were discussed, and
 * the outcome of each presentation.
 * ─────────────────────────────────────────────────────────
 */
class ClientPresentation extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    public const OUTCOME_PENDING           = 'pending';
    public const OUTCOME_INTERESTED        = 'interested';
    public const OUTCOME_DECLINED          = 'declined';
    public const OUTCOME_ESCALATED_TO_SALES = 'escalated_to_sales';

    public const OUTCOMES = [
        self::OUTCOME_PENDING,
        self::OUTCOME_INTERESTED,
        self::OUTCOME_DECLINED,
        self::OUTCOME_ESCALATED_TO_SALES,
    ];

    protected $fillable = [
        'id',
        'broker_user_id',
        'lead_id',
        'project_id',
        'unit_ids',
        'presentation_notes',
        'outcome',
        'escalated_to_user_id',
        'presented_at',
    ];

    protected $casts = [
        'unit_ids'     => 'array',
        'presented_at' => 'datetime',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    // ── Relationships ──

    public function broker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'broker_user_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function escalatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_to_user_id');
    }

    // ── Scopes ──

    /**
     * Scope: Only presentations by a specific broker user.
     */
    public function scopeByBroker($query, string $brokerUserId)
    {
        return $query->where('broker_user_id', $brokerUserId);
    }

    /**
     * Scope: Only presentations with a specific outcome.
     */
    public function scopeByOutcome($query, string $outcome)
    {
        return $query->where('outcome', $outcome);
    }

    /**
     * Scope: Presentations pending escalation.
     */
    public function scopePending($query)
    {
        return $query->where('outcome', self::OUTCOME_PENDING);
    }

    /**
     * Scope: Escalated presentations.
     */
    public function scopeEscalated($query)
    {
        return $query->where('outcome', self::OUTCOME_ESCALATED_TO_SALES);
    }

    /**
     * Check if this presentation has been escalated.
     */
    public function isEscalated(): bool
    {
        return $this->outcome === self::OUTCOME_ESCALATED_TO_SALES;
    }
}
