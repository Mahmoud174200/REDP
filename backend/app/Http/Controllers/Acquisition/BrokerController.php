<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\LeadLock;
use App\Events\Acquisition\BrokerRegistered;
use App\Services\Acquisition\AntiPoachingService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Controller: BrokerController
 * Blueprint Section: H.6 — Broker Portal & Commission Tracking
 *
 * Handles:
 * - Broker registration with referral code generation
 * - Lead registration via broker referral (anti-poaching)
 * - Commission tracking
 * - Referral link management
 * ─────────────────────────────────────────────────────────
 */
class BrokerController extends Controller
{
    private AntiPoachingService $antiPoachingService;

    public function __construct(AntiPoachingService $antiPoachingService)
    {
        $this->antiPoachingService = $antiPoachingService;
    }

    /**
     * GET /api/v1/acquisition/brokers
     * List all brokers.
     */
    public function index(Request $request): JsonResponse
    {
        $brokers = Broker::orderBy('agency_name', 'asc')->get();
        return response()->json([
            'success' => true,
            'data'    => $brokers,
        ]);
    }

    /**
     * POST /api/v1/brokers/register
     * Register a new broker and generate unique referral code.
     */
    public function register(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'agency_name' => 'required|string|max:200',
            'agent_name'  => 'required|string|max:150',
            'email'       => 'nullable|email|max:255',
            'phone'       => 'required|string|max:20',
            'license_no'  => 'nullable|string|max:50',
        ]);

        // Generate unique referral code
        $referralCode = strtoupper(Str::random(8));
        while (Broker::where('referral_code', $referralCode)->exists()) {
            $referralCode = strtoupper(Str::random(8));
        }

        $broker = Broker::create([
            'id'            => (string) Str::uuid(),
            'agency_name'   => $fields['agency_name'],
            'agent_name'    => $fields['agent_name'],
            'email'         => $fields['email'] ?? null,
            'phone'         => $fields['phone'],
            'license_no'    => $fields['license_no'] ?? null,
            'status'        => Broker::STATUS_PENDING,
            'referral_code' => $referralCode,
        ]);

        BrokerRegistered::dispatch($broker->id, $broker->referral_code);

        AuditLogService::log('BROKER_REGISTER', $request->user()?->id, [
            'broker_id'     => $broker->id,
            'referral_code' => $broker->referral_code,
        ]);

        return response()->json([
            'success'       => true,
            'message'       => 'Broker registered successfully. Pending admin approval.',
            'data'          => $broker,
            'referral_link' => $broker->referral_url,
        ], 201);
    }

    /**
     * POST /api/v1/brokers/register-lead
     * Register a lead via broker's referral link with anti-poaching lock.
     */
    public function registerLead(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'referral_code' => 'required|string|exists:brokers,referral_code',
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'required|string|max:20',
            'national_id'   => 'nullable|string|max:30',
        ]);

        $broker = Broker::where('referral_code', $fields['referral_code'])->first();

        if (!$broker || $broker->status !== Broker::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or inactive broker referral code.',
            ], 403);
        }

        try {
            $result = $this->antiPoachingService->registerBrokerLead(
                $broker,
                $fields['phone'],
                $fields['national_id'] ?? null,
                [
                    'id'         => (string) Str::uuid(),
                    'first_name' => $fields['first_name'],
                    'last_name'  => $fields['last_name'],
                    'email'      => $fields['email'] ?? null,
                ]
            );

            AuditLogService::log('BROKER_LEAD_REGISTER', $request->user()?->id, [
                'broker_id' => $broker->id,
                'lead_id'   => $result['lead']->id,
                'lock_id'   => $result['lock']->id,
            ]);

            return response()->json([
                'success'      => true,
                'message'      => "Lead registered and locked under broker '{$broker->agent_name}' for 90 days.",
                'data'         => $result['lead'],
                'lock_expires' => $result['lock']->locked_until->toDateString(),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    /**
     * GET /api/v1/brokers/{brokerId}/commissions
     * Get broker commission metrics and history.
     */
    public function getCommissions(Request $request, string $brokerId): JsonResponse
    {
        $broker = Broker::findOrFail($brokerId);

        $commissions = Commission::where('broker_id', $brokerId)
            ->with('lead:id,first_name,last_name,phone,status')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $metrics = [
            'total_commissioned'  => Commission::where('broker_id', $brokerId)->sum('gross_amount'),
            'pending_amount'      => Commission::where('broker_id', $brokerId)->pending()->sum('gross_amount'),
            'approved_amount'     => Commission::where('broker_id', $brokerId)->approved()->sum('gross_amount'),
            'paid_amount'         => Commission::where('broker_id', $brokerId)->paid()->sum('gross_amount'),
            'total_deals'         => Commission::where('broker_id', $brokerId)->count(),
        ];

        return response()->json([
            'success'     => true,
            'broker'      => $broker,
            'metrics'     => $metrics,
            'commissions' => $commissions,
        ]);
    }

    /**
     * GET /api/v1/brokers/{brokerId}/leads
     * Get leads registered under a broker with lock status.
     */
    public function getLeads(Request $request, string $brokerId): JsonResponse
    {
        $broker = Broker::findOrFail($brokerId);

        $leads = Lead::where('broker_id', $brokerId)
            ->with(['leadLocks' => fn($q) => $q->active()])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        $activeLocks = LeadLock::where('broker_id', $brokerId)
            ->active()
            ->count();

        return response()->json([
            'success'      => true,
            'broker'       => $broker,
            'active_locks' => $activeLocks,
            'leads'        => $leads,
        ]);
    }

    /**
     * GET /api/v1/brokers/{brokerId}/referral-links
     * Get all referral links for a broker.
     */
    public function getReferralLinks(string $brokerId): JsonResponse
    {
        $broker = Broker::findOrFail($brokerId);

        return response()->json([
            'success'       => true,
            'referral_code' => $broker->referral_code,
            'referral_url'  => $broker->referral_url,
            'broker_status' => $broker->status,
            'total_leads_registered' => Lead::where('broker_id', $brokerId)->count(),
            'active_locks'  => LeadLock::where('broker_id', $brokerId)->active()->count(),
        ]);
    }
}
