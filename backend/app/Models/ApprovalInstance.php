<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalInstance extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'workflow_id', 'entity_type', 'entity_id', 'current_step_id',
        'status', 'requested_by', 'metadata', 'completed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'current_step_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class, 'instance_id')->orderBy('created_at', 'desc');
    }
}
