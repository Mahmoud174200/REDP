<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Model: Interaction
 * Tracks all communications between sales agents and leads.
 * ─────────────────────────────────────────────────────────
 */
class Interaction extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const TYPE_CALL     = 'call';
    public const TYPE_WHATSAPP = 'whatsapp';
    public const TYPE_MEETING  = 'meeting';
    public const TYPE_EMAIL    = 'email';

    protected $fillable = [
        'id',
        'lead_id',
        'type',
        'notes',
        'follow_up_date',
        'logged_by',
    ];

    protected $casts = [
        'follow_up_date' => 'datetime',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    // ── Scopes ──

    public function scopePendingFollowUp($query)
    {
        return $query->whereNotNull('follow_up_date')
                     ->where('follow_up_date', '>=', now());
    }

    public function scopeOverdueFollowUp($query)
    {
        return $query->whereNotNull('follow_up_date')
                     ->where('follow_up_date', '<', now());
    }
}
