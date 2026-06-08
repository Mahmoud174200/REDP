<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NcrReport extends Model
{
    use HasUuids;

    protected $table = 'ncr_reports';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'inspection_id',
        'description',
        'severity',
        'status',
        'assigned_engineer_id',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(SiteInspection::class, 'inspection_id');
    }

    public function assignedEngineer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_engineer_id');
    }

    public function capaActions(): HasMany
    {
        return $this->hasMany(CapaAction::class, 'ncr_id');
    }
}
