<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\BrokerCompanyProject;
use App\Models\ClientPresentation;
use App\Models\Commission;
use App\Models\Company;
use App\Models\EmployeeHierarchy;
use App\Models\Interaction;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Reservation;
use App\Models\Team;
use App\Models\User;
use App\Services\Acquisition\BrokerCompanyService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Controller: BrokerCompanyManagementController
 *
 * Self-service management dashboard for a broker agency OWNER:
 *   • Manage employees (broker accounts) & teams
 *   • Track per-employee performance
 *   • View / request the projects the agency is responsible for
 *
 * Mounted under /v1/sales/broker/company (role:broker, tier:2).
 * Writes require the Broker Owner sub-role.
 * ─────────────────────────────────────────────────────────
 */
class BrokerCompanyManagementController extends Controller
{
    public function __construct(private BrokerCompanyService $service)
    {
    }

    // ════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════

    /**
     * GET /v1/sales/broker/company/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: false);

        $userIds   = User::where('company_id', $company->id)->pluck('id')->toArray();
        $brokerIds = Broker::whereIn('user_id', $userIds)->pluck('id')->toArray();

        $teamCount     = Team::where('company_id', $company->id)->count();
        $employeeCount = count($userIds);

        $totalLeads    = Lead::whereIn('broker_id', $brokerIds)->count();
        $totalReservations = Reservation::whereIn('broker_id', $brokerIds)->count();
        $closedSales   = Reservation::whereIn('broker_id', $brokerIds)->where('status', 'confirmed')->count();

        $pendingComm  = (float) Commission::whereIn('broker_id', $brokerIds)->where('status', 'pending')->sum('gross_amount');
        $approvedComm = (float) Commission::whereIn('broker_id', $brokerIds)->where('status', 'approved')->sum('gross_amount');
        $paidComm     = (float) Commission::whereIn('broker_id', $brokerIds)->where('status', 'paid')->sum('gross_amount');

        // Top performers by commission earned
        $topPerformers = collect($userIds)->map(function ($uid) {
            $u = User::find($uid);
            $b = Broker::where('user_id', $uid)->first();
            if (!$u || !$b) return null;
            return [
                'user_id'      => $u->id,
                'name'         => $u->name,
                'leads'        => Lead::where('broker_id', $b->id)->count(),
                'closed_sales' => Reservation::where('broker_id', $b->id)->where('status', 'confirmed')->count(),
                'commission'   => (float) Commission::where('broker_id', $b->id)->whereIn('status', ['approved', 'paid'])->sum('gross_amount'),
            ];
        })->filter()->sortByDesc('commission')->take(5)->values();

        return response()->json([
            'success' => true,
            'company' => [
                'id'              => $company->id,
                'name'            => $company->name,
                'approval_status' => $company->approval_status,
            ],
            'stats' => [
                'employees'          => $employeeCount,
                'teams'              => $teamCount,
                'total_leads'        => $totalLeads,
                'total_reservations' => $totalReservations,
                'closed_sales'       => $closedSales,
                'pending_commission' => $pendingComm,
                'approved_commission'=> $approvedComm,
                'paid_commission'    => $paidComm,
                'total_commission'   => $pendingComm + $approvedComm + $paidComm,
                'assigned_projects'  => BrokerCompanyProject::where('company_id', $company->id)->where('status', BrokerCompanyProject::STATUS_APPROVED)->count(),
                'pending_project_requests' => BrokerCompanyProject::where('company_id', $company->id)->where('status', BrokerCompanyProject::STATUS_REQUESTED)->count(),
            ],
            'top_performers' => $topPerformers,
        ]);
    }

    // ════════════════════════════════════════════════
    // EMPLOYEES
    // ════════════════════════════════════════════════

    /**
     * GET /v1/sales/broker/company/employees
     */
    public function employees(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: false);

        $users = User::where('company_id', $company->id)
            ->with(['employeeHierarchy.position', 'employeeHierarchy.team', 'employeeHierarchy.directManager:id,name'])
            ->orderBy('name')
            ->get();

        $employees = $users->map(fn (User $u) => $this->employeeCard($u, $company));

