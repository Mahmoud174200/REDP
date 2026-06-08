<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalAction extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    // This table only logs insert history, it has created_at and acted_at but no updated_at
    public $timestamps = false;

    protected $fillable = [
        'id', 'instance_id', 'step_id', 'actor_id', 'action',
        'comment', 'metadata', 'acted_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'acted_at' => 'datetime',
    ];

    public function instance(): BelongsTo
    {
        return $this->belongsTo(ApprovalInstance::class, 'instance_id');
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'step_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
