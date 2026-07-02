<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Team;
use App\Models\EmployeeHierarchy;
use App\Models\Delegation;
use Illuminate\Support\Facades\DB;

class OrganizationService
{
    /**
     * Get the full organizational chart tree for a company.
     */
    public function getOrgChart(string $companyId): array
    {
        $company = Company::with([
            'branches.departments.teams',
            'branches.manager',
        ])->findOrFail($companyId);

        // Get all employee hierarchy entries for this company
        $employees = EmployeeHierarchy::with(['user', 'position', 'department', 'team'])
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        // Build a tree based on direct_manager_id relationships
        $tree = $this->buildHierarchyTree($employees);

        return [
            'company' => $company,
            'org_tree' => $tree,
            'stats' => [
                'total_employees' => $employees->count(),
                'total_branches' => $company->branches->count(),
                'total_departments' => $company->branches->sum(fn ($b) => $b->departments->count()),
                'total_teams' => $company->branches->sum(fn ($b) => $b->departments->sum(fn ($d) => $d->teams->count())),
            ],
        ];
    }

    /**
     * Build a hierarchical tree from employee hierarchy records.
     */
    private function buildHierarchyTree($employees, ?string $managerId = null): array
    {
        $tree = [];

        $directReports = $employees->filter(function ($emp) use ($managerId) {
            return $emp->direct_manager_id === $managerId;
        });

        foreach ($directReports as $employee) {
            $node = [
                'employee' => $employee,
                'children' => $this->buildHierarchyTree($employees, $employee->user_id),
            ];
            $tree[] = $node;
        }

        return $tree;
    }

    /**
     * Get the reporting structure for a specific user.
     */
    public function getReportingStructure(string $userId): array
    {
        $hierarchy = EmployeeHierarchy::with([
            'user', 'position', 'company', 'branch', 'department', 'team',
            'directManager', 'indirectManager', 'matrixManager',
        ])->where('user_id', $userId)->first();

        if (!$hierarchy) {
            return ['error' => 'Employee not found in hierarchy'];
        }

        return [
            'employee' => $hierarchy,
            'reporting_chain' => $hierarchy->getReportingChain(),
            'direct_reports' => $hierarchy->directReports(),
        ];
    }

    /**
     * Transfer an employee to a new organizational unit.
     */
    public function transferEmployee(
        string $userId,
        ?string $branchId = null,
        ?string $departmentId = null,
        ?string $teamId = null,
        ?string $positionId = null,
        ?string $directManagerId = null
    ): EmployeeHierarchy {
        return DB::transaction(function () use ($userId, $branchId, $departmentId, $teamId, $positionId, $directManagerId) {
            $hierarchy = EmployeeHierarchy::where('user_id', $userId)->firstOrFail();

            $updates = [];
            if ($branchId !== null) $updates['branch_id'] = $branchId;
            if ($departmentId !== null) $updates['department_id'] = $departmentId;
            if ($teamId !== null) $updates['team_id'] = $teamId;
            if ($positionId !== null) $updates['position_id'] = $positionId;
            if ($directManagerId !== null) $updates['direct_manager_id'] = $directManagerId;

            $hierarchy->update($updates);

            return $hierarchy->fresh([
                'user', 'branch', 'department', 'team', 'position', 'directManager',
            ]);
        });
    }

    /**
     * Expire all overdue delegations.
     */
    public function expireOverdueDelegations(): int
    {
        return Delegation::where('status', 'active')
            ->where('end_date', '<', now())
            ->update(['status' => 'expired']);
    }

    /**
     * Get company hierarchy tree (holding → subsidiaries).
     */
    public function getCompanyTree(?string $parentId = null): \Illuminate\Support\Collection
    {
        $query = Company::with(['country', 'branches'])
            ->where('status', 'active');

        if ($parentId === null) {
            $query->whereNull('parent_company_id');
        } else {
            $query->where('parent_company_id', $parentId);
        }

        return $query->get()->map(function ($company) {
            $company->children = $this->getCompanyTree($company->id);
            return $company;
        });
    }

    /**
     * Get full department tree for a company.
     */
    public function getDepartmentTree(string $companyId, ?string $parentId = null): \Illuminate\Support\Collection
    {
        $query = Department::with(['head', 'teams.leader'])
            ->where('company_id', $companyId)
            ->where('status', 'active');

        if ($parentId === null) {
            $query->whereNull('parent_department_id');
        } else {
            $query->where('parent_department_id', $parentId);
        }

        return $query->get()->map(function ($dept) use ($companyId) {
            $dept->children = $this->getDepartmentTree($companyId, $dept->id);
            $dept->employee_count = EmployeeHierarchy::where('department_id', $dept->id)
                ->where('status', 'active')
                ->count();
            return $dept;
        });
    }
}
