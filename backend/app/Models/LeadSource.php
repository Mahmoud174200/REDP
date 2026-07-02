<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Model: LeadSource  (normalized channel catalog)
 * ─────────────────────────────────────────────────────────
 */
class LeadSource extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    // ── Canonical source keys ──
    public const BROKER_REFERRAL  = 'broker_referral';
    public const BROKER_QR        = 'broker_qr';
    public const BROKER_INVITE    = 'broker_invite';
    public const PROMO_CODE       = 'promo_code';
    public const FACEBOOK_ADS     = 'facebook_ads';
    public const GOOGLE_ADS       = 'google_ads';
    public const INSTAGRAM_ADS    = 'instagram_ads';
    public const TIKTOK_ADS       = 'tiktok_ads';
    public const WHATSAPP         = 'whatsapp_campaign';
    public const ORGANIC_SEARCH   = 'organic_search';
    public const DIRECT           = 'direct';
    public const MANUAL_ENTRY     = 'manual_entry';
    public const API_INTEGRATION  = 'api_integration';

    protected $fillable = [
        'id',
        'key',
        'label',
        'category',
        'is_broker_source',
        'is_active',
    ];

    protected $casts = [
        'is_broker_source' => 'boolean',
        'is_active'        => 'boolean',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    public function attributions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LeadAttribution::class, 'source_key', 'key');
    }

    public function scopeBrokerSources($query)
    {
        return $query->where('is_broker_source', true);
    }
}
