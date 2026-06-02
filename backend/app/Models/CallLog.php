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
 * Model: CallLog
 * Stores VoIP softphone call metrics from Twilio webhook.
 * ─────────────────────────────────────────────────────────
 */
class CallLog extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'lead_id',
        'call_sid',
        'direction',
        'duration_seconds',
        'recording_url',
        'status',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
        'deleted_at'       => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ── Accessors ──

    /**
     * Human-readable duration (e.g., "3m 42s").
     */
    public function getFormattedDurationAttribute(): string
    {
        $minutes = intdiv($this->duration_seconds, 60);
        $seconds = $this->duration_seconds % 60;
        return $minutes > 0 ? "{$minutes}m {$seconds}s" : "{$seconds}s";
    }
}
