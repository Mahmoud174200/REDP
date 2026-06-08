<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnterpriseRole extends Model
{
    use HasUuids;

    protected $table = 'enterprise_roles';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'display_name', 'description',
        'parent_role_id', 'company_id', 'is_system', 'level', 'status',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'level' => 'integer',
    ];

    public function parentRole(): BelongsTo
    {
        return $this->belongsTo(EnterpriseRole::class, 'parent_role_id');
    }

    public function childRoles(): HasMany
    {
        return $this->hasMany(EnterpriseRole::class, 'parent_role_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id')
            ->withPivot(['company_id', 'branch_id', 'granted_by', 'expires_at']);
    }

    /**
     * Get all permissions including inherited from parent roles.
     */
    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        $perms = $this->permissions;

        // Walk up the inheritance chain
        $parent = $this->parentRole;
        while ($parent) {
            $perms = $perms->merge($parent->permissions);
            $parent = $parent->parentRole;
        }

        return $perms->unique('id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeGlobal($query)
    {
        return $query->whereNull('company_id');
    }
}
