<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProfitCenter extends Model
{
    use HasUuids;

    protected $table = 'profit_centers';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'code',
        'name',
        'parent_id',
        'status',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProfitCenter::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ProfitCenter::class, 'parent_id')->orderBy('code');
    }
}
