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
        'agency_name',
        'agent_name',
        'email',
        'phone',
        'license_no',
        'status',
        'referral_code',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ── Relationships ──

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
}
