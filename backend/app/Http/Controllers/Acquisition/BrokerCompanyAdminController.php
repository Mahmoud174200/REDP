<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\BrokerCompanyProject;
use App\Models\Company;
use App\Models\EmployeeHierarchy;
use App\Models\Project;
use App\Models\User;
use App\Services\Acquisition\BrokerCompanyService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Controller: BrokerCompanyAdminController (Admin / Sales Manager)
 *
 * Vetting of external broker agencies and management of the projects
 * each agency is responsible for (assignment + request approval).
 * ─────────────────────────────────────────────────────────
 */
class BrokerCompanyAdminController extends Controller
{
    public function __construct(private BrokerCompanyService $service)
    {
    }

    /**
     * GET /v1/acquisition/broker-companies
     * List broker agencies (optionally filtered by approval status).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::brokerAgencies()->with('ownerUser:id,name,email,phone,status');

        if ($status = $request->query('status')) {
            $query->where('approval_status', $status);
        }

        $companies = $query->orderByDesc('applied_at')->get()->map(function (Company $c) {
            return $this->summarize($c);
        });

        return response()->json([
            'success' => true,
            'data'    => $companies,
            'counts'  => [
                'pending'   => Company::brokerAgencies()->where('approval_status', Company::APPROVAL_PENDING)->count(),
                'active'    => Company::brokerAgencies()->where('approval_status', Company::APPROVAL_ACTIVE)->count(),
                'rejected'  => Company::brokerAgencies()->where('approval_status', Company::APPROVAL_REJECTED)->count(),
                'suspended' => Company::brokerAgencies()->where('approval_status', Company::APPROVAL_SUSPENDED)->count(),
            ],
        ]);
    }

    /**
     * GET /v1/acquisition/broker-companies/{id}
     */
    public function show(string $id): JsonResponse
    {
        $company = Company::brokerAgencies()->with('ownerUser')->findOrFail($id);

        $employees = User::where('company_id', $company->id)
            ->with(['employeeHierarchy.position', 'employeeHierarchy.team'])
            ->get(['id', 'name', 'email', 'phone', 'status']);

        $projects = BrokerCompanyProject::where('company_id', $company->id)
            ->with('project:id,name,location')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => array_merge($this->summarize($company), [
                'legal_name'          => $company->legal_name,
                'registration_number' => $company->registration_number,
                'tax_id'              => $company->tax_id,
                'address'             => $company->address,
                'city'                => $company->city,
                'bank_name'           => $company->bank_name,
                'bank_iban'           => $company->bank_iban,
                'tax_card_path'       => $company->tax_card_path,
                'commercial_registry_path' => $company->commercial_registry_path,
                'rejection_reason'    => $company->rejection_reason,
                'commission_rates'    => [
                    'developer_brokerage_rate' => (float) $company->developer_brokerage_rate,
                    'owner_commission_rate'    => (float) $company->owner_commission_rate,
                    'leader_commission_rate'   => (float) $company->leader_commission_rate,
                    'agent_commission_rate'    => (float) $company->agent_commission_rate,
                ],
                'employees' => $employees,
                'projects'  => $projects,
            ]),
        ]);
    }

    /**
     * POST /v1/acquisition/broker-companies/{id}/approve
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $company = Company::brokerAgencies()->findOrFail($id);
        $company = $this->service->approveAgency($company, $request->user()?->id);

        AuditLogService::log('BROKER_COMPANY_APPROVE', $request->user()?->id, ['company_id' => $company->id]);

        return response()->json([
            'success' => true,
            'message' => "Agency '{$company->name}' approved. The owner can now sign in.",
            'data'    => $this->summarize($company->fresh('ownerUser')),
        ]);
    }

    /**
     * POST /v1/acquisition/broker-companies/{id}/reject
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate(['reason' => 'nullable|string|max:1000']);

        $company = Company::brokerAgencies()->findOrFail($id);
        $company = $this->service->rejectAgency($company, $request->user()?->id, $fields['reason'] ?? null);

        AuditLogService::log('BROKER_COMPANY_REJECT', $request->user()?->id, [
            'company_id' => $company->id,
            'reason'     => $fields['reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Agency '{$company->name}' rejected.",
            'data'    => $this->summarize($company->fresh('ownerUser')),
        ]);
    }

    /**
     * POST /v1/acquisition/broker-companies/{id}/suspend
     * Body: { suspended: bool }
     */
    public function suspend(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate(['suspended' => 'required|boolean']);

        $company = Company::brokerAgencies()->findOrFail($id);
        $company = $this->service->setAgencySuspended($company, (bool) $fields['suspended'], $request->user()?->id);

        AuditLogService::log('BROKER_COMPANY_SUSPEND', $request->user()?->id, [
            'company_id' => $company->id,
            'suspended'  => (bool) $fields['suspended'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $fields['suspended'] ? 'Agency suspended.' : 'Agency reactivated.',
            'data'    => $this->summarize($company->fresh('ownerUser')),
        ]);
    }

    // ════════════════════════════════════════════════
    // PROJECT ASSIGNMENTS
    // ════════════════════════════════════════════════

    /**
     * GET /v1/acquisition/broker-companies/project-requests
     * Pending project requests submitted by agencies.
     */
    public function projectRequests(): JsonResponse
    {
        $requests = BrokerCompanyProject::requested()
            ->with(['company:id,name', 'project:id,name,location', 'requester:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * POST /v1/acquisition/broker-companies/{id}/projects
     * Admin assigns one or more projects to the agency (auto-approved).
     * Body: { project_ids: [uuid, ...] }
     */
    public function assignProjects(Request $request, string $id): JsonResponse
    {
        $fields = $request->validate([
            'project_ids'   => 'required|array|min:1',
            'project_ids.*' => 'uuid|exists:projects,id',
        ]);

        $company = Company::brokerAgencies()->findOrFail($id);

        foreach ($fields['project_ids'] as $projectId) {
            BrokerCompanyProject::updateOrCreate(
                ['company_id' => $company->id, 'project_id' => $projectId],
                [
                    'id'           => (string) Str::uuid(),
                    'status'       => BrokerCompanyProject::STATUS_APPROVED,
                    'approved_by'  => $request->user()?->id,
                    'responded_at' => now(),
                ]
            );
        }

        AuditLogService::log('BROKER_COMPANY_ASSIGN_PROJECTS', $request->user()?->id, [
            'company_id'  => $company->id,
            'project_ids' => $fields['project_ids'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Projects assigned to the agency.',
            'data'    => BrokerCompanyProject::where('company_id', $company->id)->with('project:id,name,location')->get(),
        ]);
    }

    /**
     * POST /v1/acquisition/broker-companies/{id}/projects/{projectId}/respond
     * Respond to an agency's project request.
     * Body: { decision: 'approve'|'reject' }
     */
    public function respondProjectRequest(Request $request, string $id, string $projectId): JsonResponse
    {
        $fields = $request->validate(['decision' => 'required|in:approve,reject']);

        $link = BrokerCompanyProject::where('company_id', $id)
            ->where('project_id', $projectId)
            ->firstOrFail();

        $link->update([
            'status'       => $fields['decision'] === 'approve'
                ? BrokerCompanyProject::STATUS_APPROVED
                : BrokerCompanyProject::STATUS_REJECTED,
            'approved_by'  => $request->user()?->id,
            'responded_at' => now(),
        ]);

        AuditLogService::log('BROKER_COMPANY_PROJECT_DECISION', $request->user()?->id, [
            'company_id' => $id,
            'project_id' => $projectId,
            'decision'   => $fields['decision'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project request ' . $fields['decision'] . 'd.',
            'data'    => $link->fresh('project'),
        ]);
    }

    /**
     * DELETE /v1/acquisition/broker-companies/{id}/projects/{projectId}
     */
    public function removeProject(Request $request, string $id, string $projectId): JsonResponse
    {
        BrokerCompanyProject::where('company_id', $id)->where('project_id', $projectId)->delete();

        AuditLogService::log('BROKER_COMPANY_REMOVE_PROJECT', $request->user()?->id, [
            'company_id' => $id,
            'project_id' => $projectId,
        ]);

        return response()->json(['success' => true, 'message' => 'Project unassigned from the agency.']);
    }

    // ── Helpers ──

    private function summarize(Company $company): array
    {
        $employeeCount = User::where('company_id', $company->id)->count();
        $projectCount  = BrokerCompanyProject::where('company_id', $company->id)
            ->where('status', BrokerCompanyProject::STATUS_APPROVED)->count();
        $pendingRequests = BrokerCompanyProject::where('company_id', $company->id)
            ->where('status', BrokerCompanyProject::STATUS_REQUESTED)->count();

        return [
            'id'              => $company->id,
            'name'            => $company->name,
            'phone'           => $company->phone,
            'email'           => $company->email,
            'license_no'      => $company->license_no,
            'approval_status' => $company->approval_status,
            'applied_at'      => $company->applied_at,
            'approved_at'     => $company->approved_at,
            'owner'           => $company->ownerUser ? [
                'id'     => $company->ownerUser->id,
                'name'   => $company->ownerUser->name,
                'email'  => $company->ownerUser->email,
                'phone'  => $company->ownerUser->phone,
                'status' => $company->ownerUser->status,
            ] : null,
            'employee_count'          => $employeeCount,
            'assigned_project_count'  => $projectCount,
            'pending_request_count'   => $pendingRequests,
        ];
    }
}
