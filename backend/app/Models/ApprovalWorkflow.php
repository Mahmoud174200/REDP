<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalWorkflow extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'entity_type', 'description', 'company_id',
        'is_active', 'auto_approve_conditions', 'timeout_hours', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'auto_approve_conditions' => 'array',
        'timeout_hours' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class, 'workflow_id')->orderBy('step_order', 'asc');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(ApprovalInstance::class, 'workflow_id');
    }
}
