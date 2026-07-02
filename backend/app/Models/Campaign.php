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
 * Model: Campaign
 * Tracks marketing campaigns from Facebook/Google/TikTok ads.
 * ─────────────────────────────────────────────────────────
 */
class Campaign extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const SOURCE_FACEBOOK = 'facebook';
    public const SOURCE_GOOGLE   = 'google';
    public const SOURCE_TIKTOK   = 'tiktok';
    public const SOURCE_DIRECT   = 'direct';
    public const SOURCE_REFERRAL = 'referral';

    protected $fillable = [
        'id',
        'name',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'budget',
        'leads_count',
        'roi_percentage',
    ];

    protected $casts = [
        'budget'         => 'decimal:2',
        'leads_count'    => 'integer',
        'roi_percentage' => 'decimal:2',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    // ── Relationships ──

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    // ── Accessors ──

    /**
     * Calculate Customer Acquisition Cost (CAC).
     */
    public function getCacAttribute(): float
    {
        if ($this->leads_count === 0) return 0;
        return round($this->budget / $this->leads_count, 2);
    }
}
