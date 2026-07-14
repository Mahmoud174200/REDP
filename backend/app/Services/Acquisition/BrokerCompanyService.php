<?php

namespace App\Services\Acquisition;

use App\Models\Broker;
use App\Models\Company;
use App\Models\Department;
use App\Models\EmployeeHierarchy;
use App\Models\Position;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Broker Mediation Platform
 * Service: BrokerCompanyService
 *
 * Central place for building & maintaining a Broker Agency on top of
 * the shared enterprise org tables (companies / departments / positions
 * / teams / employee_hierarchy). Reused by:
 *   • Public self-service registration
 *   • Admin vetting / approval
 *   • Owner self-service employee & team management
 *
 * Broker sub-roles map onto position codes so the existing owner/leader
 * detection & subordinate rollups keep working unchanged:
 *   Owner       → POS-DH  (level 1)
 *   Team Leader → POS-TL  (level 4)
 *   Agent       → POS-AGT (level 6)
 * ─────────────────────────────────────────────────────────
 */
class BrokerCompanyService
{
    public const DEPT_CODE = 'BRK';

    public const POS_OWNER  = 'POS-DH';
    public const POS_LEADER = 'POS-TL';
    public const POS_AGENT  = 'POS-AGT';

    public const ROLE_OWNER  = 'owner';
    public const ROLE_LEADER = 'team_leader';
    public const ROLE_AGENT  = 'agent';

