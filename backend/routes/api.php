<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

// ── 🟠 Acquisition Controllers (Ragab) ──
use App\Http\Controllers\Acquisition\LeadController;
use App\Http\Controllers\Acquisition\BrokerController;
use App\Http\Controllers\Acquisition\RegistrationController;
use App\Http\Controllers\Acquisition\EOIQueueController;
use App\Http\Controllers\Acquisition\CrmPipelineController;
use App\Http\Controllers\Acquisition\VoipCallController;
use App\Http\Controllers\Acquisition\SocialAdsWebhookController;

// ── 🔵 Finance Controllers (Melwany) ──
use App\Http\Controllers\Finance\InventoryController;
use App\Http\Controllers\Finance\PaymentController;

// ── 🟢 Delivery Controllers (Mahmoud) ──
use App\Http\Controllers\Delivery\ClientPortalController;
use App\Http\Controllers\Delivery\HandoverController;
use App\Http\Controllers\Delivery\VendorController;
use App\Http\Controllers\Delivery\DocumentController;
use App\Http\Controllers\Delivery\AnalyticsController;

/*
|--------------------------------------------------------------------------
| REDP API Routes
|--------------------------------------------------------------------------
| All API routes are prefixed with /api by Laravel.
| Version 1 routes are grouped under /v1 prefix.
|--------------------------------------------------------------------------
*/

// ╔══════════════════════════════════════════════════════════════════╗
// ║ 🔓 PUBLIC ROUTES — No Authentication Required                   ║
// ╚══════════════════════════════════════════════════════════════════╝

// Authentication Portal
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// ── 🟠 Public Webhooks (Acquisition - Ragab) ──
Route::prefix('v1/webhooks')->group(function () {
    // VoIP Provider Webhooks (Twilio)
    Route::post('/voip/call-status', [VoipCallController::class, 'handleCallStatus']);
    Route::post('/voip/recording-ready', [VoipCallController::class, 'handleRecordingReady']);

    // Social Ads Lead Ingestion Webhooks
    Route::post('/facebook/leads', [SocialAdsWebhookController::class, 'handleFacebookLead']);
    Route::post('/tiktok/leads', [SocialAdsWebhookController::class, 'handleTikTokLead']);
});

// ── 🟠 Public Broker Lead Registration (via referral link) ──
Route::post('/v1/brokers/register-lead', [BrokerController::class, 'registerLead']);


// ╔══════════════════════════════════════════════════════════════════╗
// ║ 🔒 PROTECTED ROUTES — Laravel Sanctum Authentication           ║
// ╚══════════════════════════════════════════════════════════════════╝

Route::middleware('auth:sanctum')->group(function () {

    // 👥 Shared User Profile & Sign Out
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ══════════════════════════════════════════════════════════
    // 🟠 ACQUISITION MODULE (Owner: Ragab)
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/acquisition')->group(function () {

        // ── Leads Management ──
        Route::get('/leads', [LeadController::class, 'index']);
        Route::post('/leads', [LeadController::class, 'store'])
            ->middleware('antifraud');
        Route::get('/leads/{id}', [LeadController::class, 'show']);
        Route::put('/leads/{id}/status', [LeadController::class, 'updateStatus']);

        // ── CRM Pipeline (Kanban Board) ──
        Route::get('/crm/pipeline', [CrmPipelineController::class, 'pipeline']);
        Route::put('/crm/move', [CrmPipelineController::class, 'moveStage']);
        Route::post('/crm/assign', [CrmPipelineController::class, 'assign']);
        Route::post('/crm/interactions', [CrmPipelineController::class, 'logInteraction']);
        Route::get('/crm/stats', [CrmPipelineController::class, 'stats']);

        // ── KYC & Facial Verification ──
        Route::post('/kyc/register', [RegistrationController::class, 'register']);
        Route::get('/kyc/pending', [RegistrationController::class, 'pendingApprovals']);
        Route::put('/kyc/{leadId}/approve', [RegistrationController::class, 'manualDecision']);

        // ── Expression of Interest Priority Queue ──
        Route::post('/eoi/submit', [EOIQueueController::class, 'submit']);
        Route::get('/eoi/queue/{projectId}', [EOIQueueController::class, 'getQueue']);
        Route::put('/eoi/{id}/confirm', [EOIQueueController::class, 'confirm']);
        Route::put('/eoi/{id}/cancel', [EOIQueueController::class, 'cancel']);

        // ── Broker Portal ──
        Route::post('/brokers/register', [BrokerController::class, 'register']);
        Route::get('/brokers/{brokerId}/commissions', [BrokerController::class, 'getCommissions']);
        Route::get('/brokers/{brokerId}/leads', [BrokerController::class, 'getLeads']);
        Route::get('/brokers/{brokerId}/referral-links', [BrokerController::class, 'getReferralLinks']);

        // ── VoIP Call Logs (Authenticated Dashboard) ──
        Route::get('/calls', [VoipCallController::class, 'index']);

        // ── Campaigns & Marketing Analytics ──
        Route::get('/campaigns', [SocialAdsWebhookController::class, 'index']);
        Route::get('/campaigns/{id}', [SocialAdsWebhookController::class, 'show']);
    });

    // ══════════════════════════════════════════════════════════
    // 🔵 FINANCIAL ENGINE (Owner: Melwany)
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/finance')->group(function () {
        Route::get('/units', [InventoryController::class, 'index']);

        Route::middleware('role:client')->group(function () {
            Route::post('/units/{id}/reserve', [InventoryController::class, 'reserveUnit']);
            Route::get('/installments', [PaymentController::class, 'getInstallments']);
            Route::post('/charge', [PaymentController::class, 'chargeInstallment']);
        });
    });

    // ══════════════════════════════════════════════════════════
    // 🟢 DELIVERY & OPERATIONS (Owner: Mahmoud)
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/delivery')->group(function () {
        Route::get('/overview', [ClientPortalController::class, 'getOverview']);
        
        // BI Dashboards and predictive Cash Flows (Admins and Delivery Engineers)
        Route::get('/analytics', [AnalyticsController::class, 'getAnalytics']);

        // Document Management Vaults (All logged-in profiles)
        Route::get('/documents', [DocumentController::class, 'getDocuments']);
        Route::post('/documents/upload', [DocumentController::class, 'uploadDocument']);

        // Visual Workflow Automation Builder (H.19)
        Route::get('/workflows', [ClientPortalController::class, 'getWorkflows']);
        Route::post('/workflows', [ClientPortalController::class, 'storeWorkflow']);

        // Homeowner compound requests (Clients and Admins)

        Route::middleware('role:client')->group(function () {
            Route::post('/gate-code', [ClientPortalController::class, 'requestGateCode']);
            Route::post('/tickets', [VendorController::class, 'storeTicket']);
        });

        Route::middleware('role:delivery_engineer')->group(function () {
            Route::get('/units/{unitId}/checklist', [HandoverController::class, 'getChecklist']);
            Route::post('/snag', [HandoverController::class, 'reportSnag']);
            Route::post('/units/{unitId}/signoff', [HandoverController::class, 'signOff']);
            
            // Contractor & vendor lists management
            Route::get('/vendors', [VendorController::class, 'getVendors']);
            Route::get('/tickets', [VendorController::class, 'getTickets']);
            Route::post('/tickets/{ticketId}/dispatch', [VendorController::class, 'dispatchTicket']);
        });
    });
});
