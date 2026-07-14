<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle user registration.
     */
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string',
            'role' => 'nullable|string|in:admin,sales_agent,tele_sales,finance_officer,delivery_engineer,client,broker,company_sales,broker_manager,customer_service,technician,maintenance_manager,project_manager,legal_officer,executive,compliance_officer',
        ]);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'phone' => $fields['phone'] ?? null,
            'role' => $fields['role'] ?? 'client',
            'status' => 'active',
        ]);

        $token = $user->createToken('redp_token')->plainTextToken;

        // Secure Audit Trails
        AuditLogService::log('USER_REGISTER', $user->id, ['email' => $user->email, 'role' => $user->role]);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully.',
            'user' => $user,
            'token' => $token,
            'tier_level' => $user->getTierLevel(),
            'allowed_endpoints' => $user->getAllowedEndpoints(),
        ], 210);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Attempting email check
        $user = User::where('email', $fields['email'])->first();

        // Password verification check
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Bad credentials. Double-check email and password.'
            ], 401);
        }

        // ── Broker agency vetting gate ──
        // Brokers belonging to an unapproved / suspended agency (or whose own
        // account was deactivated) cannot sign in until an admin activates them.
        if ($user->role === 'broker' && in_array($user->status, ['pending', 'inactive', 'suspended', 'rejected'], true)) {
            $company = $user->company_id ? \App\Models\Company::find($user->company_id) : null;
            $message = match ($company?->approval_status) {
                \App\Models\Company::APPROVAL_PENDING   => 'Your broker agency registration is still pending admin review. You will be able to sign in once it is approved.',
                \App\Models\Company::APPROVAL_REJECTED  => 'Your broker agency registration was not approved. Please contact support for details.',
                \App\Models\Company::APPROVAL_SUSPENDED => 'Your broker agency account is currently suspended. Please contact support.',
                default => 'Your broker account is not active. Please contact your agency manager or support.',
            };

            return response()->json([
                'success'         => false,
                'message'         => $message,
                'approval_status' => $company?->approval_status ?? $user->status,
            ], 403);
        }

        $user->load(['company', 'department', 'team', 'position', 'employeeHierarchy.position', 'employeeHierarchy.team', 'broker']);
        $token = $user->createToken('redp_token')->plainTextToken;

        // Secure Audit Trails
        AuditLogService::log('USER_LOGIN', $user->id, ['email' => $user->email]);

        return response()->json([
            'success' => true,
            'message' => 'Welcome back, ' . $user->name,
            'user' => $user,
            'token' => $token,
            'tier_level' => $user->getTierLevel(),
            'allowed_endpoints' => $user->getAllowedEndpoints(),
        ], 200);
    }

    /**
     * Retrieve authenticated profile details.
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load(['company', 'department', 'team', 'position', 'employeeHierarchy.position', 'employeeHierarchy.team', 'broker']);
        return response()->json([
            'success' => true,
            'user' => $user,
            'tier_level' => $user->getTierLevel(),
            'allowed_endpoints' => $user->getAllowedEndpoints(),
        ], 200);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        // Deletes token references to revoke access
        $request->user()->currentAccessToken()->delete();

        // Secure Audit Trails
        AuditLogService::log('USER_LOGOUT', $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.'
        ], 200);
    }
}
