<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Model: LeadAttribution  (append-only: one row per marketing touch)
 *
 * Touch history is immutable — no SoftDeletes, no Auditable
 * (the rows themselves ARE the audit trail).
 * ─────────────────────────────────────────────────────────
 */
class LeadAttribution extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    public const TOUCH_FIRST        = 'first';
    public const TOUCH_INTERMEDIATE = 'intermediate';
    public const TOUCH_LAST         = 'last';

    protected $fillable = [
        'id',
        'lead_id',
        'session_id',
        'touch_type',
        'source_key',
        'broker_id',
        'campaign_id',
        'promo_code',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'landing_page',
        'referrer',
        'ip_address',
        'country',
        'city',
        'device',
        'os',
        'browser',
        'occurred_at',
        'tenant_id',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'source_key', 'key');
    }

    public function scopeForLead($query, string $leadId)
    {
        return $query->where('lead_id', $leadId)->orderBy('occurred_at');
    }
}
