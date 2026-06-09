<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CompanyGroup extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'description', 'parent_group_id', 'status',
    ];

    public function parentGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'parent_group_id');
    }

    public function childGroups(): HasMany
    {
        return $this->hasMany(CompanyGroup::class, 'parent_group_id');
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_group_members', 'company_group_id', 'company_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