    /**
     * Register a new broker agency (pending admin approval).
     *
     * @return array{company: Company, owner: User, broker: Broker, password: string}
     */
    public function registerAgency(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $company = Company::create([
                'id'                  => (string) Str::uuid(),
                'name'                => $data['company_name'],
                'legal_name'          => $data['legal_name'] ?? $data['company_name'],
                'registration_number' => $data['registration_number'] ?? null,
                'tax_id'              => $data['tax_id'] ?? null,
                'type'                => 'subsidiary',
                'is_broker_agency'    => true,
                'license_no'          => $data['license_no'] ?? null,
                'tax_card_path'       => $data['tax_card_path'] ?? null,
                'commercial_registry_path' => $data['commercial_registry_path'] ?? null,
                'bank_name'           => $data['bank_name'] ?? null,
                'bank_iban'           => $data['bank_iban'] ?? null,
                'phone'               => $data['phone'] ?? null,
                'email'               => $data['email'] ?? null,
                'address'             => $data['address'] ?? null,
                'city'                => $data['city'] ?? null,
                'status'              => 'inactive',
                'approval_status'     => Company::APPROVAL_PENDING,
                'applied_at'          => now(),
            ]);

            [$department, $positions] = $this->ensureOrgScaffold($company);

            // Owner user account (cannot log in until the agency is approved)
            $owner = User::create([
                'id'            => (string) Str::uuid(),
                'name'          => $data['owner_name'],
                'email'         => $data['owner_email'],
                'password'      => Hash::make($data['owner_password']),
                'phone'         => $data['owner_phone'] ?? $data['phone'] ?? null,
                'role'          => 'broker',
                'status'        => 'pending',
                'company_id'    => $company->id,
                'department_id' => $department->id,
                'position_id'   => $positions[self::ROLE_OWNER]->id,
                'employee_number' => $this->uniqueEmployeeNumber(),
            ]);

            $company->update(['owner_user_id' => $owner->id]);

            $broker = Broker::create([
                'id'            => (string) Str::uuid(),
                'user_id'       => $owner->id,
                'agency_name'   => $company->name,
                'agent_name'    => $owner->name,
                'email'         => $owner->email,
                'phone'         => $owner->phone ?? '',
                'license_no'    => $company->license_no,
                'status'        => Broker::STATUS_PENDING,
                'referral_code' => $this->uniqueReferralCode(),
            ]);

            EmployeeHierarchy::create([
                'id'              => (string) Str::uuid(),
                'user_id'         => $owner->id,
                'company_id'      => $company->id,
                'department_id'   => $department->id,
                'position_id'     => $positions[self::ROLE_OWNER]->id,
                'employee_number' => $owner->employee_number,
                'hire_date'       => now()->toDateString(),
                'status'          => 'active',
            ]);

            return [
                'company'  => $company->fresh(),
                'owner'    => $owner,
                'broker'   => $broker,
                'password' => $data['owner_password'],
            ];
        });
    }

    /**
     * Approve a pending broker agency: activate company + owner + broker.
     */
    public function approveAgency(Company $company, ?string $adminId): Company
    {
        return DB::transaction(function () use ($company, $adminId) {
            $company->update([
                'approval_status'  => Company::APPROVAL_ACTIVE,
                'status'           => 'active',
                'approved_at'      => now(),
                'approved_by'      => $adminId,
                'rejection_reason' => null,
            ]);

            if ($company->owner_user_id) {
                User::where('id', $company->owner_user_id)->update(['status' => 'active']);
                Broker::where('user_id', $company->owner_user_id)
                    ->update(['status' => Broker::STATUS_ACTIVE]);
            }

            return $company->fresh();
        });
    }

    /**
     * Reject a pending broker agency.
     */
    public function rejectAgency(Company $company, ?string $adminId, ?string $reason): Company
    {
        $company->update([
            'approval_status'  => Company::APPROVAL_REJECTED,
            'status'           => 'inactive',
            'approved_by'      => $adminId,
            'rejection_reason' => $reason,
        ]);

        if ($company->owner_user_id) {
            User::where('id', $company->owner_user_id)->update(['status' => 'inactive']);
        }

        return $company->fresh();
    }

    /**
     * Suspend / reactivate an approved agency.
     */
    public function setAgencySuspended(Company $company, bool $suspended, ?string $adminId): Company
    {
        $company->update([
            'approval_status' => $suspended ? Company::APPROVAL_SUSPENDED : Company::APPROVAL_ACTIVE,
            'status'          => $suspended ? 'suspended' : 'active',
            'approved_by'     => $adminId,
        ]);

        $userStatus = $suspended ? 'inactive' : 'active';
        $brokerStatus = $suspended ? Broker::STATUS_SUSPENDED : Broker::STATUS_ACTIVE;

        // Suspend/reactivate every account belonging to the agency
        User::where('company_id', $company->id)->update(['status' => $userStatus]);
        $userIds = User::where('company_id', $company->id)->pluck('id')->toArray();
        Broker::whereIn('user_id', $userIds)->update(['status' => $brokerStatus]);

        return $company->fresh();
    }

    /**
     * Create an employee (broker user) under an agency.
     *
     * @return array{user: User, broker: Broker, password: string}
     */
    public function createEmployee(Company $company, array $data): array
    {
        return DB::transaction(function () use ($company, $data) {
            [$department, $positions] = $this->ensureOrgScaffold($company);

            $roleType = in_array($data['role_type'] ?? self::ROLE_AGENT, [self::ROLE_LEADER, self::ROLE_AGENT], true)
                ? $data['role_type']
                : self::ROLE_AGENT;

            $position = $positions[$roleType];
            $plainPassword = $data['password'] ?? Str::password(10, true, true, false);
            $managerId = $data['manager_user_id'] ?? $company->owner_user_id;

            $user = User::create([
                'id'            => (string) Str::uuid(),
                'name'          => $data['name'],
                'email'         => $data['email'],
                'password'      => Hash::make($plainPassword),
                'phone'         => $data['phone'] ?? null,
                'role'          => 'broker',
                'status'        => 'active',
                'company_id'    => $company->id,
                'department_id' => $department->id,
                'team_id'       => $data['team_id'] ?? null,
                'position_id'   => $position->id,
                'employee_number' => $this->uniqueEmployeeNumber(),
            ]);

            $broker = Broker::create([
                'id'            => (string) Str::uuid(),
                'user_id'       => $user->id,
                'agency_name'   => $company->name,
                'agent_name'    => $user->name,
                'email'         => $user->email,
                'phone'         => $user->phone ?? '',
                'license_no'    => $company->license_no,
                'status'        => Broker::STATUS_ACTIVE,
                'referral_code' => $this->uniqueReferralCode(),
            ]);

            EmployeeHierarchy::create([
                'id'                => (string) Str::uuid(),
                'user_id'           => $user->id,
                'company_id'        => $company->id,
                'department_id'     => $department->id,
                'team_id'           => $data['team_id'] ?? null,
                'position_id'       => $position->id,
                'direct_manager_id' => $managerId,
                'employee_number'   => $user->employee_number,
                'hire_date'         => now()->toDateString(),
                'status'            => 'active',
            ]);

            return [
                'user'     => $user,
                'broker'   => $broker,
                'password' => $plainPassword,
            ];
        });
    }

    /**
     * Ensure the standard broker department + owner/leader/agent positions
     * exist for a company. Idempotent.
     *
     * @return array{0: Department, 1: array<string, Position>}
     */
    public function ensureOrgScaffold(Company $company): array
    {
        $department = Department::firstOrCreate(
            ['company_id' => $company->id, 'code' => self::DEPT_CODE],
            ['id' => (string) Str::uuid(), 'name' => 'Brokerage', 'status' => 'active']
        );

        $definitions = [
            self::ROLE_OWNER  => ['code' => self::POS_OWNER,  'title' => 'Broker Owner',       'level' => 1],
            self::ROLE_LEADER => ['code' => self::POS_LEADER, 'title' => 'Broker Team Leader', 'level' => 4],
            self::ROLE_AGENT  => ['code' => self::POS_AGENT,  'title' => 'Broker Agent',       'level' => 6],
        ];

        $positions = [];
        foreach ($definitions as $roleKey => $def) {
            $positions[$roleKey] = Position::firstOrCreate(
                ['company_id' => $company->id, 'code' => $def['code']],
                [
                    'id'            => (string) Str::uuid(),
                    'title'         => $def['title'],
                    'department_id' => $department->id,
                    'level'         => $def['level'],
                    'status'        => 'active',
                ]
            );
        }

        return [$department, $positions];
    }

    /**
     * Map a user's position code to a broker sub-role.
     */
    public function resolveBrokerRole(?User $user): string
    {
        if (!$user) {
            return self::ROLE_AGENT;
        }

        $code = $user->employeeHierarchy?->position?->code ?? $user->position?->code;

        return match ($code) {
            self::POS_OWNER  => self::ROLE_OWNER,
            self::POS_LEADER => self::ROLE_LEADER,
            default          => self::ROLE_AGENT,
        };
    }

    public function uniqueReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Broker::where('referral_code', $code)->exists());

        return $code;
    }

    public function uniqueEmployeeNumber(): string
    {
        do {
            $number = 'BRK-' . strtoupper(Str::random(6));
        } while (EmployeeHierarchy::where('employee_number', $number)->exists()
              || User::where('employee_number', $number)->exists());

        return $number;
    }
}
