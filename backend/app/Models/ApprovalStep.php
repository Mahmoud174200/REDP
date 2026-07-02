<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalStep extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'workflow_id', 'step_order', 'name', 'type',
        'approver_type', 'approver_id', 'required_approvals',
        'conditions', 'auto_approve', 'timeout_hours', 'escalation_to',
    ];

    protected $casts = [
        'step_order' => 'integer',
        'required_approvals' => 'integer',
        'conditions' => 'array',
        'auto_approve' => 'boolean',
        'timeout_hours' => 'integer',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function escalationTarget(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalation_to');
    }

    public function stepConditions(): HasMany
    {
        return $this->hasMany(ApprovalCondition::class, 'step_id');
    }
}
