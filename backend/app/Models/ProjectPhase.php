<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\BelongsToTenant;

class ProjectPhase extends Model
{
    use HasUuids, BelongsToTenant;

    protected $table = 'project_phases';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'tenant_id',
        'name',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(ConstructionMilestone::class, 'phase_id');
    }

    public function boqItems(): HasMany
    {
        return $this->hasMany(BoqItem::class, 'phase_id');
    }
}
