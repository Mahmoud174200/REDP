<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Model: CustomerSession  (anonymous visitor session, pre-lead)
 *
 * Not tenant-scoped: created in public (unauthenticated) context.
 * ─────────────────────────────────────────────────────────
 */
class CustomerSession extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'anon_id',
        'lead_id',
        'session_token',
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
        'user_agent',
        'started_at',
        'last_seen_at',
        'tenant_id',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'last_seen_at' => 'datetime',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(CustomerEvent::class, 'session_id');
    }

    public function attributions(): HasMany
    {
        return $this->hasMany(LeadAttribution::class, 'session_id');
    }
}
