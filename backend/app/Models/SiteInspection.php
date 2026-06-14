<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Traits\BelongsToTenant;

class SiteInspection extends Model
{
    use HasUuids, BelongsToTenant;

    protected $table = 'site_inspections';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'tenant_id',
        'milestone_id',
        'inspector_id',
        'inspection_date',
        'comments',
        'status',
    ];

    protected $casts = [
        'inspection_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ConstructionMilestone::class, 'milestone_id');
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function ncrReport(): HasOne
    {
        return $this->hasOne(NcrReport::class, 'inspection_id');
    }
}
