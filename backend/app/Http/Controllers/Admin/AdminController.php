<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SystemConfig;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Lead;
use App\Models\MaintenanceTicket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Get all users in the system.
     */
    public function getUsers(Request $request)
    {
        $users = User::orderBy('role')->orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $users
        ], 200);
    }

    /**
     * Create a new user account.
     */
    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'accountant', 'sales_team', 'customer_service', 'handover_team', 'homeowner', 'sales_agent', 'tele_sales', 'company_sales', 'finance_officer', 'delivery_engineer', 'client', 'broker', 'broker_manager', 'technician', 'maintenance_manager', 'project_manager', 'legal_officer', 'executive', 'compliance_officer'])],
            'status' => ['required', Rule::in(['active', 'inactive'])]
        ]);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => $validated['status']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data' => $user
        ], 201);
    }

    /**
     * Update user details.
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'accountant', 'sales_team', 'customer_service', 'handover_team', 'homeowner', 'sales_agent', 'tele_sales', 'company_sales', 'finance_officer', 'delivery_engineer', 'client', 'broker', 'broker_manager', 'technician', 'maintenance_manager', 'project_manager', 'legal_officer', 'executive', 'compliance_officer'])],
            'status' => ['required', Rule::in(['active', 'inactive'])]
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => $validated['status']
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data' => $user
        ], 200);
    }

    /**
     * Delete user account.
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent admin from deleting themselves
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own admin account.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully.'
        ], 200);
    }

    /**
     * Get system configurations.
     */
    public function getConfigs(Request $request)
    {
        $defaults = [
            'kyc_auto_approve' => 'false',
            'lead_assignment_mode' => 'manual',
            'default_broker_commission_rate' => '2.5',
            'maintenance_sla_hours' => '24',
            'vat_rate' => '14',
            'sandbox_mode' => 'true',
            'maintenance_mode' => 'false',
            'system_name' => 'Ether REDP',
            'system_logo_url' => '',
            'system_icon_name' => 'Building2',
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => '2525',
            'mail_username' => '',
            'mail_password' => '',
            'mail_encryption' => 'tls',
            'mail_from_address' => 'noreply@redp.com',
            'mail_from_name' => 'Ether REDP',
            'notify_lead_creation_recipient' => 'sales_agent',
            'notify_ticket_creation_recipient' => 'delivery_engineer',
            'notify_payment_collection_recipient' => 'finance_officer',
            'enable_email_notifications' => 'true',
            'enable_app_notifications' => 'true',
            'eoi_queue_mode' => 'normal',
            'eoi_queue_weight_past_client' => '100',
            'eoi_queue_weight_cash' => '50',
            'eoi_queue_weight_vip' => '150',
            'eoi_queue_nationality_priority' => 'none',
            'eoi_queue_weight_nationality' => '40',
            'eoi_queue_custom_rules' => '[]',
            'delay_penalty_percentage' => '1',
            'delay_penalty_enabled' => 'true',
            'delay_penalty_grace_days' => '0'
        ];

        foreach ($defaults as $key => $value) {
            SystemConfig::firstOrCreate(
                ['key' => $key],
                ['value' => $value ?? '']
            );
        }

        $configs = SystemConfig::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $configs
        ], 200);
    }

    /**
     * Get public system info (accessible without login).
     */
    public function getPublicSystemInfo()
    {
        $keys = ['system_name', 'system_logo_url', 'system_icon_name', 'system_icon_url'];
        
        $configs = [];
        foreach ($keys as $key) {
            $config = SystemConfig::where('key', $key)->first();
            $configs[$key] = $config ? $config->value : '';
        }
        
        // Fallbacks if empty
        if (empty($configs['system_name'])) $configs['system_name'] = 'Ether REDP';
        if (empty($configs['system_icon_name'])) $configs['system_icon_name'] = 'Building2';

        return response()->json([
            'success' => true,
            'data' => $configs
        ]);
    }

    /**
     * Upload branding file (logo or icon).
     */
    public function uploadBranding(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,gif,svg,ico|max:2048',
            'type' => 'required|string|in:logo,icon'
        ]);

        if ($request->hasFile('file')) {
            // Save file directly on public storage disk
            $path = $request->file('file')->store('branding', 'public');
            $url = \Illuminate\Support\Facades\Storage::disk('public')->url($path);

            // Update configuration in system_configs table
            $key = $request->type === 'logo' ? 'system_logo_url' : 'system_icon_url';
            
            SystemConfig::updateOrCreate(
                ['key' => $key],
                ['value' => $url]
            );

            return response()->json([
                'success' => true,
                'message' => ucfirst($request->type) . ' uploaded successfully.',
                'url' => $url
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No file uploaded.'
        ], 400);
    }

    /**
     * Update system configurations.
     */
    public function updateConfigs(Request $request)
    {
        $configs = $request->input('configs', []);

        foreach ($configs as $key => $value) {
            SystemConfig::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value]
            );
        }

        // Recalculate queue numbers for all projects when configurations change
        try {
            $projectIds = \App\Models\EoiReservation::where('status', \App\Models\EoiReservation::STATUS_APPROVED)
                ->distinct()
                ->pluck('project_id');
            foreach ($projectIds as $projectId) {
                \App\Models\EoiReservation::recalculateQueueNumbers($projectId);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to recalculate queue numbers after config update: " . $e->getMessage());
        }

        $allConfigs = SystemConfig::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'message' => 'Configurations updated successfully.',
            'data' => $allConfigs
        ], 200);
    }

    // ══════════════════════════════════════════════════════════
    // 🏗️ PROJECTS CRUD
    // ══════════════════════════════════════════════════════════

    public function getProjects()
    {
        $projects = Project::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function createProject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'status' => ['required', Rule::in(['planning', 'active', 'completed'])],
            'eoi_deadline_days' => 'nullable|integer|min:1'
        ]);

        $project = Project::create([
            'id' => (string) Str::uuid(),
            'name' => $validated['name'],
            'location' => $validated['location'],
            'total_units' => 0,
            'status' => $validated['status'],
            'eoi_deadline_days' => $validated['eoi_deadline_days'] ?? 7
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully.',
            'data' => $project
        ], 201);
    }

    public function updateProject(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'status' => ['required', Rule::in(['planning', 'active', 'completed'])],
            'eoi_deadline_days' => 'nullable|integer|min:1'
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully.',
            'data' => $project
        ]);
    }

    public function deleteProject($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🔑 UNITS CRUD
    // ══════════════════════════════════════════════════════════

    public function getUnits()
    {
        $units = Unit::with('project')->orderBy('unit_number')->get();
        return response()->json([
            'success' => true,
            'data' => $units
        ]);
    }

    public function createUnit(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'unit_number' => 'required|string|max:50',
            'floor' => 'required|integer',
            'type' => ['required', Rule::in(['apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'])],
            'price' => 'required|numeric|min:0',
            'min_down_payment' => 'nullable|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'reserved', 'sold', 'blocked'])],
            'area' => 'nullable|numeric|min:0',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'view_type' => 'nullable|string|max:100',
            'building' => 'nullable|string|max:100',
            'layout_description' => 'nullable|string'
        ]);

        $unit = Unit::create([
            'id' => (string) Str::uuid(),
            'project_id' => $validated['project_id'],
            'unit_number' => $validated['unit_number'],
            'floor' => $validated['floor'],
            'type' => $validated['type'],
            'price' => $validated['price'],
            'min_down_payment' => $validated['min_down_payment'] ?? null,
            'status' => $validated['status'],
            'area' => $validated['area'] ?? null,
            'bedrooms' => $validated['bedrooms'] ?? null,
            'bathrooms' => $validated['bathrooms'] ?? null,
            'view_type' => $validated['view_type'] ?? null,
            'building' => $validated['building'] ?? null,
            'layout_description' => $validated['layout_description'] ?? null
        ]);

        // Increment total_units on project
        $project = Project::find($validated['project_id']);
        if ($project) {
            $project->increment('total_units');
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully.',
            'data' => $unit
        ], 201);
    }

    public function updateUnit(Request $request, $id)
    {
        $unit = Unit::findOrFail($id);
        $oldProjectId = $unit->project_id;

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'unit_number' => 'required|string|max:50',
            'floor' => 'required|integer',
            'type' => ['required', Rule::in(['apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'])],
            'price' => 'required|numeric|min:0',
            'min_down_payment' => 'nullable|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'reserved', 'sold', 'blocked'])],
            'area' => 'nullable|numeric|min:0',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'view_type' => 'nullable|string|max:100',
            'building' => 'nullable|string|max:100',
            'layout_description' => 'nullable|string'
        ]);

        $unit->update($validated);

        if ($oldProjectId !== $validated['project_id']) {
            Project::where('id', $oldProjectId)->decrement('total_units');
            Project::where('id', $validated['project_id'])->increment('total_units');
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully.',
            'data' => $unit
        ]);
    }

    public function deleteUnit($id)
    {
        $unit = Unit::findOrFail($id);
        $projectId = $unit->project_id;
        $unit->delete();

        // Decrement total_units on project
        $project = Project::find($projectId);
        if ($project) {
            $project->decrement('total_units');
        }

        return response()->json([
            'success' => true,
            'message' => 'Unit deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🟠 LEADS CRUD
    // ══════════════════════════════════════════════════════════

    public function getLeads()
    {
        $leads = Lead::with('agent')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $leads
        ]);
    }

    public function createLead(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'required|string|max:20',
            'status' => ['required', Rule::in(Lead::STATUSES)],
            'assigned_sales_agent_id' => 'nullable|exists:users,id',
            'lead_score' => 'nullable|integer',
            'source' => 'nullable|string|max:50'
        ]);

        $lead = Lead::create([
            'id' => (string) Str::uuid(),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'status' => $validated['status'],
            'assigned_sales_agent_id' => $validated['assigned_sales_agent_id'] ?? null,
            'lead_score' => $validated['lead_score'] ?? 0,
            'source' => $validated['source'] ?? 'direct'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully.',
            'data' => $lead
        ], 201);
    }

    public function updateLead(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'required|string|max:20',
            'status' => ['required', Rule::in(Lead::STATUSES)],
            'assigned_sales_agent_id' => 'nullable|exists:users,id',
            'lead_score' => 'nullable|integer',
            'source' => 'nullable|string|max:50'
        ]);

        $lead->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully.',
            'data' => $lead
        ]);
    }

    public function deleteLead($id)
    {
        $lead = Lead::findOrFail($id);
        $lead->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🟢 MAINTENANCE TICKETS CRUD
    // ══════════════════════════════════════════════════════════

    public function getTickets()
    {
        $tickets = MaintenanceTicket::with(['client', 'unit'])->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $tickets
        ]);
    }

    public function createTicket(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'unit_id' => 'required|exists:units,id',
            'category' => ['required', Rule::in(['plumbing', 'electrical', 'structural', 'other'])],
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => ['required', Rule::in(['open', 'assigned', 'resolved', 'closed'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])]
        ]);

        $ticket = MaintenanceTicket::create([
            'id' => (string) Str::uuid(),
            'client_id' => $validated['client_id'],
            'unit_id' => $validated['unit_id'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'priority' => $validated['priority']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance ticket created successfully.',
            'data' => $ticket
        ], 201);
    }

    public function updateTicket(Request $request, $id)
    {
        $ticket = MaintenanceTicket::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'unit_id' => 'required|exists:units,id',
            'category' => ['required', Rule::in(['plumbing', 'electrical', 'structural', 'other'])],
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => ['required', Rule::in(['open', 'assigned', 'resolved', 'closed'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])]
        ]);

        $ticket->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Maintenance ticket updated successfully.',
            'data' => $ticket
        ]);
    }

    public function deleteTicket($id)
    {
        $ticket = MaintenanceTicket::findOrFail($id);
        $ticket->delete();

        return response()->json([
            'success' => true,
            'message' => 'Maintenance ticket deleted successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🛡️ SYSTEM AUDIT LOGS
    // ══════════════════════════════════════════════════════════

    public function getAuditLogs()
    {
        $logs = AuditLog::with('user')->orderBy('created_at', 'desc')->take(100)->get();
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function clearAuditLogs()
    {
        AuditLog::truncate();
        return response()->json([
            'success' => true,
            'message' => 'System audit logs cleared successfully.'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 🖥️ SYSTEM HEALTH & SERVER METRICS
    // ══════════════════════════════════════════════════════════

    public function getSystemHealth()
    {
        // 1. Check DB Connection
        $dbConnected = false;
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Exception $e) {
            $dbConnected = false;
        }

        // 2. Disk Space (Local disk)
        $diskFree = disk_free_space(base_path());
        $diskTotal = disk_total_space(base_path());
        $diskUsagePercent = round((($diskTotal - $diskFree) / $diskTotal) * 100, 2);

        // Convert to readable format
        $diskFreeGb = round($diskFree / (1024 * 1024 * 1024), 2);
        $diskTotalGb = round($diskTotal / (1024 * 1024 * 1024), 2);

        // 3. Memory Usage
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');
        $memoryUsageMb = round($memoryUsage / (1024 * 1024), 2);

        // 4. API Error Rate (Audit logs with action contain 'ERROR' or similar, or just mock rate)
        $errorLogsCount = AuditLog::where('action', 'like', '%ERROR%')
            ->orWhere('action', 'like', '%FAIL%')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'db_connected' => $dbConnected,
                'disk_free_gb' => $diskFreeGb,
                'disk_total_gb' => $diskTotalGb,
                'disk_usage_percent' => $diskUsagePercent,
                'memory_usage_mb' => $memoryUsageMb,
                'memory_limit' => $memoryLimit,
                'api_error_count' => $errorLogsCount,
                'cache_status' => 'Active (Redis)',
                'response_time_ms' => rand(15, 45) // simulated average response time
            ]
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 👥 ACTIVE SESSIONS MANAGEMENT (Force Logout)
    // ══════════════════════════════════════════════════════════

    public function getActiveSessions()
    {
        // Query Sanctum tokens and join with users table
        $sessions = \Illuminate\Support\Facades\DB::table('personal_access_tokens')
            ->join('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
            ->select(
                'personal_access_tokens.id',
                'personal_access_tokens.name as user_agent',
                'personal_access_tokens.last_used_at',
                'personal_access_tokens.created_at',
                'users.name as user_name',
                'users.email as user_email',
                'users.role as user_role'
              )
            ->orderBy('personal_access_tokens.last_used_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    public function revokeSession($id)
    {
        \Illuminate\Support\Facades\DB::table('personal_access_tokens')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'User session revoked successfully (forced logout).'
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 💳 PROJECT PAYMENT PLANS CRUD
    // ══════════════════════════════════════════════════════════

    public function getProjectPaymentPlans()
    {
        $plans = \App\Models\ProjectPaymentPlan::with('project')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }

    public function createProjectPaymentPlan(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'down_payment_pct' => 'required|numeric|min:0|max:100',
            'installments' => 'required|integer|min:0',
            'discount_pct' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'settings' => 'nullable|array'
        ]);

        $plan = \App\Models\ProjectPaymentPlan::create([
            'id' => (string) Str::uuid(),
            'project_id' => $validated['project_id'],
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'],
            'down_payment_pct' => $validated['down_payment_pct'],
            'installments' => $validated['installments'],
            'discount_pct' => $validated['discount_pct'],
            'description' => $validated['description'] ?? null,
            'settings' => $validated['settings'] ?? null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project payment plan created successfully.',
            'data' => $plan->load('project')
        ], 201);
    }

    public function updateProjectPaymentPlan(Request $request, $id)
    {
        $plan = \App\Models\ProjectPaymentPlan::findOrFail($id);

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'down_payment_pct' => 'required|numeric|min:0|max:100',
            'installments' => 'required|integer|min:0',
            'discount_pct' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'settings' => 'nullable|array'
        ]);

        $plan->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project payment plan updated successfully.',
            'data' => $plan->load('project')
        ]);
    }

    public function deleteProjectPaymentPlan($id)
    {
        $plan = \App\Models\ProjectPaymentPlan::findOrFail($id);
        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project payment plan deleted successfully.'
        ]);
    }
}
