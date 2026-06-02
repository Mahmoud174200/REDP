<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Model: ClientJourneyLog
 *
 * Immutable audit log tracking every stage of a client's
 * journey from initial lead capture through final transaction.
 * Each entry records who performed the action (actor), their
 * role, and any contextual metadata.
 * ─────────────────────────────────────────────────────────
 */
class ClientJourneyLog extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Disable updated_at — journey logs are immutable.
     */
    const UPDATED_AT = null;

    // ── Stage Constants ──
    public const STAGE_LEAD_CREATED          = 'lead_created';
    public const STAGE_TELE_SALES_CONTACT    = 'tele_sales_contact';
    public const STAGE_MEETING_SCHEDULED     = 'meeting_scheduled';
    public const STAGE_TRANSFERRED_TO_BROKER = 'transferred_to_broker';
    public const STAGE_BROKER_PRESENTATION   = 'broker_presentation';
    public const STAGE_ESCALATED_TO_SALES    = 'escalated_to_sales';
    public const STAGE_BOOKING_INITIATED     = 'booking_initiated';
    public const STAGE_TRANSACTION_COMPLETE  = 'transaction_complete';

    public const STAGES = [
        self::STAGE_LEAD_CREATED,
        self::STAGE_TELE_SALES_CONTACT,
        self::STAGE_MEETING_SCHEDULED,
        self::STAGE_TRANSFERRED_TO_BROKER,
        self::STAGE_BROKER_PRESENTATION,
        self::STAGE_ESCALATED_TO_SALES,
        self::STAGE_BOOKING_INITIATED,
        self::STAGE_TRANSACTION_COMPLETE,
    ];

    protected $fillable = [
        'id',
        'lead_id',
        'stage',
        'actor_user_id',
        'actor_role',
        'metadata',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    // ── Factory Method ──

    /**
     * Record a new journey log entry.
     *
     * @param string      $leadId     The lead being tracked
     * @param string      $stage      One of the STAGE_* constants
     * @param User        $actor      The user performing the action
     * @param array       $metadata   Optional contextual data
     * @return static
     */
    public static function record(string $leadId, string $stage, User $actor, array $metadata = []): static
    {
        return static::create([
            'id'            => (string) Str::uuid(),
            'lead_id'       => $leadId,
            'stage'         => $stage,
            'actor_user_id' => $actor->id,
            'actor_role'    => $actor->role,
            'metadata'      => $metadata,
        ]);
    }

    // ── Scopes ──

    public function scopeForLead($query, string $leadId)
    {
        return $query->where('lead_id', $leadId)->orderBy('created_at', 'asc');
    }

    public function scopeByActor($query, string $userId)
    {
        return $query->where('actor_user_id', $userId);
    }

    public function scopeAtStage($query, string $stage)
    {
        return $query->where('stage', $stage);
    }
}
