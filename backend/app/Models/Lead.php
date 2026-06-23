<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use App\Traits\Auditable;
use App\Traits\BelongsToTenant;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Model: Lead
 * ─────────────────────────────────────────────────────────
 */
class Lead extends Model
{
    use HasUuids, HasFactory, SoftDeletes, Auditable, BelongsToTenant;

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
        'tenant_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'national_id',
        'passport_no',
        'status',
        'lead_score',
        'assigned_sales_agent_id',
        'tele_sales_agent_id',
        'company_sales_agent_id',
        'current_tier',
        'kyc_status',
        'national_id_front_path',
        'national_id_back_path',
        'passport_path',
        'selfie_path',
        'facial_match_score',
        'source',
        'campaign_id',
        'broker_id',
        'budget',
        'payment_method',
        'interested_project_id',
        'is_vip',
    ];

    protected $casts = [
        'lead_score'         => 'integer',
        'facial_match_score' => 'decimal:2',
        'is_vip'             => 'boolean',
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

    public function teleSalesAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tele_sales_agent_id');
    }

    public function companySalesAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_sales_agent_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function interestedProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'interested_project_id');
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

    public function presentations(): HasMany
    {
        return $this->hasMany(ClientPresentation::class);
    }

    public function journeyLogs(): HasMany
    {
        return $this->hasMany(ClientJourneyLog::class);
    }

    public function eoiReservations(): HasMany
    {
        return $this->hasMany(EoiReservation::class);
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

    /**
     * Scope: Auto-filter leads based on the user's role/tier.
     * - tele_sales: Only leads assigned to this agent
     * - broker: Only leads linked to this broker
     * - company_sales: All leads (no filter)
     * - admin: All leads (no filter)
     */
    public function scopeForTier(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        // Get recursive subordinates user IDs
        $subordinateIds = [];
        if ($user->employeeHierarchy) {
            $subordinateIds = $user->employeeHierarchy->allSubordinates()->pluck('user_id')->toArray();
        }
        $agentIds = array_merge([$user->id], $subordinateIds);

        return match ($user->role) {
            'tele_sales'    => $query->whereIn('tele_sales_agent_id', $agentIds),
            'broker'        => $query->where(function ($q) use ($user, $subordinateIds) {
                // If they are freelance or company broker agents, find their broker profiles
                $userBrokerId = $user->broker?->id;
                $subordinateBrokerIds = \App\Models\Broker::whereIn('user_id', $subordinateIds)->pluck('id')->toArray();
                $allowedBrokerIds = array_filter(array_merge([$userBrokerId], $subordinateBrokerIds));
                
                $q->whereIn('broker_id', $allowedBrokerIds);
            }),
            'company_sales' => $query->where(function ($q) use ($agentIds) {
                // Return leads assigned to this agent/subordinates OR unassigned leads
                $q->whereIn('company_sales_agent_id', $agentIds)
                  ->orWhereNull('company_sales_agent_id');
            }),
            default         => $query->whereRaw('1 = 0'), // Deny by default
        };
    }
}
