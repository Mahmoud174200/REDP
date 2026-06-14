<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiMetric extends Model
{
    use HasUuids;

    protected $table = 'kpi_metrics';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'name',
        'display_name',
        'category',
        'value',
        'target_value',
        'period',
        'calculated_at',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'target_value' => 'decimal:2',
        'calculated_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
