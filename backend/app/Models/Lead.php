<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Model: Lead
 * ─────────────────────────────────────────────────────────
 */
class Lead extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Sales pipeline status constants.
     */
    public const STATUS_NEW            = 'new';
    public const STATUS_CONTACTED      = 'contacted';
    public const STATUS_INTERESTED     = 'interested';
    public const STATUS_VISIT_SCHEDULED = 'visit_scheduled';
    public const STATUS_NEGOTIATION    = 'negotiation';
    public const STATUS_RESERVED       = 'reserved';
    public const STATUS_CONTRACTED     = 'contracted';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_CONTACTED,
        self::STATUS_INTERESTED,
        self::STATUS_VISIT_SCHEDULED,
        self::STATUS_NEGOTIATION,
        self::STATUS_RESERVED,
        self::STATUS_CONTRACTED,
    ];

    protected $fillable = [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'national_id',
        'passport_no',
        'status',
        'lead_score',
        'assigned_sales_agent_id',
        'kyc_status',
        'national_id_front_path',
        'national_id_back_path',
        'passport_path',
        'selfie_path',
        'facial_match_score',
        'source',
        'campaign_id',
        'broker_id',
    ];

    protected $casts = [
        'lead_score'         => 'integer',
        'facial_match_score' => 'decimal:2',
        'created_at'         => 'datetime',
        'updated_at'         => 'datetime',
        'deleted_at'         => 'datetime',
    ];

    // ── Computed Attributes ──

    /**
     * Full name accessor.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    // ── Relationships ──

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_sales_agent_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(Interaction::class);
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function eoiEntries(): HasMany
    {
        return $this->hasMany(EoiQueue::class);
    }

    public function leadLocks(): HasMany
    {
        return $this->hasMany(LeadLock::class);
    }

    // ── Scopes ──

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeAssignedTo($query, string $agentId)
    {
        return $query->where('assigned_sales_agent_id', $agentId);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_sales_agent_id');
    }

    public function scopeKycVerified($query)
    {
        return $query->where('kyc_status', 'verified');
    }
}
