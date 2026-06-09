<?php

namespace App\Traits;

use App\Models\EnterpriseRole;
use App\Models\Permission;
use App\Services\PermissionService;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasPermissions
{
    /**
     * Many-to-Many relationship with roles.
     */
    public function enterpriseRoles(): BelongsToMany
    {
        return $this->belongsToMany(EnterpriseRole::class, 'user_roles', 'user_id', 'role_id')
            ->withPivot(['company_id', 'branch_id', 'granted_by', 'expires_at'])
            ->withTimestamps();
    }

    /**
     * Many-to-Many relationship with permissions (direct overrides).
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions', 'user_id', 'permission_id')
            ->withPivot(['type', 'granted_by', 'expires_at', 'reason'])
            ->withTimestamps();
    }

    /**
     * Check if user has a permission.
     */
    public function hasPermission(string $permission): bool
    {
        return app(PermissionService::class)->userHasPermission($this, $permission);
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return app(PermissionService::class)->userHasAnyPermission($this, $permissions);
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        return app(PermissionService::class)->userHasAllPermissions($this, $permissions);
    }

    /**
     * Assign an enterprise role.
     */
    public function assignEnterpriseRole(
        string $roleId,
        ?string $companyId = null,
        ?string $branchId = null,
        ?string $grantedBy = null,
        ?\DateTime $expiresAt = null
    ): void {
        app(PermissionService::class)->assignRole($this, $roleId, $companyId, $branchId, $grantedBy, $expiresAt);
    }

    /**
     * Remove an enterprise role.
     */
    public function removeEnterpriseRole(string $roleId): void
    {
        app(PermissionService::class)->removeRole($this, $roleId);
    }

    /**
     * Grant a direct permission.
     */
    public function grantDirectPermission(
        string $permissionId,
        ?string $grantedBy = null,
        ?\DateTime $expiresAt = null,
        ?string $reason = null
    ): void {
        app(PermissionService::class)->grantPermission($this, $permissionId, 'grant', $grantedBy, $expiresAt, $reason);
    }

    /**
     * Deny a direct permission (explicit override).
     */
    public function denyDirectPermission(
        string $permissionId,
        ?string $grantedBy = null,
        ?\DateTime $expiresAt = null,
        ?string $reason = null
    ): void {
        app(PermissionService::class)->grantPermission($this, $permissionId, 'deny', $grantedBy, $expiresAt, $reason);
    }

    /**
     * Revoke a direct permission override.
     */
    public function revokeDirectPermission(string $permissionId): void
    {
        app(PermissionService::class)->revokePermission($this, $permissionId);
    }
}
