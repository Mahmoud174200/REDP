<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConstructionMilestone extends Model
{
    use HasUuids;

    protected $table = 'construction_milestones';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'phase_id',
        'title',
        'weight',
        'progress_percentage',
        'status',
        'due_date',
        'completed_at',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'progress_percentage' => 'decimal:2',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class, 'phase_id');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(ResourceAllocation::class, 'milestone_id');
    }
}
