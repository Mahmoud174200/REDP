<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\EnterpriseRole;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Seed Permissions Catalog ──
        $permissions = [
            // Leads
            ['name' => 'lead.view', 'display_name' => 'View Leads', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.create', 'display_name' => 'Create Leads', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.edit', 'display_name' => 'Edit Leads', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.delete', 'display_name' => 'Delete Leads', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.assign', 'display_name' => 'Assign Leads', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.export', 'display_name' => 'Export Leads Data', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.import', 'display_name' => 'Import Leads Data', 'module' => 'leads', 'group_name' => 'Lead Management'],
            ['name' => 'lead.bulk_action', 'display_name' => 'Bulk Lead Actions', 'module' => 'leads', 'group_name' => 'Lead Management'],

            // Contracts
            ['name' => 'contract.view', 'display_name' => 'View Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.create', 'display_name' => 'Create Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.edit', 'display_name' => 'Edit Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.cancel', 'display_name' => 'Cancel Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.approve', 'display_name' => 'Approve Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.sign', 'display_name' => 'Sign Contracts', 'module' => 'contracts', 'group_name' => 'Contract Management'],
            ['name' => 'contract.download', 'display_name' => 'Download Contracts PDF', 'module' => 'contracts', 'group_name' => 'Contract Management'],

            // Payments
            ['name' => 'payment.view', 'display_name' => 'View Payments', 'module' => 'payments', 'group_name' => 'Finance & Payments'],
            ['name' => 'payment.create', 'display_name' => 'Record Payments', 'module' => 'payments', 'group_name' => 'Finance & Payments'],
            ['name' => 'payment.refund', 'display_name' => 'Refund Payments', 'module' => 'payments', 'group_name' => 'Finance & Payments'],
            ['name' => 'payment.approve', 'display_name' => 'Approve Payments', 'module' => 'payments', 'group_name' => 'Finance & Payments'],
            ['name' => 'payment.waive_penalty', 'display_name' => 'Waive Payment Penalties', 'module' => 'payments', 'group_name' => 'Finance & Payments'],
            ['name' => 'payment.export', 'display_name' => 'Export Financial Reports', 'module' => 'payments', 'group_name' => 'Finance & Payments'],

            // Units & Inventory
            ['name' => 'unit.view', 'display_name' => 'View Units Inventory', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.create', 'display_name' => 'Create Units', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.edit', 'display_name' => 'Edit Units', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.delete', 'display_name' => 'Delete Units', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.change_price', 'display_name' => 'Modify Unit Pricing', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.change_status', 'display_name' => 'Update Unit Status', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.reserve', 'display_name' => 'Reserve Units', 'module' => 'units', 'group_name' => 'Inventory Management'],
            ['name' => 'unit.block', 'display_name' => 'Block/Unblock Units', 'module' => 'units', 'group_name' => 'Inventory Management'],

            // Projects
            ['name' => 'project.view', 'display_name' => 'View Projects', 'module' => 'projects', 'group_name' => 'Project Management'],
            ['name' => 'project.create', 'display_name' => 'Create Projects', 'module' => 'projects', 'group_name' => 'Project Management'],
            ['name' => 'project.edit', 'display_name' => 'Edit Projects', 'module' => 'projects', 'group_name' => 'Project Management'],
            ['name' => 'project.delete', 'display_name' => 'Delete Projects', 'module' => 'projects', 'group_name' => 'Project Management'],

            // Brokers
            ['name' => 'broker.view', 'display_name' => 'View Brokers', 'module' => 'brokers', 'group_name' => 'Broker Relations'],
            ['name' => 'broker.create', 'display_name' => 'Register Brokers', 'module' => 'brokers', 'group_name' => 'Broker Relations'],
            ['name' => 'broker.edit', 'display_name' => 'Edit Broker Details', 'module' => 'brokers', 'group_name' => 'Broker Relations'],
            ['name' => 'broker.delete', 'display_name' => 'Remove Brokers', 'module' => 'brokers', 'group_name' => 'Broker Relations'],
            ['name' => 'broker.commissions', 'display_name' => 'Manage Broker Commissions', 'module' => 'brokers', 'group_name' => 'Broker Relations'],

            // Maintenance
            ['name' => 'ticket.view', 'display_name' => 'View Maintenance Tickets', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],
            ['name' => 'ticket.create', 'display_name' => 'Create Maintenance Tickets', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],
            ['name' => 'ticket.edit', 'display_name' => 'Edit Maintenance Tickets', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],
            ['name' => 'ticket.close', 'display_name' => 'Close Maintenance Tickets', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],
            ['name' => 'ticket.assign', 'display_name' => 'Assign Tickets to Contractor', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],
            ['name' => 'ticket.dispatch', 'display_name' => 'Dispatch Field Technicians', 'module' => 'maintenance', 'group_name' => 'Operations & Maintenance'],

            // Users
            ['name' => 'user.view', 'display_name' => 'View User Directory', 'module' => 'users', 'group_name' => 'User Management'],
            ['name' => 'user.create', 'display_name' => 'Create Users', 'module' => 'users', 'group_name' => 'User Management'],
            ['name' => 'user.edit', 'display_name' => 'Edit Users', 'module' => 'users', 'group_name' => 'User Management'],
            ['name' => 'user.delete', 'display_name' => 'Delete Users', 'module' => 'users', 'group_name' => 'User Management'],
            ['name' => 'user.change_role', 'display_name' => 'Modify User Roles', 'module' => 'users', 'group_name' => 'User Management'],
            ['name' => 'user.impersonate', 'display_name' => 'Impersonate User', 'module' => 'users', 'group_name' => 'User Management'],

            // System Configurations
            ['name' => 'settings.view', 'display_name' => 'View System Settings', 'module' => 'settings', 'group_name' => 'System Administration'],
            ['name' => 'settings.edit', 'display_name' => 'Edit System Settings', 'module' => 'settings', 'group_name' => 'System Administration'],
            ['name' => 'settings.system_health', 'display_name' => 'Monitor System Health', 'module' => 'settings', 'group_name' => 'System Administration'],

            // Reports & Audits
            ['name' => 'report.view', 'display_name' => 'View Business Reports', 'module' => 'reports', 'group_name' => 'Reports & Analytics'],
            ['name' => 'report.export', 'display_name' => 'Export Business Reports', 'module' => 'reports', 'group_name' => 'Reports & Analytics'],
            ['name' => 'report.schedule', 'display_name' => 'Schedule Reports Delivery', 'module' => 'reports', 'group_name' => 'Reports & Analytics'],
            ['name' => 'audit.view', 'display_name' => 'View Security Audit Logs', 'module' => 'audit', 'group_name' => 'Reports & Analytics'],
            ['name' => 'audit.export', 'display_name' => 'Export Audit Logs', 'module' => 'audit', 'group_name' => 'Reports & Analytics'],
            ['name' => 'audit.clear', 'display_name' => 'Truncate Audit Logs', 'module' => 'audit', 'group_name' => 'Reports & Analytics'],

            // Enterprise Organization
            ['name' => 'org.view', 'display_name' => 'View Organization Structure', 'module' => 'organization', 'group_name' => 'Enterprise Settings'],
            ['name' => 'org.edit', 'display_name' => 'Edit Organization details', 'module' => 'organization', 'group_name' => 'Enterprise Settings'],
            ['name' => 'org.create_branch', 'display_name' => 'Create Org Branches', 'module' => 'organization', 'group_name' => 'Enterprise Settings'],
            ['name' => 'org.create_department', 'display_name' => 'Create Org Departments', 'module' => 'organization', 'group_name' => 'Enterprise Settings'],

            // Workflow Approvals
            ['name' => 'approval.view', 'display_name' => 'View Approval Requests', 'module' => 'approvals', 'group_name' => 'Workflow Engines'],
            ['name' => 'approval.create_workflow', 'display_name' => 'Design Approval Workflows', 'module' => 'approvals', 'group_name' => 'Workflow Engines'],
            ['name' => 'approval.approve', 'display_name' => 'Approve Requests', 'module' => 'approvals', 'group_name' => 'Workflow Engines'],
            ['name' => 'approval.reject', 'display_name' => 'Reject Requests', 'module' => 'approvals', 'group_name' => 'Workflow Engines'],

            // Legal Management
            ['name' => 'legal.view', 'display_name' => 'View Legal Cases', 'module' => 'legal', 'group_name' => 'Legal Module'],
            ['name' => 'legal.create', 'display_name' => 'Register Legal Cases', 'module' => 'legal', 'group_name' => 'Legal Module'],
            ['name' => 'legal.edit', 'display_name' => 'Update Legal Cases', 'module' => 'legal', 'group_name' => 'Legal Module'],
            ['name' => 'legal.schedule_court', 'display_name' => 'Schedule Court Hearings', 'module' => 'legal', 'group_name' => 'Legal Module'],

            // ERP Accounting
            ['name' => 'accounting.view', 'display_name' => 'View General Ledgers', 'module' => 'accounting', 'group_name' => 'ERP Finance'],
            ['name' => 'accounting.create_entry', 'display_name' => 'Record Journal Entries', 'module' => 'accounting', 'group_name' => 'ERP Finance'],
            ['name' => 'accounting.approve_entry', 'display_name' => 'Approve Journal Entries', 'module' => 'accounting', 'group_name' => 'ERP Finance'],
            ['name' => 'accounting.close_period', 'display_name' => 'Close Financial Periods', 'module' => 'accounting', 'group_name' => 'ERP Finance'],

            // ERP Procurement
            ['name' => 'procurement.view', 'display_name' => 'View Purchase Orders', 'module' => 'procurement', 'group_name' => 'ERP Operations'],
            ['name' => 'procurement.create_pr', 'display_name' => 'Create Purchase Requests', 'module' => 'procurement', 'group_name' => 'ERP Operations'],
            ['name' => 'procurement.approve_po', 'display_name' => 'Approve Purchase Orders', 'module' => 'procurement', 'group_name' => 'ERP Operations'],
            ['name' => 'procurement.receive_goods', 'display_name' => 'Receive Purchased Goods', 'module' => 'procurement', 'group_name' => 'ERP Operations'],

            // ERP HR
            ['name' => 'hr.view', 'display_name' => 'View HR Dashboard', 'module' => 'hr', 'group_name' => 'ERP Human Resources'],
            ['name' => 'hr.manage_employees', 'display_name' => 'Manage Employee Hierarchy', 'module' => 'hr', 'group_name' => 'ERP Human Resources'],
            ['name' => 'hr.payroll', 'display_name' => 'Run Payroll Calculations', 'module' => 'hr', 'group_name' => 'ERP Human Resources'],
            ['name' => 'hr.attendance', 'display_name' => 'Manage Leaves & Attendance', 'module' => 'hr', 'group_name' => 'ERP Human Resources'],
        ];

        foreach ($permissions as $p) {
            $existing = Permission::where('name', $p['name'])->first();
            if ($existing) {
                $existing->update([
                    'display_name' => $p['display_name'],
                    'module' => $p['module'],
                    'group_name' => $p['group_name'],
                ]);
            } else {
                Permission::create([
                    'id' => (string) Str::uuid(),
                    'name' => $p['name'],
                    'display_name' => $p['display_name'],
                    'module' => $p['module'],
                    'group_name' => $p['group_name'],
                ]);
            }
        }

        // ── 2. Create System Roles ──
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full administrative access bypasses all authorization checks',
                'level' => 100,
                'is_system' => true,
                'perms' => [] // Admin logic bypasses explicitly
            ],
            [
                'name' => 'admin',
                'display_name' => 'System Administrator',
                'description' => 'System administrator access to configure and manage settings',
                'level' => 90,
                'is_system' => true,
                'perms' => [
                    'user.view', 'user.create', 'user.edit', 'user.delete', 'user.change_role',
                    'settings.view', 'settings.edit', 'settings.system_health',
                    'audit.view', 'audit.export', 'audit.clear',
                    'org.view', 'org.edit'
                ]
            ],
            [
                'name' => 'accountant',
                'display_name' => 'Financial Accountant',
                'description' => 'Reviews contract billing and payment transactions',
                'level' => 3,
                'is_system' => true,
                'perms' => [
                    'payment.view', 'payment.create', 'payment.refund', 'payment.approve', 'payment.waive_penalty', 'payment.export',
                    'contract.view', 'contract.create', 'contract.edit', 'contract.cancel', 'contract.approve', 'contract.sign', 'contract.download',
                    'unit.view', 'unit.change_price', 'report.view', 'accounting.view', 'accounting.create_entry'
                ]
            ],
            [
                'name' => 'sales_team',
                'display_name' => 'Sales Team Representative',
                'description' => 'Manages lead records, reservations, and customer pipeline accounts',
                'level' => 2,
                'is_system' => true,
                'perms' => [
                    'lead.view', 'lead.create', 'lead.edit', 'lead.assign', 'lead.export', 'lead.bulk_action',
                    'unit.view', 'unit.reserve', 'project.view',
                    'ticket.create', 'ticket.view', 'broker.view'
                ]
            ],
            [
                'name' => 'customer_service',
                'display_name' => 'Customer Service & Support',
                'description' => 'Handles resident service requests, logs tickets, and tracks compliance',
                'level' => 2,
                'is_system' => true,
                'perms' => [
                    'ticket.view', 'ticket.create', 'ticket.edit', 'ticket.close', 'ticket.assign',
                    'unit.view', 'report.view'
                ]
            ],
            [
                'name' => 'handover_team',
                'display_name' => 'Handover & QC Engineer',
                'description' => 'Conducts inspections, coordinates handovers, and tracks site defect lists',
                'level' => 2,
                'is_system' => true,
                'perms' => [
                    'unit.view', 'unit.change_status', 'ticket.view', 'ticket.edit', 'ticket.close',
                    'project.view', 'report.view'
                ]
            ],
            [
                'name' => 'homeowner',
                'display_name' => 'Homeowner / Client Portal',
                'description' => 'Homeowner portal access to review contracts and property status details',
                'level' => 1,
                'is_system' => true,
                'perms' => [
                    'unit.view', 'project.view'
                ]
            ],
        ];

        foreach ($roles as $r) {
            $existingRole = EnterpriseRole::where('name', $r['name'])->first();
            if ($existingRole) {
                $existingRole->update([
                    'display_name' => $r['display_name'],
                    'description' => $r['description'],
                    'level' => $r['level'],
                    'is_system' => $r['is_system'],
                    'status' => 'active',
                ]);
                $role = $existingRole;
            } else {
                $role = EnterpriseRole::create([
                    'id' => (string) Str::uuid(),
                    'name' => $r['name'],
                    'display_name' => $r['display_name'],
                    'description' => $r['description'],
                    'level' => $r['level'],
                    'is_system' => $r['is_system'],
                    'status' => 'active',
                ]);
            }

            // Sync Permissions
            if (!empty($r['perms'])) {
                $permissionIds = Permission::whereIn('name', $r['perms'])->pluck('id');
                DB::table('role_permissions')->where('role_id', $role->id)->delete();
                
                foreach ($permissionIds as $permId) {
                    DB::table('role_permissions')->insert([
                        'id' => (string) Str::uuid(),
                        'role_id' => $role->id,
                        'permission_id' => $permId,
                        'created_at' => now(),
                    ]);
                }
            }
        }

        // Establish Role Inheritance
        $adminRole = EnterpriseRole::where('name', 'admin')->first();
        $salesTeam = EnterpriseRole::where('name', 'sales_team')->first();
        if ($adminRole && $salesTeam) {
            $salesTeam->update(['parent_role_id' => $adminRole->id]);
        }

        // ── 3. Assign Default Roles to Seeder Users ──
        $roleAssignments = [
            'admin@redp.com' => 'super_admin',
            'sales_agent@redp.com' => 'sales_team',
            'finance_officer@redp.com' => 'accountant',
            'delivery_engineer@redp.com' => 'handover_team',
            'handover@redp.com' => 'handover_team',
            'broker@redp.com' => 'sales_team',
            'tele_sales@redp.com' => 'sales_team',
            'maintenance_manager@redp.com' => 'customer_service',
        ];

        foreach ($roleAssignments as $email => $roleName) {
            $user = User::where('email', $email)->first();
            $role = EnterpriseRole::where('name', $roleName)->first();

            if ($user && $role) {
                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $user->id, 'role_id' => $role->id],
                    [
                        'id' => (string) Str::uuid(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }
}
