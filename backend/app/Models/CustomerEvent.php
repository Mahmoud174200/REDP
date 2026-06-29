<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Model: CustomerEvent  (append-only funnel/journey events)
 * ─────────────────────────────────────────────────────────
 */
class CustomerEvent extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    public const PAGE_VIEW       = 'page_view';
    public const VISITOR         = 'visitor';
    public const LEAD            = 'lead';
    public const REGISTERED      = 'registered';
    public const EOI_PAID        = 'eoi_paid';
    public const UNIT_RESERVED   = 'unit_reserved';
    public const CONTRACT_SIGNED = 'contract_signed';
    public const COMPLETED_SALE  = 'completed_sale';
    public const CUSTOM          = 'custom';

    /** Ordered funnel stages → used for conversion-rate math. */
    public const FUNNEL = [
        self::VISITOR,
        self::LEAD,
        self::REGISTERED,
        self::EOI_PAID,
        self::UNIT_RESERVED,
        self::CONTRACT_SIGNED,
        self::COMPLETED_SALE,
    ];

    protected $fillable = [
        'id',
        'lead_id',
        'session_id',
        'anon_id',
        'event_id',
        'event_type',
        'stage',
        'properties',
        'occurred_at',
        'tenant_id',
    ];

    protected $casts = [
        'properties'  => 'array',
        'occurred_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CustomerSession::class, 'session_id');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('event_type', $type);
    }
}
