<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionRule extends Model
{
    use HasUuids;

    protected $table = 'commission_rules';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'title',
        'project_id',
        'unit_type',
        'tier_type',
        'min_deal_size',
        'max_deal_size',
        'commission_percentage',
        'status',
    ];

    protected $casts = [
        'min_deal_size' => 'decimal:2',
        'max_deal_size' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function calculations(): HasMany
    {
        return $this->hasMany(CommissionCalculation::class, 'rule_id');
    }
}
