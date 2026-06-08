<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;
use App\Models\EnterpriseRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    /**
     * Cache TTL in seconds (5 minutes).
     */
    private const CACHE_TTL = 300;

    /**
     * Get all effective permissions for a user (roles + direct + inheritance - denies).
     */
    public function getEffectivePermissions(User $user): \Illuminate\Support\Collection
    {
        $cacheKey = "user_perms_{$user->id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            // 1. Get all role permissions (including inherited)
            $rolePerms = collect();
            $userRoles = DB::table('user_roles')
                ->where('user_id', $user->id)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->pluck('role_id');

            foreach ($userRoles as $roleId) {
                $role = EnterpriseRole::find($roleId);
                if ($role) {
                    $rolePerms = $rolePerms->merge($role->getAllPermissions());
                }
            }

            // 2. Get direct user permission grants (not expired)
            $directGrants = DB::table('user_permissions')
                ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
                ->where('user_permissions.user_id', $user->id)
                ->where('user_permissions.type', 'grant')
                ->where(function ($q) {
                    $q->whereNull('user_permissions.expires_at')
                      ->orWhere('user_permissions.expires_at', '>', now());
                })
                ->select('permissions.*')
                ->get()
                ->map(fn ($p) => (object) ['id' => $p->id, 'name' => $p->name]);

            // 3. Get direct user permission denies
            $directDenies = DB::table('user_permissions')
                ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
                ->where('user_permissions.user_id', $user->id)
                ->where('user_permissions.type', 'deny')
                ->where(function ($q) {
                    $q->whereNull('user_permissions.expires_at')
                      ->orWhere('user_permissions.expires_at', '>', now());
                })
                ->pluck('permissions.name')
                ->toArray();

            // 4. Merge role permissions + direct grants, then subtract denies
            $allPerms = $rolePerms->merge($directGrants)->unique('name');
            $allPerms = $allPerms->reject(fn ($p) => in_array($p->name, $directDenies));

            return $allPerms->pluck('name')->values();
        });
    }

    /**
     * Check if a user has a specific permission.
     */
    public function userHasPermission(User $user, string $permissionName): bool
    {
        // Admin bypass — system admins have all permissions
        if ($user->role === 'admin') {
            return true;
        }

        return $this->getEffectivePermissions($user)->contains($permissionName);
    }

    /**
     * Check if a user has ANY of the given permissions.
     */
    public function userHasAnyPermission(User $user, array $permissions): bool
    {
        if ($user->role === 'admin') return true;

        $effective = $this->getEffectivePermissions($user);
        return collect($permissions)->contains(fn ($p) => $effective->contains($p));
    }

    /**
     * Check if a user has ALL of the given permissions.
     */
    public function userHasAllPermissions(User $user, array $permissions): bool
    {
        if ($user->role === 'admin') return true;

        $effective = $this->getEffectivePermissions($user);
        return collect($permissions)->every(fn ($p) => $effective->contains($p));
    }

    /**
     * Assign a role to a user.
     */
    public function assignRole(
        User $user,
        string $roleId,
        ?string $companyId = null,
        ?string $branchId = null,
        ?string $grantedBy = null,
        ?\DateTime $expiresAt = null
    ): void {
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $user->id, 'role_id' => $roleId],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'company_id' => $companyId,
                'branch_id' => $branchId,
                'granted_by' => $grantedBy,
                'expires_at' => $expiresAt,
                'created_at' => now(),
            ]
        );

        $this->clearUserCache($user);
    }

    /**
     * Remove a role from a user.
     */
    public function removeRole(User $user, string $roleId): void
    {
        DB::table('user_roles')
            ->where('user_id', $user->id)
            ->where('role_id', $roleId)
            ->delete();

        $this->clearUserCache($user);
    }

    /**
     * Grant a direct permission to a user.
     */
    public function grantPermission(
        User $user,
        string $permissionId,
        string $type = 'grant',
        ?string $grantedBy = null,
        ?\DateTime $expiresAt = null,
        ?string $reason = null
    ): void {
        DB::table('user_permissions')->updateOrInsert(
            ['user_id' => $user->id, 'permission_id' => $permissionId],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'type' => $type,
                'granted_by' => $grantedBy,
                'expires_at' => $expiresAt,
                'reason' => $reason,
                'created_at' => now(),
            ]
        );

        $this->clearUserCache($user);
    }

    /**
     * Revoke a direct permission from a user.
     */
    public function revokePermission(User $user, string $permissionId): void
    {
        DB::table('user_permissions')
            ->where('user_id', $user->id)
            ->where('permission_id', $permissionId)
            ->delete();

        $this->clearUserCache($user);
    }

    /**
     * Get all roles for a user.
     */
    public function getUserRoles(User $user): \Illuminate\Support\Collection
    {
        return DB::table('user_roles')
            ->join('enterprise_roles', 'enterprise_roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('user_roles.expires_at')
                  ->orWhere('user_roles.expires_at', '>', now());
            })
            ->select('enterprise_roles.*', 'user_roles.expires_at', 'user_roles.granted_by')
            ->get();
    }

    /**
     * Clear cached permissions for a user.
     */
    public function clearUserCache(User $user): void
    {
        Cache::forget("user_perms_{$user->id}");
    }

    /**
     * Clone permissions from one role to another.
     */
    public function cloneRolePermissions(string $sourceRoleId, string $targetRoleId): int
    {
        $permissions = DB::table('role_permissions')
            ->where('role_id', $sourceRoleId)
            ->pluck('permission_id');

        $count = 0;
        foreach ($permissions as $permId) {
            DB::table('role_permissions')->insertOrIgnore([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'role_id' => $targetRoleId,
                'permission_id' => $permId,
                'created_at' => now(),
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Apply a permission template to a role.
     */
    public function applyTemplate(string $roleId, array $permissionNames): int
    {
        $permissions = Permission::whereIn('name', $permissionNames)->pluck('id');
        $count = 0;

        foreach ($permissions as $permId) {
            DB::table('role_permissions')->insertOrIgnore([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'role_id' => $roleId,
                'permission_id' => $permId,
                'created_at' => now(),
            ]);
            $count++;
        }

        return $count;
    }
}