        return response()->json(['success' => true, 'data' => $employees]);
    }

    /**
     * GET /v1/sales/broker/company/employees/{id}
     */
    public function showEmployee(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: false);

        $user = User::where('company_id', $company->id)
            ->with(['employeeHierarchy.position', 'employeeHierarchy.team', 'employeeHierarchy.directManager:id,name'])
            ->findOrFail($id);

        $broker = Broker::where('user_id', $user->id)->first();
        $brokerId = $broker?->id;

        $recentLeads = $brokerId
            ? Lead::where('broker_id', $brokerId)->latest()->limit(15)->get(['id', 'first_name', 'last_name', 'phone', 'status', 'created_at'])
            : collect();

        $recentReservations = $brokerId
            ? Reservation::where('broker_id', $brokerId)->with('unit:id,unit_number,project_id')->latest()->limit(15)->get()
            : collect();

        $recentPresentations = ClientPresentation::where('broker_user_id', $user->id)
            ->latest()->limit(15)->get();

        return response()->json([
            'success'  => true,
            'employee' => $this->employeeCard($user, $company),
            'recent_leads'         => $recentLeads,
            'recent_reservations'  => $recentReservations,
            'recent_presentations' => $recentPresentations,
        ]);
    }

    /**
     * POST /v1/sales/broker/company/employees
     */
    public function storeEmployee(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $fields = $request->validate([
            'name'            => 'required|string|max:150',
            'email'           => 'required|email|max:255|unique:users,email',
            'phone'           => 'nullable|string|max:20',
            'password'        => 'nullable|string|min:6',
            'role_type'       => 'nullable|in:agent,team_leader',
            'team_id'         => 'nullable|uuid',
            'manager_user_id' => 'nullable|uuid',
        ]);

        $this->assertBelongsToCompany($company, $fields['team_id'] ?? null, $fields['manager_user_id'] ?? null);

        $result = $this->service->createEmployee($company, $fields);

        AuditLogService::log('BROKER_COMPANY_ADD_EMPLOYEE', $request->user()?->id, [
            'company_id'  => $company->id,
            'employee_id' => $result['user']->id,
            'role_type'   => $fields['role_type'] ?? 'agent',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee account created.',
            'data'    => $this->employeeCard($result['user']->fresh(['employeeHierarchy.position', 'employeeHierarchy.team']), $company),
            'credentials' => [
                'email'    => $result['user']->email,
                'password' => $result['password'],
            ],
        ], 201);
    }

    /**
     * PUT /v1/sales/broker/company/employees/{id}
     */
    public function updateEmployee(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $user = User::where('company_id', $company->id)->findOrFail($id);

        if ($user->id === $company->owner_user_id) {
            throw ValidationException::withMessages(['id' => 'The agency owner account cannot be modified here.']);
        }

        $fields = $request->validate([
            'name'            => 'sometimes|string|max:150',
            'phone'           => 'nullable|string|max:20',
            'role_type'       => 'nullable|in:agent,team_leader',
            'team_id'         => 'nullable|uuid',
            'manager_user_id' => 'nullable|uuid',
            'status'          => 'nullable|in:active,inactive',
        ]);

        $this->assertBelongsToCompany($company, $fields['team_id'] ?? null, $fields['manager_user_id'] ?? null);

        [$department, $positions] = $this->service->ensureOrgScaffold($company);
        $hierarchy = EmployeeHierarchy::where('user_id', $user->id)->where('company_id', $company->id)->first();

        $userUpdate = [];
        $hierUpdate = [];

        if (array_key_exists('name', $fields)) {
            $userUpdate['name'] = $fields['name'];
            Broker::where('user_id', $user->id)->update(['agent_name' => $fields['name']]);
        }
        if (array_key_exists('phone', $fields)) {
            $userUpdate['phone'] = $fields['phone'];
        }
        if (array_key_exists('status', $fields) && $fields['status']) {
            $userUpdate['status'] = $fields['status'];
            Broker::where('user_id', $user->id)->update([
                'status' => $fields['status'] === 'active' ? Broker::STATUS_ACTIVE : Broker::STATUS_SUSPENDED,
            ]);
            if ($hierarchy) {
                $hierUpdate['status'] = $fields['status'] === 'active' ? 'active' : 'inactive';
            }
        }
        if (!empty($fields['role_type'])) {
            $position = $positions[$fields['role_type']];
            $userUpdate['position_id'] = $position->id;
            $hierUpdate['position_id'] = $position->id;
        }
        if (array_key_exists('team_id', $fields)) {
            $userUpdate['team_id'] = $fields['team_id'];
            $hierUpdate['team_id'] = $fields['team_id'];
        }
        if (array_key_exists('manager_user_id', $fields)) {
            $hierUpdate['direct_manager_id'] = $fields['manager_user_id'] ?? $company->owner_user_id;
        }

        if ($userUpdate) {
            $user->update($userUpdate);
        }
        if ($hierarchy && $hierUpdate) {
            $hierarchy->update($hierUpdate);
        }

        AuditLogService::log('BROKER_COMPANY_UPDATE_EMPLOYEE', $request->user()?->id, [
            'company_id'  => $company->id,
            'employee_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated.',
            'data'    => $this->employeeCard($user->fresh(['employeeHierarchy.position', 'employeeHierarchy.team']), $company),
        ]);
    }

    /**
     * DELETE /v1/sales/broker/company/employees/{id}
     * Deactivates the employee (soft — keeps their historical data).
     */
    public function destroyEmployee(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $user = User::where('company_id', $company->id)->findOrFail($id);

        if ($user->id === $company->owner_user_id) {
            throw ValidationException::withMessages(['id' => 'The agency owner account cannot be removed.']);
        }

        $user->update(['status' => 'inactive']);
        Broker::where('user_id', $user->id)->update(['status' => Broker::STATUS_SUSPENDED]);
        EmployeeHierarchy::where('user_id', $user->id)->where('company_id', $company->id)
            ->update(['status' => 'terminated', 'termination_date' => now()->toDateString()]);

        AuditLogService::log('BROKER_COMPANY_REMOVE_EMPLOYEE', $request->user()?->id, [
            'company_id'  => $company->id,
            'employee_id' => $user->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Employee deactivated.']);
    }

    /**
     * POST /v1/sales/broker/company/employees/{id}/reset-password
     */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $user = User::where('company_id', $company->id)->findOrFail($id);
        $password = $request->input('password') ?: Str::password(10, true, true, false);

        $request->validate(['password' => 'nullable|string|min:6']);

        $user->update(['password' => Hash::make($password)]);

        AuditLogService::log('BROKER_COMPANY_RESET_PASSWORD', $request->user()?->id, [
            'company_id'  => $company->id,
            'employee_id' => $user->id,
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'Password reset.',
            'credentials' => ['email' => $user->email, 'password' => $password],
        ]);
    }

    // ════════════════════════════════════════════════
    // TEAMS
    // ════════════════════════════════════════════════

    /**
     * GET /v1/sales/broker/company/teams
     */
    public function teams(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: false);

        $teams = Team::where('company_id', $company->id)
            ->with('leader:id,name')
            ->orderBy('name')
            ->get()
            ->map(function (Team $team) {
                $members = User::where('team_id', $team->id)->get(['id', 'name', 'status']);
                $brokerIds = Broker::whereIn('user_id', $members->pluck('id'))->pluck('id')->toArray();

                return [
                    'id'          => $team->id,
                    'name'        => $team->name,
                    'description' => $team->description,
                    'status'      => $team->status,
                    'leader'      => $team->leader ? ['id' => $team->leader->id, 'name' => $team->leader->name] : null,
                    'member_count'=> $members->count(),
                    'members'     => $members,
                    'stats'       => [
                        'total_leads'  => Lead::whereIn('broker_id', $brokerIds)->count(),
                        'closed_sales' => Reservation::whereIn('broker_id', $brokerIds)->where('status', 'confirmed')->count(),
                        'commission'   => (float) Commission::whereIn('broker_id', $brokerIds)->whereIn('status', ['approved', 'paid'])->sum('gross_amount'),
                    ],
                ];
            });

        return response()->json(['success' => true, 'data' => $teams]);
    }

    /**
     * POST /v1/sales/broker/company/teams
     */
    public function storeTeam(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $fields = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'leader_id'   => 'nullable|uuid',
        ]);

        $this->assertBelongsToCompany($company, null, $fields['leader_id'] ?? null);

        [$department] = $this->service->ensureOrgScaffold($company);

        $team = Team::create([
            'id'            => (string) Str::uuid(),
            'name'          => $fields['name'],
            'description'   => $fields['description'] ?? null,
            'company_id'    => $company->id,
            'department_id' => $department->id,
            'leader_id'     => $fields['leader_id'] ?? null,
            'status'        => 'active',
        ]);

        AuditLogService::log('BROKER_COMPANY_ADD_TEAM', $request->user()?->id, [
            'company_id' => $company->id,
            'team_id'    => $team->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Team created.', 'data' => $team], 201);
    }

    /**
     * PUT /v1/sales/broker/company/teams/{id}
     */
    public function updateTeam(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);
        $team = Team::where('company_id', $company->id)->findOrFail($id);

        $fields = $request->validate([
            'name'        => 'sometimes|string|max:150',
            'description' => 'nullable|string|max:500',
            'leader_id'   => 'nullable|uuid',
            'status'      => 'nullable|in:active,inactive',
        ]);

        $this->assertBelongsToCompany($company, null, $fields['leader_id'] ?? null);

        $update = [];
        if (array_key_exists('name', $fields))        $update['name'] = $fields['name'];
        if (array_key_exists('description', $fields))  $update['description'] = $fields['description'];
        if (array_key_exists('leader_id', $fields))    $update['leader_id'] = $fields['leader_id'];
        if (!empty($fields['status']))                 $update['status'] = $fields['status'];

        if ($update) {
            $team->update($update);
        }

        return response()->json(['success' => true, 'message' => 'Team updated.', 'data' => $team->fresh('leader')]);
    }

    /**
     * DELETE /v1/sales/broker/company/teams/{id}
     */
    public function destroyTeam(Request $request, string $id): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);
        $team = Team::where('company_id', $company->id)->findOrFail($id);

        // Detach members before removing the team
        User::where('team_id', $team->id)->update(['team_id' => null]);
        EmployeeHierarchy::where('team_id', $team->id)->update(['team_id' => null]);
        $team->delete();

        AuditLogService::log('BROKER_COMPANY_REMOVE_TEAM', $request->user()?->id, [
            'company_id' => $company->id,
            'team_id'    => $id,
        ]);

        return response()->json(['success' => true, 'message' => 'Team removed.']);
    }

    // ════════════════════════════════════════════════
    // PROJECTS (responsibility)
    // ════════════════════════════════════════════════

    /**
     * GET /v1/sales/broker/company/projects
     */
    public function projects(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: false);

        $links = BrokerCompanyProject::where('company_id', $company->id)
            ->with('project:id,name,location,status')
            ->get();

        $linkedIds = $links->pluck('project_id')->toArray();
        $available = Project::whereNotIn('id', $linkedIds)->orderBy('name')->get(['id', 'name', 'location', 'status']);

        return response()->json([
            'success'   => true,
            'assigned'  => $links->where('status', BrokerCompanyProject::STATUS_APPROVED)->values(),
            'requested' => $links->where('status', BrokerCompanyProject::STATUS_REQUESTED)->values(),
            'rejected'  => $links->where('status', BrokerCompanyProject::STATUS_REJECTED)->values(),
            'available' => $available,
        ]);
    }

    /**
     * POST /v1/sales/broker/company/projects/request
     * Body: { project_ids: [uuid, ...] }
     */
    public function requestProjects(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request, requireOwner: true);

        $fields = $request->validate([
            'project_ids'   => 'required|array|min:1',
            'project_ids.*' => 'uuid|exists:projects,id',
        ]);

        foreach ($fields['project_ids'] as $projectId) {
            $existing = BrokerCompanyProject::where('company_id', $company->id)->where('project_id', $projectId)->first();
            // Don't downgrade an already-approved assignment
            if ($existing && $existing->status === BrokerCompanyProject::STATUS_APPROVED) {
                continue;
            }
            BrokerCompanyProject::updateOrCreate(
                ['company_id' => $company->id, 'project_id' => $projectId],
                [
                    'id'           => (string) Str::uuid(),
                    'status'       => BrokerCompanyProject::STATUS_REQUESTED,
                    'requested_by' => $request->user()?->id,
                    'responded_at' => null,
                ]
            );
        }

        AuditLogService::log('BROKER_COMPANY_REQUEST_PROJECTS', $request->user()?->id, [
            'company_id'  => $company->id,
            'project_ids' => $fields['project_ids'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project request submitted for admin approval.',
        ], 201);
    }

    // ── Helpers ──

    /**
     * Resolve the acting broker's approved agency and enforce authorization.
     */
    private function resolveCompany(Request $request, bool $requireOwner): Company
    {
        $user = $request->user();
        $company = $user->company_id ? Company::find($user->company_id) : null;

        if (!$company || !$company->is_broker_agency) {
            abort(response()->json([
                'success' => false,
                'message' => 'Your account is not linked to a broker agency.',
            ], 403));
        }

        if ($company->approval_status !== Company::APPROVAL_ACTIVE) {
            abort(response()->json([
                'success' => false,
                'message' => 'Your broker agency is not active.',
            ], 403));
        }

        if ($requireOwner && $this->service->resolveBrokerRole($user) !== BrokerCompanyService::ROLE_OWNER) {
            abort(response()->json([
                'success' => false,
                'message' => 'Only the agency owner can perform this action.',
            ], 403));
        }

        return $company;
    }

    /**
     * Guard: team / manager references must belong to the same agency.
     */
    private function assertBelongsToCompany(Company $company, ?string $teamId, ?string $managerId): void
    {
        if ($teamId && !Team::where('id', $teamId)->where('company_id', $company->id)->exists()) {
            throw ValidationException::withMessages(['team_id' => 'The selected team does not belong to your agency.']);
        }
        if ($managerId && !User::where('id', $managerId)->where('company_id', $company->id)->exists()) {
            throw ValidationException::withMessages(['manager_user_id' => 'The selected manager does not belong to your agency.']);
        }
    }

    /**
     * Build an employee card with tracking metrics.
     */
    private function employeeCard(User $user, Company $company): array
    {
        $broker = Broker::where('user_id', $user->id)->first();
        $brokerId = $broker?->id;

        $stats = [
            'total_leads'   => $brokerId ? Lead::where('broker_id', $brokerId)->count() : 0,
            'reservations'  => $brokerId ? Reservation::where('broker_id', $brokerId)->count() : 0,
            'closed_sales'  => $brokerId ? Reservation::where('broker_id', $brokerId)->where('status', 'confirmed')->count() : 0,
            'presentations' => ClientPresentation::where('broker_user_id', $user->id)->count(),
            'calls'         => Interaction::where('logged_by', $user->id)->whereIn('type', ['call', 'whatsapp', 'email'])->count(),
            'meetings'      => Interaction::where('logged_by', $user->id)->where('type', 'meeting')->count(),
            'commission_earned' => $brokerId ? (float) Commission::where('broker_id', $brokerId)->whereIn('status', ['approved', 'paid'])->sum('gross_amount') : 0.0,
        ];

        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'phone'         => $user->phone,
            'status'        => $user->status,
            'employee_number' => $user->employee_number,
            'is_owner'      => $user->id === $company->owner_user_id,
            'role_type'     => $this->service->resolveBrokerRole($user),
            'position'      => $user->employeeHierarchy?->position?->title ?? 'Broker Agent',
            'team'          => $user->employeeHierarchy?->team
                ? ['id' => $user->employeeHierarchy->team->id, 'name' => $user->employeeHierarchy->team->name]
                : null,
            'manager'       => $user->employeeHierarchy?->directManager
                ? ['id' => $user->employeeHierarchy->directManager->id, 'name' => $user->employeeHierarchy->directManager->name]
                : null,
            'referral_code' => $broker?->referral_code,
            'stats'         => $stats,
        ];
    }
}
