<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Model: Broker
 * ─────────────────────────────────────────────────────────
 */
class Broker extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const STATUS_PENDING   = 'pending';
    public const STATUS_ACTIVE    = 'active';
    public const STATUS_SUSPENDED = 'suspended';

    protected $fillable = [
        'id',
        'user_id',
        'agency_name',
        'agent_name',
        'email',
        'phone',
        'license_no',
        'status',
        'referral_code',
        'slug',
        'qr_token',
        'promo_code',
        'referral_clicks',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ── Relationships ──

    /**
     * The user account linked to this broker (Tier 2 access).
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function leadLocks(): HasMany
    {
        return $this->hasMany(LeadLock::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Generate unique referral link URL.
     */
    public function getReferralUrlAttribute(): string
    {
        $baseUrl = config('app.frontend_url', 'https://redp.com');
        return "{$baseUrl}/register?ref={$this->referral_code}";
    }

    /**
     * Short branded referral link, e.g. https://api.redp.com/r/elite-realty
     * Resolves via TrackingController and 302-redirects to the frontend.
     */
    public function getShortReferralUrlAttribute(): ?string
    {
        if (!$this->slug) {
            return null;
        }
        return rtrim(config('app.url', 'https://redp.com'), '/') . "/r/{$this->slug}";
    }

    /**
     * Deep link encoded into the broker QR code.
     */
    public function getQrUrlAttribute(): ?string
    {
        if (!$this->qr_token) {
            return null;
        }
        return rtrim(config('app.url', 'https://redp.com'), '/') . "/api/v1/track/qr/{$this->qr_token}";
    }

    public function attributions(): HasMany
    {
        return $this->hasMany(LeadAttribution::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(CustomerSession::class);
    }
}
