<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'display_name', 'description', 'module', 'group_name',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(EnterpriseRole::class, 'role_permissions', 'permission_id', 'role_id');
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeByGroup($query, string $group)
    {
        return $query->where('group_name', $group);
    }
}
