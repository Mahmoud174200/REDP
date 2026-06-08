<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceAllocation extends Model
{
    use HasUuids;

    protected $table = 'resource_allocations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'milestone_id',
        'resource_type',
        'name',
        'quantity',
        'cost',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'cost' => 'decimal:2',
    ];

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ConstructionMilestone::class, 'milestone_id');
    }
}
