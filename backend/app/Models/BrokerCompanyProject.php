<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Model: BrokerCompanyProject
 * Links a broker agency (Company) to a project it can work on.
 * ─────────────────────────────────────────────────────────
 */
class BrokerCompanyProject extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    public const STATUS_REQUESTED = 'requested';
    public const STATUS_APPROVED  = 'approved';
    public const STATUS_REJECTED  = 'rejected';

    protected $fillable = [
        'id', 'company_id', 'project_id', 'status',
        'requested_by', 'approved_by', 'notes', 'responded_at',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRequested($query)
    {
        return $query->where('status', self::STATUS_REQUESTED);
    }
}
