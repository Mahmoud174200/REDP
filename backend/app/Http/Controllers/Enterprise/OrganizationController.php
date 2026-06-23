<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\EnterpriseCountry;
use App\Models\Region;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Team;
use App\Models\Position;
use App\Models\EmployeeHierarchy;
use App\Models\Delegation;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    protected OrganizationService $orgService;

    public function __construct(OrganizationService $orgService)
    {
        $this->orgService = $orgService;
    }

    // ══════════════════════════════════════════════════════════
    // 🏢 COMPANIES
    // ══════════════════════════════════════════════════════════

    public function getCompanies(Request $request)
    {
        $query = Company::with(['country', 'parentCompany'])
            ->orderBy('name');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function getCompanyTree()
    {
        $tree = $this->orgService->getCompanyTree();
        return response()->json(['success' => true, 'data' => $tree]);
    }

    public function createCompany(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'type' => ['required', Rule::in(['holding', 'subsidiary', 'branch_company'])],
            'parent_company_id' => 'nullable|exists:companies,id',
            'logo_url' => 'nullable|url|max:500',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country_id' => 'nullable|exists:enterprise_countries,id',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = $validated['status'] ?? 'active';

        $company = Company::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully.',
            'data' => $company->load('country', 'parentCompany'),
        ], 201);
    }

    public function updateCompany(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'type' => ['required', Rule::in(['holding', 'subsidiary', 'branch_company'])],
            'parent_company_id' => 'nullable|exists:companies,id',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country_id' => 'nullable|exists:enterprise_countries,id',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        // Prevent circular parent references
        if (isset($validated['parent_company_id']) && $validated['parent_company_id'] === $id) {
            return response()->json(['success' => false, 'message' => 'Company cannot be its own parent.'], 422);
        }

        $company->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully.',
            'data' => $company->load('country', 'parentCompany'),
        ]);
    }

    public function deleteCompany($id)
    {
        $company = Company::findOrFail($id);

        // Check for subsidiaries
        if ($company->subsidiaries()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete company with subsidiaries. Remove subsidiaries first.',
            ], 422);
        }

        $company->delete();

        return response()->json(['success' => true, 'message' => 'Company deleted successfully.']);
    }

    public function updateDeveloperRate(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'developer_brokerage_rate' => 'required|numeric|min:0|max:100',
        ]);

        $company->update([
            'developer_brokerage_rate' => $validated['developer_brokerage_rate'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Developer brokerage commission rate updated successfully.',
            'data' => $company->only(['id', 'name', 'developer_brokerage_rate']),
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🌍 COUNTRIES
    // ══════════════════════════════════════════════════════════

    public function getCountries()
    {
        $countries = EnterpriseCountry::orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $countries]);
    }

    public function createCountry(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:3|unique:enterprise_countries,code',
            'phone_code' => 'nullable|string|max:10',
            'currency_code' => 'nullable|string|max:3',
            'timezone' => 'nullable|string|max:50',
            'flag_emoji' => 'nullable|string|max:10',
        ]);

        $validated['id'] = (string) Str::uuid();
        $country = EnterpriseCountry::create($validated);

        return response()->json(['success' => true, 'message' => 'Country created.', 'data' => $country], 201);
    }

    public function updateCountry(Request $request, $id)
    {
        $country = EnterpriseCountry::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => ['required', 'string', 'max:3', Rule::unique('enterprise_countries')->ignore($id)],
            'phone_code' => 'nullable|string|max:10',
            'currency_code' => 'nullable|string|max:3',
            'timezone' => 'nullable|string|max:50',
            'flag_emoji' => 'nullable|string|max:10',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $country->update($validated);
        return response()->json(['success' => true, 'message' => 'Country updated.', 'data' => $country]);
    }

    // ══════════════════════════════════════════════════════════
    // 🗺️ REGIONS
    // ══════════════════════════════════════════════════════════

    public function getRegions(Request $request)
    {
        $query = Region::with('company')->orderBy('name');
        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function createRegion(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:regions,code',
            'company_id' => 'required|exists:companies,id',
            'description' => 'nullable|string',
        ]);

        $validated['id'] = (string) Str::uuid();
        $region = Region::create($validated);

        return response()->json(['success' => true, 'message' => 'Region created.', 'data' => $region], 201);
    }

    public function updateRegion(Request $request, $id)
    {
        $region = Region::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:20', Rule::unique('regions')->ignore($id)],
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
        $region->update($validated);
        return response()->json(['success' => true, 'message' => 'Region updated.', 'data' => $region]);
    }

    public function deleteRegion($id)
    {
        Region::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Region deleted.']);
    }

    // ══════════════════════════════════════════════════════════
    // 🏬 BRANCHES
    // ══════════════════════════════════════════════════════════

    public function getBranches(Request $request)
    {
        $query = Branch::with(['company', 'country', 'region', 'manager'])->orderBy('name');
        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function createBranch(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:branches,code',
            'company_id' => 'required|exists:companies,id',
            'country_id' => 'nullable|exists:enterprise_countries,id',
            'region_id' => 'nullable|exists:regions,id',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'manager_id' => 'nullable|exists:users,id',
            'latitude' => 'nullable|string|max:20',
            'longitude' => 'nullable|string|max:20',
        ]);

        $validated['id'] = (string) Str::uuid();
        $branch = Branch::create($validated);

        return response()->json(['success' => true, 'message' => 'Branch created.', 'data' => $branch->load('company', 'country')], 201);
    }

    public function updateBranch(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:20', Rule::unique('branches')->ignore($id)],
            'country_id' => 'nullable|exists:enterprise_countries,id',
            'region_id' => 'nullable|exists:regions,id',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'manager_id' => 'nullable|exists:users,id',
            'latitude' => 'nullable|string|max:20',
            'longitude' => 'nullable|string|max:20',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
        $branch->update($validated);
        return response()->json(['success' => true, 'message' => 'Branch updated.', 'data' => $branch->load('company', 'country')]);
    }

    public function deleteBranch($id)
    {
        Branch::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Branch deleted.']);
    }

    // ══════════════════════════════════════════════════════════
    // 🏛️ DEPARTMENTS
    // ══════════════════════════════════════════════════════════

    public function getDepartments(Request $request)
    {
        $query = Department::with(['company', 'branch', 'head', 'parentDepartment'])->orderBy('name');
        if ($request->has('company_id')) $query->where('company_id', $request->company_id);
        if ($request->has('branch_id')) $query->where('branch_id', $request->branch_id);
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function getDepartmentTree(Request $request)
    {
        $request->validate(['company_id' => 'required|exists:companies,id']);
        $tree = $this->orgService->getDepartmentTree($request->company_id);
        return response()->json(['success' => true, 'data' => $tree]);
    }

    public function createDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'branch_id' => 'nullable|exists:branches,id',
            'company_id' => 'required|exists:companies,id',
            'parent_department_id' => 'nullable|exists:departments,id',
            'head_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
        ]);
        $validated['id'] = (string) Str::uuid();
        $dept = Department::create($validated);
        return response()->json(['success' => true, 'message' => 'Department created.', 'data' => $dept->load('head')], 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $dept = Department::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'branch_id' => 'nullable|exists:branches,id',
            'parent_department_id' => 'nullable|exists:departments,id',
            'head_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
        if (isset($validated['parent_department_id']) && $validated['parent_department_id'] === $id) {
            return response()->json(['success' => false, 'message' => 'Department cannot be its own parent.'], 422);
        }
        $dept->update($validated);
        return response()->json(['success' => true, 'message' => 'Department updated.', 'data' => $dept]);
    }

    public function deleteDepartment($id)
    {
        $dept = Department::findOrFail($id);
        if ($dept->subDepartments()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete department with sub-departments.'], 422);
        }
        $dept->delete();
        return response()->json(['success' => true, 'message' => 'Department deleted.']);
    }

    // ══════════════════════════════════════════════════════════
    // 👥 TEAMS
    // ══════════════════════════════════════════════════════════

    public function getTeams(Request $request)
    {
        $query = Team::with(['department', 'leader', 'company'])->orderBy('name');
        if ($request->has('department_id')) $query->where('department_id', $request->department_id);
        if ($request->has('company_id')) $query->where('company_id', $request->company_id);
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function createTeam(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'company_id' => 'required|exists:companies,id',
            'leader_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
        ]);
        $validated['id'] = (string) Str::uuid();
        $team = Team::create($validated);
        return response()->json(['success' => true, 'message' => 'Team created.', 'data' => $team->load('department', 'leader')], 201);
    }

    public function updateTeam(Request $request, $id)
    {
        $team = Team::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'leader_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
        $team->update($validated);
        return response()->json(['success' => true, 'message' => 'Team updated.', 'data' => $team]);
    }

    public function deleteTeam($id)
    {
        Team::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Team deleted.']);
    }

    // ══════════════════════════════════════════════════════════
    // 💼 POSITIONS
    // ══════════════════════════════════════════════════════════

    public function getPositions(Request $request)
    {
        $query = Position::with(['company', 'department'])->orderBy('level')->orderBy('title');
        if ($request->has('company_id')) $query->where('company_id', $request->company_id);
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function createPosition(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'company_id' => 'required|exists:companies,id',
            'department_id' => 'nullable|exists:departments,id',
            'level' => 'required|integer|min:1|max:8',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'responsibilities' => 'nullable|array',
        ]);
        $validated['id'] = (string) Str::uuid();
        $position = Position::create($validated);
        return response()->json(['success' => true, 'message' => 'Position created.', 'data' => $position], 201);
    }

    public function updatePosition(Request $request, $id)
    {
        $position = Position::findOrFail($id);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'level' => 'required|integer|min:1|max:8',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'responsibilities' => 'nullable|array',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
        $position->update($validated);
        return response()->json(['success' => true, 'message' => 'Position updated.', 'data' => $position]);
    }

    public function deletePosition($id)
    {
        Position::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Position deleted.']);
    }

    // ══════════════════════════════════════════════════════════
    // 📊 EMPLOYEE HIERARCHY
    // ══════════════════════════════════════════════════════════

    public function getHierarchy(Request $request)
    {
        $query = EmployeeHierarchy::with([
            'user', 'company', 'branch', 'department', 'team', 'position',
            'directManager', 'indirectManager', 'matrixManager',
        ]);
        if ($request->has('company_id')) $query->where('company_id', $request->company_id);
        if ($request->has('department_id')) $query->where('department_id', $request->department_id);
        if ($request->has('status')) $query->where('status', $request->status);
        return response()->json(['success' => true, 'data' => $query->orderBy('employee_number')->get()]);
    }

    public function assignToHierarchy(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'company_id' => 'required|exists:companies,id',
            'branch_id' => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'position_id' => 'nullable|exists:positions,id',
            'direct_manager_id' => 'nullable|exists:users,id',
            'indirect_manager_id' => 'nullable|exists:users,id',
            'matrix_manager_id' => 'nullable|exists:users,id',
            'employee_number' => 'nullable|string|max:30|unique:employee_hierarchy,employee_number',
            'hire_date' => 'nullable|date',
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = 'active';

        $hierarchy = EmployeeHierarchy::updateOrCreate(
            ['user_id' => $validated['user_id'], 'company_id' => $validated['company_id']],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee assigned to hierarchy.',
            'data' => $hierarchy->load('user', 'position', 'department', 'directManager'),
        ], 201);
    }

    public function transferEmployee(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'branch_id' => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'team_id' => 'nullable|exists:teams,id',
            'position_id' => 'nullable|exists:positions,id',
            'direct_manager_id' => 'nullable|exists:users,id',
        ]);

        $hierarchy = $this->orgService->transferEmployee(
            $validated['user_id'],
            $validated['branch_id'] ?? null,
            $validated['department_id'] ?? null,
            $validated['team_id'] ?? null,
            $validated['position_id'] ?? null,
            $validated['direct_manager_id'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee transferred successfully.',
            'data' => $hierarchy,
        ]);
    }

    public function getReportingStructure($userId)
    {
        $structure = $this->orgService->getReportingStructure($userId);
        return response()->json(['success' => true, 'data' => $structure]);
    }

    public function getOrgChart(Request $request)
    {
        $request->validate(['company_id' => 'required|exists:companies,id']);
        $chart = $this->orgService->getOrgChart($request->company_id);
        return response()->json(['success' => true, 'data' => $chart]);
    }

    // ══════════════════════════════════════════════════════════
    // 🔄 DELEGATIONS
    // ══════════════════════════════════════════════════════════

    public function getDelegations(Request $request)
    {
        $query = Delegation::with(['delegator', 'delegate', 'company', 'creator']);
        if ($request->has('company_id')) $query->where('company_id', $request->company_id);
        if ($request->has('status')) $query->where('status', $request->status);
        return response()->json(['success' => true, 'data' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function createDelegation(Request $request)
    {
        $validated = $request->validate([
            'delegator_id' => 'required|exists:users,id',
            'delegate_id' => 'required|exists:users,id|different:delegator_id',
            'company_id' => 'required|exists:companies,id',
            'type' => ['required', Rule::in(['full', 'approval_only', 'view_only'])],
            'reason' => 'nullable|string',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['status'] = 'active';
        $validated['created_by'] = $request->user()->id;

        $delegation = Delegation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Delegation created.',
            'data' => $delegation->load('delegator', 'delegate'),
        ], 201);
    }

    public function revokeDelegation($id)
    {
        $delegation = Delegation::findOrFail($id);
        $delegation->update(['status' => 'revoked']);
        return response()->json(['success' => true, 'message' => 'Delegation revoked.']);
    }

    // ══════════════════════════════════════════════════════════
    // 📊 COMPANY GROUPS
    // ══════════════════════════════════════════════════════════

    public function getCompanyGroups()
    {
        $groups = CompanyGroup::with('companies')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $groups]);
    }

    public function createCompanyGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_group_id' => 'nullable|exists:company_groups,id',
            'company_ids' => 'nullable|array',
            'company_ids.*' => 'exists:companies,id',
        ]);

        $validated['id'] = (string) Str::uuid();
        $group = CompanyGroup::create($validated);

        if (!empty($validated['company_ids'])) {
            foreach ($validated['company_ids'] as $companyId) {
                \DB::table('company_group_members')->insert([
                    'id' => (string) Str::uuid(),
                    'company_group_id' => $group->id,
                    'company_id' => $companyId,
                    'created_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Company group created.', 'data' => $group->load('companies')], 201);
    }

    public function updateCompanyGroup(Request $request, $id)
    {
        $group = CompanyGroup::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'company_ids' => 'nullable|array',
            'company_ids.*' => 'exists:companies,id',
        ]);

        $group->update($validated);

        if (isset($validated['company_ids'])) {
            \DB::table('company_group_members')->where('company_group_id', $id)->delete();
            foreach ($validated['company_ids'] as $companyId) {
                \DB::table('company_group_members')->insert([
                    'id' => (string) Str::uuid(),
                    'company_group_id' => $group->id,
                    'company_id' => $companyId,
                    'created_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Company group updated.', 'data' => $group->load('companies')]);
    }

    public function deleteCompanyGroup($id)
    {
        CompanyGroup::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Company group deleted.']);
    }
}
