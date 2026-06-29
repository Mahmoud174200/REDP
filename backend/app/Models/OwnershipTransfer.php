<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Lead Attribution System
 * Model: OwnershipTransfer  (append-only admin ownership ledger)
 * ─────────────────────────────────────────────────────────
 */
class OwnershipTransfer extends Model
{
    use HasUuids, HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    /** Append-only: track creation time only. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'lead_id',
        'from_owner_type',
        'from_owner_id',
        'to_owner_type',
        'to_owner_id',
        'reason',
        'transferred_by',
        'tenant_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
