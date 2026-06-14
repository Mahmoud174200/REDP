<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Campaign;
use App\Models\Broker;
use App\Models\Lead;
use App\Models\Interaction;
use App\Models\CallLog;
use App\Models\Commission;
use App\Models\Contract;
use App\Models\PaymentPlan;
use App\Models\Payment;
use App\Models\CollectionsQueue;
use App\Models\ReschedulingRequest;
use App\Models\Vendor;
use App\Models\MaintenanceTicket;
use App\Models\DefectsSnag;
use App\Models\WorkflowTemplate;
use App\Models\EnterpriseCountry;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Team;
use App\Models\Position;
use App\Models\EmployeeHierarchy;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with high-fidelity realistic data.
     */
    public function run(): void
    {
        // ── 0. Create Enterprise Structure ──
        $egypt = EnterpriseCountry::updateOrCreate(
            ['code' => 'EG'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Egypt',
                'phone_code' => '+20',
                'currency_code' => 'EGP',
                'timezone' => 'Africa/Cairo',
                'flag_emoji' => '🇪🇬',
                'status' => 'active'
            ]
        );

        $group = CompanyGroup::create([
            'id' => (string) Str::uuid(),
            'name' => 'REDP Holding Group',
            'description' => 'Real Estate Digital Platform Holding Group',
            'status' => 'active'
        ]);

        $holdingCompany = Company::create([
            'id' => (string) Str::uuid(),
            'name' => 'REDP Holding',
            'legal_name' => 'REDP Holding SAE',
            'registration_number' => 'REG-111111',
            'tax_id' => 'TAX-222222',
            'type' => 'holding',
            'address' => 'Corporate Hub, Smart Village',
            'city' => 'Giza',
            'country_id' => $egypt->id,
            'phone' => '+20235391000',
            'email' => 'corporate@redp.com',
            'website' => 'https://redp.com',
            'status' => 'active',
            'settings' => []
        ]);

        $devCompany = Company::create([
            'id' => (string) Str::uuid(),
            'name' => 'REDP Development',
            'legal_name' => 'REDP Real Estate Development SAE',
            'registration_number' => 'REG-333333',
            'tax_id' => 'TAX-444444',
            'type' => 'subsidiary',
            'parent_company_id' => $holdingCompany->id,
            'address' => 'Cairo Festival City Business Park',
            'city' => 'Cairo',
            'country_id' => $egypt->id,
            'phone' => '+2022345678',
            'email' => 'dev@redp.com',
            'website' => 'https://dev.redp.com',
            'status' => 'active',
            'settings' => []
        ]);

        $cairoRegion = Region::create([
            'id' => (string) Str::uuid(),
            'name' => 'Cairo Greater Region',
            'code' => 'REG-CAI',
            'company_id' => $holdingCompany->id,
            'description' => 'Greater Cairo Metropolitan Area',
            'status' => 'active'
        ]);

        $mainBranch = Branch::create([
            'id' => (string) Str::uuid(),
            'name' => 'New Cairo HQ Branch',
            'code' => 'BR-NC',
            'company_id' => $holdingCompany->id,
            'country_id' => $egypt->id,
            'region_id' => $cairoRegion->id,
            'address' => 'North 90th Street',
            'city' => 'New Cairo',
            'phone' => '+20100200300',
            'email' => 'branch.nc@redp.com',
            'status' => 'active'
        ]);

        // Departments
        $boardDept = Department::create([
            'id' => (string) Str::uuid(),
            'name' => 'Executive Board Office',
            'code' => 'DEP-EX',
            'branch_id' => $mainBranch->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        $salesDept = Department::create([
            'id' => (string) Str::uuid(),
            'name' => 'Commercial Sales Division',
            'code' => 'DEP-SL',
            'branch_id' => $mainBranch->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        $financeDept = Department::create([
            'id' => (string) Str::uuid(),
            'name' => 'Financial Operations Center',
            'code' => 'DEP-FI',
            'branch_id' => $mainBranch->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        $opsDept = Department::create([
            'id' => (string) Str::uuid(),
            'name' => 'Operations & Construction',
            'code' => 'DEP-OPS',
            'branch_id' => $mainBranch->id,
            'company_id' => $devCompany->id,
            'status' => 'active'
        ]);

        $legalDept = Department::create([
            'id' => (string) Str::uuid(),
            'name' => 'Legal Affairs',
            'code' => 'DEP-LEG',
            'branch_id' => $mainBranch->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        // Teams
        $directSalesTeam = Team::create([
            'id' => (string) Str::uuid(),
            'name' => 'Direct Sales Team',
            'department_id' => $salesDept->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        $teleSalesTeam = Team::create([
            'id' => (string) Str::uuid(),
            'name' => 'Tele-Sales Team',
            'department_id' => $salesDept->id,
            'company_id' => $holdingCompany->id,
            'status' => 'active'
        ]);

        $inspectionsTeam = Team::create([
            'id' => (string) Str::uuid(),
            'name' => 'Site Handovers & QA Team',
            'department_id' => $opsDept->id,
            'company_id' => $devCompany->id,
            'status' => 'active'
        ]);

        // Positions
        $ceoPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Chief Executive Officer (CEO)',
            'code' => 'POS-CEO',
            'department_id' => $boardDept->id,
            'company_id' => $holdingCompany->id,
            'level' => 1,
            'status' => 'active'
        ]);

        $execDirPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Executive Director',
            'code' => 'POS-ED',
            'department_id' => $boardDept->id,
            'company_id' => $holdingCompany->id,
            'level' => 2,
            'status' => 'active'
        ]);

        $deptHeadPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Department Head',
            'code' => 'POS-DH',
            'company_id' => $holdingCompany->id,
            'level' => 3,
            'status' => 'active'
        ]);

        $teamLeaderPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Team Leader',
            'code' => 'POS-TL',
            'company_id' => $holdingCompany->id,
            'level' => 4,
            'status' => 'active'
        ]);

        $seniorOfficerPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Senior Officer',
            'code' => 'POS-SO',
            'company_id' => $holdingCompany->id,
            'level' => 5,
            'status' => 'active'
        ]);

        $officerPos = Position::create([
            'id' => (string) Str::uuid(),
            'title' => 'Officer Specialist',
            'code' => 'POS-OF',
            'company_id' => $holdingCompany->id,
            'level' => 6,
            'status' => 'active'
        ]);

        // ── 1. Create Core Users ──
        $admin = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Platform Administrator',
            'email' => 'admin@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999999',
            'role' => 'admin',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $boardDept->id,
            'position_id' => $ceoPos->id,
            'employee_number' => 'EMP-0001'
        ]);

        $salesAgent = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Sales Agent',
            'email' => 'sales_agent@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201001111111',
            'role' => 'sales_agent',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'team_id' => $directSalesTeam->id,
            'position_id' => $officerPos->id,
            'employee_number' => 'EMP-0004'
        ]);

        $financeOfficer = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Finance Officer',
            'email' => 'finance_officer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201002222222',
            'role' => 'finance_officer',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $financeDept->id,
            'position_id' => $seniorOfficerPos->id,
            'employee_number' => 'EMP-0006'
        ]);

        $deliverySpecialist = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Delivery Specialist',
            'email' => 'delivery_engineer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201003333333',
            'role' => 'delivery_engineer',
            'status' => 'active',
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'team_id' => $inspectionsTeam->id,
            'position_id' => $officerPos->id,
            'employee_number' => 'EMP-0008'
        ]);

        $clientUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Tarek Client',
            'email' => 'client@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201004444444',
            'role' => 'client',
            'status' => 'active',
        ]);

        $clientUser2 = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Sherif Kamal',
            'email' => 'client2@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201509998887',
            'role' => 'client',
            'status' => 'active',
        ]);

        $brokerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Ahmed Broker',
            'email' => 'broker@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201005555555',
            'role' => 'broker',
            'status' => 'active',
        ]);

        $teleSalesUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Sara TeleSales',
            'email' => 'tele_sales@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201005555511',
            'role' => 'tele_sales',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'team_id' => $teleSalesTeam->id,
            'position_id' => $officerPos->id,
            'employee_number' => 'EMP-0005'
        ]);

        $companySalesUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Karim CompanySales',
            'email' => 'company_sales@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201005555522',
            'role' => 'company_sales',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'position_id' => $deptHeadPos->id,
            'employee_number' => 'EMP-0003'
        ]);

        $brokerManagerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Broker Manager',
            'email' => 'broker_manager@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201006666666',
            'role' => 'broker_manager',
            'status' => 'active',
        ]);

        $customerServiceUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Sara CustomerService',
            'email' => 'customer_service@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201007777777',
            'role' => 'customer_service',
            'status' => 'active',
        ]);

        $technicianUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Hassan Technician',
            'email' => 'technician@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201008888888',
            'role' => 'technician',
            'status' => 'active',
        ]);

        $maintenanceManagerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Mostafa MaintenanceManager',
            'email' => 'maintenance_manager@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999998',
            'role' => 'maintenance_manager',
            'status' => 'active',
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'position_id' => $teamLeaderPos->id,
            'employee_number' => 'EMP-0009'
        ]);

        $projectManagerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Ramy ProjectManager',
            'email' => 'project_manager@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999997',
            'role' => 'project_manager',
            'status' => 'active',
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'position_id' => $deptHeadPos->id,
            'employee_number' => 'EMP-0007'
        ]);

        $legalOfficerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Sherif Legal',
            'email' => 'legal_officer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999996',
            'role' => 'legal_officer',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $legalDept->id,
            'position_id' => $seniorOfficerPos->id,
            'employee_number' => 'EMP-0010'
        ]);

        $executiveUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Executive Director',
            'email' => 'executive@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999995',
            'role' => 'executive',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $boardDept->id,
            'position_id' => $execDirPos->id,
            'employee_number' => 'EMP-0002'
        ]);

        $complianceOfficerUser = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Security Compliance',
            'email' => 'compliance_officer@redp.com',
            'password' => bcrypt('password'),
            'phone' => '+201009999994',
            'role' => 'compliance_officer',
            'status' => 'active',
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $legalDept->id,
            'position_id' => $officerPos->id,
            'employee_number' => 'EMP-0011'
        ]);

        // ── 1.1 Create Employee Hierarchy Map (CEO down to Officer) ──
        // CEO
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $admin->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $boardDept->id,
            'position_id' => $ceoPos->id,
            'employee_number' => 'EMP-0001',
            'hire_date' => '2023-01-01',
            'status' => 'active'
        ]);

        // Executive Director (reports to CEO)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $executiveUser->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $boardDept->id,
            'position_id' => $execDirPos->id,
            'direct_manager_id' => $admin->id,
            'employee_number' => 'EMP-0002',
            'hire_date' => '2023-02-15',
            'status' => 'active'
        ]);

        // Commercial Sales Division Head (reports to Executive Director)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $companySalesUser->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'position_id' => $deptHeadPos->id,
            'direct_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0003',
            'hire_date' => '2023-05-10',
            'status' => 'active'
        ]);

        // Sales Agent (reports to Commercial Sales Division Head)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $salesAgent->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'team_id' => $directSalesTeam->id,
            'position_id' => $officerPos->id,
            'direct_manager_id' => $companySalesUser->id,
            'indirect_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0004',
            'hire_date' => '2024-01-10',
            'status' => 'active'
        ]);

        // TeleSales (reports to Commercial Sales Division Head)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $teleSalesUser->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $salesDept->id,
            'team_id' => $teleSalesTeam->id,
            'position_id' => $officerPos->id,
            'direct_manager_id' => $companySalesUser->id,
            'indirect_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0005',
            'hire_date' => '2024-03-01',
            'status' => 'active'
        ]);

        // Finance Officer (reports to Executive Director)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $financeOfficer->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $financeDept->id,
            'position_id' => $seniorOfficerPos->id,
            'direct_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0006',
            'hire_date' => '2023-04-01',
            'status' => 'active'
        ]);

        // Project Manager (reports to Executive Director)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $projectManagerUser->id,
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'position_id' => $deptHeadPos->id,
            'direct_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0007',
            'hire_date' => '2023-06-01',
            'status' => 'active'
        ]);

        // Delivery Specialist (reports to Project Manager)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $deliverySpecialist->id,
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'team_id' => $inspectionsTeam->id,
            'position_id' => $officerPos->id,
            'direct_manager_id' => $projectManagerUser->id,
            'indirect_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0008',
            'hire_date' => '2024-02-15',
            'status' => 'active'
        ]);

        // Maintenance Manager (reports to Project Manager)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $maintenanceManagerUser->id,
            'company_id' => $devCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $opsDept->id,
            'position_id' => $teamLeaderPos->id,
            'direct_manager_id' => $projectManagerUser->id,
            'indirect_manager_id' => $executiveUser->id,
            'employee_number' => 'EMP-0009',
            'hire_date' => '2023-09-01',
            'status' => 'active'
        ]);

        // Legal Officer (reports to CEO)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $legalOfficerUser->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $legalDept->id,
            'position_id' => $seniorOfficerPos->id,
            'direct_manager_id' => $admin->id,
            'employee_number' => 'EMP-0010',
            'hire_date' => '2023-08-01',
            'status' => 'active'
        ]);

        // Compliance Officer (reports to Legal Officer)
        EmployeeHierarchy::create([
            'id' => (string) Str::uuid(),
            'user_id' => $complianceOfficerUser->id,
            'company_id' => $holdingCompany->id,
            'branch_id' => $mainBranch->id,
            'department_id' => $legalDept->id,
            'position_id' => $officerPos->id,
            'direct_manager_id' => $legalOfficerUser->id,
            'indirect_manager_id' => $admin->id,
            'employee_number' => 'EMP-0011',
            'hire_date' => '2024-04-01',
            'status' => 'active'
        ]);

        // ── 2. Create Real Estate Projects ──
        $patio = Project::create([
            'id' => (string) Str::uuid(),
            'name' => 'Patio Luxury Compound',
            'location' => 'New Cairo, Egypt',
            'total_units' => 45,
            'status' => 'construction',
        ]);

        $uptown = Project::create([
            'id' => (string) Str::uuid(),
            'name' => 'Uptown Residence',
            'location' => '6th of October City, Egypt',
            'total_units' => 80,
            'status' => 'planning',
        ]);

        // ── 3. Create Units for Projects ──
        $unitA = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $patio->id,
            'unit_number' => '101-A',
            'floor' => 1,
            'type' => 'Apartment',
            'price' => 4500000.00,
            'status' => 'available',
        ]);

        $unitB = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $patio->id,
            'unit_number' => '201-B',
            'floor' => 2,
            'type' => 'Penthouse',
            'price' => 8900000.00,
            'status' => 'reserved',
        ]);

        $unitC = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $uptown->id,
            'unit_number' => '12-C',
            'floor' => 3,
            'type' => 'Duplex',
            'price' => 6200000.00,
            'status' => 'available',
        ]);

        // Additional units to enrich inventory
        for ($i = 2; $i <= 8; $i++) {
            Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $patio->id,
                'unit_number' => "{$i}02-A",
                'floor' => $i,
                'type' => $i % 2 === 0 ? 'Apartment' : 'Townhouse',
                'price' => 3000000.00 + ($i * 500000),
                'status' => 'available',
            ]);
        }
        for ($i = 1; $i <= 5; $i++) {
            Unit::create([
                'id' => (string) Str::uuid(),
                'project_id' => $uptown->id,
                'unit_number' => "{$i}4-C",
                'floor' => $i,
                'type' => $i % 2 === 0 ? 'Villa' : 'Studio',
                'price' => 5000000.00 + ($i * 750000),
                'status' => 'available',
            ]);
        }

        // ── 4. Create Campaigns ──
        $campFB = Campaign::create([
            'name' => 'Q2 Luxury Penthouses FB Ads',
            'source' => 'facebook',
            'utm_source' => 'facebook_ads',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'luxury_penthouses_2026',
            'budget' => 45000.00,
            'leads_count' => 320,
            'roi_percentage' => 320.00,
        ]);

        $campGG = Campaign::create([
            'name' => 'New Administrative Capital Search',
            'source' => 'google',
            'utm_source' => 'google_search',
            'utm_medium' => 'cpc',
            'utm_campaign' => 'admin_capital_commercial',
            'budget' => 75000.00,
            'leads_count' => 540,
            'roi_percentage' => 480.00,
        ]);

        // ── 5. Create Brokers ──
        $brokerRemax = Broker::create([
            'user_id' => $brokerUser->id,
            'agency_name' => 'RE/MAX Egypt',
            'agent_name' => 'Ahmed Ali',
            'email' => 'remax@redp.com',
            'phone' => '+201001234567',
            'license_no' => 'LIC-88291',
            'status' => 'active',
            'referral_code' => 'REMAX2026',
            'user_id' => $brokerUser->id,
        ]);

        $brokerColdwell = Broker::create([
            'agency_name' => 'Coldwell Banker',
            'agent_name' => 'Omar Hassan',
            'email' => 'coldwell@redp.com',
            'phone' => '+201101234567',
            'license_no' => 'LIC-99381',
            'status' => 'active',
            'referral_code' => 'COLD2026',
        ]);

        // ── 6. Create Leads (Sales Pipeline) ──
        $lead1 = Lead::create([
            'first_name' => 'Mohamed',
            'last_name' => 'Nabil',
            'email' => 'mohamed.nabil@gmail.com',
            'phone' => '+201201112223',
            'national_id' => '29501011234567',
            'status' => 'new',
            'lead_score' => 85,
            'assigned_sales_agent_id' => $salesAgent->id,
            'tele_sales_agent_id' => $teleSalesUser->id,
            'current_tier' => 'tier_1',
            'kyc_status' => 'verified',
            'facial_match_score' => 96.50,
            'source' => 'facebook',
            'campaign_id' => $campFB->id,
        ]);

        $lead2 = Lead::create([
            'first_name' => 'Sherif',
            'last_name' => 'Kamal',
            'email' => 'sherif.kamal@yahoo.com',
            'phone' => '+201509998887',
            'national_id' => '29202021234567',
            'status' => 'interested',
            'lead_score' => 92,
            'assigned_sales_agent_id' => $salesAgent->id,
            'tele_sales_agent_id' => $teleSalesUser->id,
            'current_tier' => 'tier_1',
            'kyc_status' => 'pending',
            'facial_match_score' => 84.20,
            'source' => 'google',
            'campaign_id' => $campGG->id,
        ]);

        $lead3 = Lead::create([
            'first_name' => 'Yasmine',
            'last_name' => 'Fouad',
            'email' => 'yasmine.f@outlook.com',
            'phone' => '+201007776665',
            'national_id' => '29803031234567',
            'status' => 'negotiation',
            'lead_score' => 78,
            'assigned_sales_agent_id' => $salesAgent->id,
            'current_tier' => 'tier_2',
            'kyc_status' => 'none',
            'source' => 'broker',
            'broker_id' => $brokerRemax->id,
        ]);

        $lead4 = Lead::create([
            'first_name' => 'Karim',
            'last_name' => 'Saeed',
            'email' => 'karim.saeed@gmail.com',
            'phone' => '+201103332221',
            'national_id' => '29004041234567',
            'status' => 'reserved',
            'lead_score' => 98,
            'assigned_sales_agent_id' => $salesAgent->id,
            'kyc_status' => 'verified',
            'facial_match_score' => 98.90,
            'source' => 'facebook',
            'campaign_id' => $campFB->id,
        ]);

        // Additional 20 Leads to populate the CRM pipeline
        $names = [
            ['Tarek', 'Mansour', 'tarek@gmail.com', 'new', 'facebook', 65, 'none'],
            ['Salma', 'Ahmed', 'salma@yahoo.com', 'contacted', 'google', 72, 'pending'],
            ['Omar', 'Hassan', 'omar@gmail.com', 'interested', 'direct', 88, 'verified'],
            ['Rania', 'Kamal', 'rania@outlook.com', 'visit_scheduled', 'facebook', 90, 'verified'],
            ['Mustafa', 'Kamel', 'mustafa@gmail.com', 'negotiation', 'google', 79, 'none'],
            ['Noha', 'Fawzy', 'noha@gmail.com', 'reserved', 'direct', 95, 'verified'],
            ['Aly', 'Nasser', 'aly@company.com', 'new', 'tiktok', 55, 'none'],
            ['Khaled', 'Mostafa', 'khaled@gmail.com', 'contacted', 'facebook', 62, 'pending'],
            ['Ghada', 'Adel', 'ghada@gmail.com', 'interested', 'google', 80, 'verified'],
            ['Mona', 'Zaki', 'mona@gmail.com', 'visit_scheduled', 'direct', 85, 'verified'],
            ['Sameh', 'Hussein', 'sameh@gmail.com', 'negotiation', 'facebook', 74, 'none'],
            ['Radwa', 'Sherif', 'radwa@gmail.com', 'reserved', 'broker', 96, 'verified'],
            ['Ziad', 'Nabil', 'ziad@gmail.com', 'new', 'tiktok', 40, 'none'],
            ['Heba', 'Magdy', 'heba@gmail.com', 'contacted', 'google', 68, 'none'],
            ['Dina', 'Samir', 'dina@gmail.com', 'interested', 'facebook', 83, 'verified'],
            ['Hoda', 'Mostafa', 'hoda@gmail.com', 'visit_scheduled', 'direct', 87, 'verified'],
            ['Ibrahim', 'Saad', 'ibrahim@gmail.com', 'negotiation', 'google', 77, 'none'],
            ['Osama', 'Anwar', 'osama@gmail.com', 'new', 'facebook', 50, 'none'],
            ['Farida', 'Saeed', 'farida@gmail.com', 'contacted', 'direct', 60, 'none'],
            ['Hany', 'Fouad', 'hany@gmail.com', 'interested', 'tiktok', 70, 'pending']
        ];

        foreach ($names as $idx => $n) {
            Lead::create([
                'first_name' => $n[0],
                'last_name' => $n[1],
                'email' => $n[2],
                'phone' => '+20100' . str_pad((string)($idx + 10), 7, '0', STR_PAD_LEFT),
                'national_id' => '29' . rand(0, 9) . '0' . rand(1, 9) . rand(10, 28) . rand(1000000, 9999999),
                'status' => $n[3],
                'lead_score' => $n[4] === 'broker' ? 78 : $n[5],
                'assigned_sales_agent_id' => $salesAgent->id,
                'kyc_status' => $n[6],
                'facial_match_score' => $n[6] === 'verified' ? rand(86, 99) . '.' . rand(10, 99) : null,
                'source' => $n[4],
                'campaign_id' => $n[4] === 'facebook' ? $campFB->id : ($n[4] === 'google' ? $campGG->id : null),
                'broker_id' => $n[4] === 'broker' ? $brokerRemax->id : null,
            ]);
        }

        // ── 7. Create Interactions ──
        Interaction::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead2->id,
            'type' => 'call',
            'notes' => 'Customer inquired about commercial pricing structure in the Administrative Capital. Warm lead.',
            'follow_up_date' => now()->addDays(2),
            'logged_by' => $salesAgent->id,
        ]);

        Interaction::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead3->id,
            'type' => 'meeting',
            'notes' => 'Face-to-face walkthrough. Client expressed strong interest in Patio Luxury Compound.',
            'follow_up_date' => now()->addDays(5),
            'logged_by' => $salesAgent->id,
        ]);

        // ── 8. Create VoIP Call Logs ──
        CallLog::create([
            'id' => (string) Str::uuid(),
            'lead_id' => $lead1->id,
            'call_sid' => 'CA' . Str::random(32),
            'direction' => 'outbound',
            'duration_seconds' => 184,
            'recording_url' => 'https://s3.amazonaws.com/redp-voip/recordings/call_184s.mp3',
            'status' => 'completed',
        ]);

        // ── 9. Create Commissions ──
        Commission::create([
            'broker_id' => $brokerRemax->id,
            'lead_id' => $lead3->id,
            'unit_id' => $unitB->id,
            'rate_percent' => 2.50,
            'gross_amount' => 222500.00,
            'status' => 'pending',
        ]);

        Commission::create([
            'broker_id' => $brokerColdwell->id,
            'lead_id' => $lead4->id,
            'unit_id' => $unitA->id,
            'rate_percent' => 3.00,
            'gross_amount' => 135000.00,
            'status' => 'approved',
        ]);

        // ── 10. Create Contracts, Payment Plans & Installment Payments ──
        $contract1 = Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => 'REDP-CTR-2026-0001',
            'unit_id' => $unitA->id,
            'client_id' => $clientUser->id,
            'total_amount' => 4500000.00,
            'paid_amount' => 1500000.00,
            'type' => 'installment',
            'status' => 'active',
            'signed_at' => now()->subMonths(3),
            'notes' => 'Primary residence installment contract.',
        ]);

        $plan1 = PaymentPlan::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract1->id,
            'total_installments' => 12,
            'unpaid_installments' => 8,
            'monthly_amount' => 250000.00,
            'status' => 'active',
            'start_date' => now()->subMonths(3),
        ]);

        for ($i = 1; $i <= 12; $i++) {
            $isPaid = $i <= 4;
            Payment::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract1->id,
                'payment_plan_id' => $plan1->id,
                'amount' => 250000.00,
                'status' => $isPaid ? 'paid' : 'pending',
                'due_date' => now()->subMonths(5 - $i),
                'paid_at' => $isPaid ? now()->subMonths(5 - $i)->addDays(2) : null,
                'installment_number' => $i,
                'gateway' => $isPaid ? 'stripe' : null,
                'transaction_reference' => $isPaid ? 'TXN-' . Str::random(8) : null,
            ]);
        }

        $contract2 = Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => 'REDP-CTR-2026-0002',
            'unit_id' => $unitB->id,
            'client_id' => $clientUser2->id,
            'total_amount' => 8900000.00,
            'paid_amount' => 387500.00,
            'type' => 'installment',
            'status' => 'active',
            'signed_at' => now()->subMonths(2),
            'notes' => 'Restructured property contract.',
        ]);

        $plan2 = PaymentPlan::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract2->id,
            'total_installments' => 24,
            'unpaid_installments' => 23,
            'monthly_amount' => 354687.50,
            'status' => 'active',
            'start_date' => now()->subMonths(2),
        ]);

        for ($i = 1; $i <= 24; $i++) {
            $isPaid = $i == 1;
            Payment::create([
                'id' => (string) Str::uuid(),
                'contract_id' => $contract2->id,
                'payment_plan_id' => $plan2->id,
                'amount' => 354687.50,
                'status' => $isPaid ? 'paid' : 'pending',
                'due_date' => now()->subMonths(3 - $i),
                'paid_at' => $isPaid ? now()->subMonths(3 - $i)->addDays(5) : null,
                'installment_number' => $i,
                'gateway' => $isPaid ? 'fawry' : null,
                'transaction_reference' => $isPaid ? 'TXN-' . Str::random(8) : null,
            ]);
        }

        $contract3 = Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => 'REDP-CTR-2026-0003',
            'unit_id' => $unitC->id,
            'client_id' => $clientUser->id,
            'total_amount' => 6800000.00,
            'paid_amount' => 6800000.00,
            'type' => 'sale',
            'status' => 'completed',
            'signed_at' => now()->subMonths(6),
            'notes' => 'Cash sale contract - fully completed.',
        ]);

        $plan3 = PaymentPlan::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract3->id,
            'total_installments' => 1,
            'unpaid_installments' => 0,
            'monthly_amount' => 6800000.00,
            'status' => 'completed',
            'start_date' => now()->subMonths(6),
        ]);

        Payment::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract3->id,
            'payment_plan_id' => $plan3->id,
            'amount' => 6800000.00,
            'status' => 'paid',
            'due_date' => now()->subMonths(6),
            'paid_at' => now()->subMonths(6),
            'installment_number' => 0,
            'gateway' => 'bank_transfer',
            'transaction_reference' => 'TXN-' . Str::random(8),
        ]);

        Contract::create([
            'id' => (string) Str::uuid(),
            'contract_number' => 'REDP-CTR-2026-0004',
            'unit_id' => $unitA->id,
            'client_id' => $clientUser2->id,
            'total_amount' => 2980000.00,
            'paid_amount' => 50000.00,
            'type' => 'installment',
            'status' => 'pending_signature',
            'signed_at' => null,
            'notes' => 'Awaiting client digital signature.',
        ]);

        // ── 11. Create Collections Queue & Rescheduling Requests ──
        CollectionsQueue::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract1->id,
            'client_id' => $clientUser->id,
            'aging_bucket' => '30_days',
            'outstanding_amount' => 250000.00,
            'promise_to_pay_date' => now()->addDays(10),
            'status' => 'promised',
            'notes' => 'Customer requested a short extension due to transaction delays.',
        ]);

        CollectionsQueue::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract2->id,
            'client_id' => $clientUser2->id,
            'aging_bucket' => '60_days',
            'outstanding_amount' => 354687.50,
            'promise_to_pay_date' => null,
            'status' => 'active',
            'notes' => 'Payment overdue. Automated SMS notification and phone outreach launched.',
        ]);

        ReschedulingRequest::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract1->id,
            'reason' => 'Restructuring to 20 installments due to commercial investment changes.',
            'current_installments' => 12,
            'proposed_installments_count' => 20,
            'proposed_monthly_amount' => 150000.00,
            'status' => 'pending',
        ]);

        ReschedulingRequest::create([
            'id' => (string) Str::uuid(),
            'contract_id' => $contract2->id,
            'reason' => 'Medical emergency impacted temporary cash flow. Restructure request.',
            'current_installments' => 24,
            'proposed_installments_count' => 36,
            'proposed_monthly_amount' => 258333.33,
            'status' => 'approved',
        ]);

        // ── 12. Create Vendors, Maintenance Tickets & QC Snags ──
        $vendor1 = Vendor::create([
            'id' => (string) Str::uuid(),
            'name' => 'Arab Contractors Plumbing Co.',
            'service_type' => 'Plumbing',
            'rating' => 4.8,
            'contact_number' => '+201004445556',
        ]);

        $vendor2 = Vendor::create([
            'id' => (string) Str::uuid(),
            'name' => 'El-Swedy Electrics',
            'service_type' => 'Electrical',
            'rating' => 4.9,
            'contact_number' => '+201007778889',
        ]);

        $vendor3 = Vendor::create([
            'id' => (string) Str::uuid(),
            'name' => 'Al-Ahram Woodwork Specialists',
            'service_type' => 'Carpentry',
            'rating' => 4.5,
            'contact_number' => '+201001112223',
        ]);

        MaintenanceTicket::create([
            'id' => (string) Str::uuid(),
            'client_id' => $clientUser->id,
            'unit_id' => $unitA->id,
            'category' => 'Plumbing',
            'title' => 'Water leakage in master bathroom',
            'description' => 'Master bathroom floor tiles show moisture and wall dampness.',
            'status' => 'open',
            'priority' => 'high',
        ]);

        MaintenanceTicket::create([
            'id' => (string) Str::uuid(),
            'client_id' => $clientUser2->id,
            'unit_id' => $unitB->id,
            'category' => 'Electrical',
            'title' => 'Main circuit breaker keeps tripping',
            'description' => 'AC unit start-up causes circuit break in main electrical board.',
            'status' => 'assigned',
            'priority' => 'critical',
        ]);

        DefectsSnag::create([
            'id' => (string) Str::uuid(),
            'unit_id' => $unitA->id,
            'description' => 'Living room power outlet on east column has no current flow.',
            'severity' => 'high',
            'status' => 'pending',
        ]);

        DefectsSnag::create([
            'id' => (string) Str::uuid(),
            'unit_id' => $unitB->id,
            'description' => 'Wall plaster painting scratch in second bedroom.',
            'severity' => 'low',
            'status' => 'resolved',
        ]);

        // ── 13. Create Visual Workflows ──
        WorkflowTemplate::create([
            'id' => (string) Str::uuid(),
            'trigger_name' => 'PaymentReceived',
            'action_name' => 'SendWhatsAppNotification',
            'rules_payload' => ['payload' => 'Thank you! Q3 installment processed.'],
            'active' => true,
        ]);

        WorkflowTemplate::create([
            'id' => (string) Str::uuid(),
            'trigger_name' => 'ReservationConfirmed',
            'action_name' => 'ScheduleQCInspection',
            'rules_payload' => ['payload' => 'Handover unit check timeline.'],
            'active' => true,
        ]);

        WorkflowTemplate::create([
            'id' => (string) Str::uuid(),
            'trigger_name' => 'ContractSigned',
            'action_name' => 'GenerateHandoverTimeline',
            'rules_payload' => ['payload' => 'Timeline PDF generation.'],
            'active' => false,
        ]);
    }
}
