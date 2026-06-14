<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\EnterpriseRole;
use App\Models\Permission;
use App\Models\PermissionTemplate;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RbacController extends Controller
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    // ── Roles CRUD ──

    public function getRoles(Request $request)
    {
        $query = EnterpriseRole::with(['parentRole', 'company']);

        if ($request->has('company_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('company_id', $request->company_id)
                  ->orWhereNull('company_id'); // Global roles are visible to all
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('level', 'asc')->get()
        ]);
    }

    public function createRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:enterprise_roles,name',
            'display_name' => 'required|string',
            'description' => 'nullable|string',
            'parent_role_id' => 'nullable|uuid|exists:enterprise_roles,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'level' => 'nullable|integer|min:0',
            'status' => 'nullable|in:active,inactive',
        ]);

        $role = EnterpriseRole::create(array_merge([
            'id' => (string) Str::uuid(),
            'level' => 0,
            'status' => 'active',
        ], $validated));

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => $role
        ], 211);
    }

    public function updateRole(Request $request, string $id)
    {
        $role = EnterpriseRole::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify system protected roles'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|unique:enterprise_roles,name,' . $id,
            'display_name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'parent_role_id' => 'nullable|uuid|exists:enterprise_roles,id|different:id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'level' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $role->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $role
        ]);
    }

    public function deleteRole(string $id)
    {
        $role = EnterpriseRole::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete system protected roles'
            ], 403);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully'
        ]);
    }

    // ── Permissions Catalog ──

    public function getPermissions()
    {
        $permissions = Permission::all()->groupBy('module');

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    // ── Role Permissions Assignment ──

    public function getRolePermissions(string $roleId)
    {
        $role = EnterpriseRole::findOrFail($roleId);
        
        return response()->json([
            'success' => true,
            'role' => $role,
            'permissions' => $role->permissions()->pluck('permissions.id'),
            'effective_permissions' => $role->getAllPermissions()->pluck('name')
        ]);
    }

    public function assignRolePermissions(Request $request, string $roleId)
    {
        $role = EnterpriseRole::findOrFail($roleId);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify permissions of system protected roles'
            ], 403);
        }

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'uuid|exists:permissions,id',
        ]);

        DB::transaction(function () use ($role, $validated) {
            DB::table('role_permissions')->where('role_id', $role->id)->delete();

            $insertData = [];
            foreach ($validated['permission_ids'] as $permId) {
                $insertData[] = [
                    'id' => (string) Str::uuid(),
                    'role_id' => $role->id,
                    'permission_id' => $permId,
                    'created_at' => now(),
                ];
            }

            if (!empty($insertData)) {
                DB::table('role_permissions')->insert($insertData);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated successfully'
        ]);
    }

    // ── User Roles & Direct Permissions ──

    public function getUserPermissions(string $userId)
    {
        $user = User::findOrFail($userId);

        $roles = $this->permissionService->getUserRoles($user);
        $effective = $this->permissionService->getEffectivePermissions($user);
        
        $directOverrides = DB::table('user_permissions')
            ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
            ->where('user_permissions.user_id', $user->id)
            ->select('user_permissions.id', 'user_permissions.type', 'user_permissions.expires_at', 'user_permissions.reason', 'permissions.name', 'permissions.display_name')
            ->get();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ],
            'roles' => $roles,
            'effective_permissions' => $effective,
            'direct_overrides' => $directOverrides
        ]);
    }

    public function assignUserRole(Request $request, string $userId)
    {
        $user = User::findOrFail($userId);

        $validated = $request->validate([
            'role_id' => 'required|uuid|exists:enterprise_roles,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $expiresAt = $validated['expires_at'] ? new \DateTime($validated['expires_at']) : null;

        $this->permissionService->assignRole(
            $user,
            $validated['role_id'],
            $validated['company_id'],
            $validated['branch_id'],
            $request->user()->id,
            $expiresAt
        );

        return response()->json([
            'success' => true,
            'message' => 'Role assigned successfully'
        ]);
    }

    public function removeUserRole(Request $request, string $userId)
    {
        $user = User::findOrFail($userId);

        $validated = $request->validate([
            'role_id' => 'required|uuid|exists:enterprise_roles,id',
        ]);

        $this->permissionService->removeRole($user, $validated['role_id']);

        return response()->json([
            'success' => true,
            'message' => 'Role removed successfully'
        ]);
    }

    public function overrideUserPermission(Request $request, string $userId)
    {
        $user = User::findOrFail($userId);

        $validated = $request->validate([
            'permission_id' => 'required|uuid|exists:permissions,id',
            'type' => 'required|in:grant,deny',
            'expires_at' => 'nullable|date|after:now',
            'reason' => 'nullable|string',
        ]);

        $expiresAt = $validated['expires_at'] ? new \DateTime($validated['expires_at']) : null;

        $this->permissionService->grantPermission(
            $user,
            $validated['permission_id'],
            $validated['type'],
            $request->user()->id,
            $expiresAt,
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Permission override applied successfully'
        ]);
    }

    public function revokeUserPermissionOverride(string $userId, string $permissionId)
    {
        $user = User::findOrFail($userId);

        $this->permissionService->revokePermission($user, $permissionId);

        return response()->json([
            'success' => true,
            'message' => 'Permission override revoked successfully'
        ]);
    }

    // ── Permission Templates ──

    public function getTemplates()
    {
        $templates = PermissionTemplate::all();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    public function createTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $template = PermissionTemplate::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permission template created successfully',
            'data' => $template
        ], 211);
    }

    public function applyTemplateToRole(Request $request, string $roleId)
    {
        $role = EnterpriseRole::findOrFail($roleId);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify system protected roles'
            ], 403);
        }

        $validated = $request->validate([
            'template_id' => 'required|uuid|exists:permission_templates,id',
        ]);

        $template = PermissionTemplate::findOrFail($validated['template_id']);

        $count = $this->permissionService->applyTemplate($role->id, $template->permissions);

        return response()->json([
            'success' => true,
            'message' => "Successfully applied template. Added {$count} permissions."
        ]);
    }
}
