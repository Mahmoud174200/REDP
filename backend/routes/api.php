<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

// ── 🟠 Acquisition Controllers ──
use App\Http\Controllers\Acquisition\LeadController;
use App\Http\Controllers\Acquisition\BrokerController;
use App\Http\Controllers\Acquisition\RegistrationController;
use App\Http\Controllers\Acquisition\EOIQueueController;
use App\Http\Controllers\Acquisition\CrmPipelineController;
use App\Http\Controllers\Acquisition\VoipCallController;
use App\Http\Controllers\Acquisition\SocialAdsWebhookController;

// ── 🔶 Tiered Sales Controllers ──
use App\Http\Controllers\Acquisition\TeleSalesController;
use App\Http\Controllers\Acquisition\BrokerSalesController;
use App\Http\Controllers\Acquisition\CompanySalesController;

// ── 🔵 Finance Controllers ──
use App\Http\Controllers\Finance\InventoryController;
use App\Http\Controllers\Finance\PaymentController;

// ── 🟢 Delivery Controllers ──
use App\Http\Controllers\Finance\ContractController;
use App\Http\Controllers\Finance\CollectionController;
use App\Http\Controllers\Delivery\ClientPortalController;
use App\Http\Controllers\Delivery\HandoverController;
use App\Http\Controllers\Delivery\VendorController;
use App\Http\Controllers\Delivery\DocumentController;
use App\Http\Controllers\Delivery\AnalyticsController;
use App\Http\Controllers\Delivery\WorkflowController;

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
Route::post('/v1/auth/register', [AuthController::class, 'register']);
Route::post('/v1/auth/login', [AuthController::class, 'login']);
Route::get('/system-info', [\App\Http\Controllers\Admin\AdminController::class, 'getPublicSystemInfo']);
Route::get('/v1/system-info', [\App\Http\Controllers\Admin\AdminController::class, 'getPublicSystemInfo']);

// 🔓 Public Payment Webhooks (no auth required)
Route::post('/finance/webhook/{gateway}', [PaymentController::class, 'webhookCallback']);

// ── 🟠 Public Webhooks (Acquisition) ──
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

Route::middleware(['auth:sanctum', 'maintenance'])->group(function () {

    // 👥 Shared User Profile & Sign Out
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/v1/auth/profile', [AuthController::class, 'profile']);
    Route::post('/v1/auth/logout', [AuthController::class, 'logout']);

    // ══════════════════════════════════════════════════════════
    // 🔶 TIERED SALES RBAC MODULE
    // ══════════════════════════════════════════════════════════

    // ── TIER 1: Tele-Sales Agent ──
    // Can: create/manage leads, schedule meetings, view basic project info
    // Cannot: see pricing, units, payment plans, or execute transactions
    Route::prefix('v1/sales/tele')
        ->middleware(['role:tele_sales', 'tier:1', 'audit.access'])
        ->group(function () {
            // Leads (own only)
            Route::get('/leads', [TeleSalesController::class, 'index']);
            Route::post('/leads', [TeleSalesController::class, 'store']);
            Route::get('/leads/{id}', [TeleSalesController::class, 'show']);
            Route::put('/leads/{id}/contact', [TeleSalesController::class, 'logContact']);
            Route::put('/leads/{id}/schedule-meeting', [TeleSalesController::class, 'scheduleMeeting']);
            Route::put('/leads/{id}/transfer', [TeleSalesController::class, 'transfer']);

            // Projects (basic info only — no pricing)
            Route::get('/projects', [TeleSalesController::class, 'listProjects']);

            // Dashboard
            Route::get('/dashboard', [TeleSalesController::class, 'dashboard']);
        });

    // ── TIER 2: Real Estate Broker ──
    // Can: view all projects/units/pricing, log presentations, escalate to sales
    // Cannot: execute transactions, see other brokers' data
    Route::prefix('v1/sales/broker')
        ->middleware(['role:broker', 'tier:2', 'audit.access'])
        ->group(function () {
            // Projects & Units (full read access with pricing)
            Route::get('/projects', [BrokerSalesController::class, 'listProjects']);
            Route::get('/projects/{projectId}/units', [BrokerSalesController::class, 'listProjectUnits']);
            Route::get('/units/{id}', [BrokerSalesController::class, 'showUnit']);
            Route::get('/payment-plans/{projectId}', [BrokerSalesController::class, 'listPaymentPlans']);

            // Leads (own broker leads only)
            Route::get('/leads', [BrokerSalesController::class, 'listLeads']);
            Route::get('/leads/{id}', [BrokerSalesController::class, 'showLead']);

            // Presentations (own only — strict isolation)
            Route::get('/presentations', [BrokerSalesController::class, 'listPresentations']);
            Route::post('/presentations', [BrokerSalesController::class, 'createPresentation']);
            Route::get('/presentations/{id}', [BrokerSalesController::class, 'showPresentation']);
            Route::put('/presentations/{id}/outcome', [BrokerSalesController::class, 'updateOutcome']);
            Route::put('/presentations/{id}/escalate', [BrokerSalesController::class, 'escalate']);

            // Dashboard
            Route::get('/dashboard', [BrokerSalesController::class, 'dashboard']);
        });

    // ── TIER 3: Company Sales Representative ──
    // Can: everything — full data access, execute transactions, modify units
    Route::prefix('v1/sales/company')
        ->middleware(['role:company_sales', 'tier:3', 'audit.access'])
        ->group(function () {
            // Leads (full access)
            Route::get('/leads', [CompanySalesController::class, 'listLeads']);
            Route::get('/leads/{id}', [CompanySalesController::class, 'showLead']);
            Route::get('/leads/{id}/journey', [CompanySalesController::class, 'getJourney']);
            Route::put('/leads/{id}/assign', [CompanySalesController::class, 'assignToSelf']);

            // Bookings (transaction execution)
            Route::post('/bookings', [CompanySalesController::class, 'createBooking']);

            // Units (full access + status management)
            Route::get('/units', [CompanySalesController::class, 'listUnits']);
            Route::put('/units/{id}/status', [CompanySalesController::class, 'updateUnitStatus']);

            // Transactions
            Route::get('/transactions', [CompanySalesController::class, 'listTransactions']);
            Route::get('/transactions/{id}', [CompanySalesController::class, 'showTransaction']);

            // Projects
            Route::get('/projects', [CompanySalesController::class, 'listProjects']);

            // Dashboard
            Route::get('/dashboard', [CompanySalesController::class, 'dashboard']);
        });

    // ══════════════════════════════════════════════════════════
    // 🟠 ACQUISITION MODULE
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
        Route::get('/brokers', [BrokerController::class, 'index']);
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
    // 🔵 FINANCIAL ENGINE
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/finance')->group(function () {
        // ── Unit Inventory (open to all logged-in users) ──
        Route::get('/units', [InventoryController::class, 'index']);
        Route::get('/units/{id}', [InventoryController::class, 'show']);
        Route::get('/stats', [InventoryController::class, 'getStats']);

        // ── Client-facing financial operations ──
        Route::middleware('role:client')->group(function () {
            Route::post('/units/{id}/reserve', [InventoryController::class, 'reserveUnit']);
            Route::post('/charge', [PaymentController::class, 'chargeInstallment']);
        });

        // ── Admin / Finance Officer operations ──
        Route::middleware('role:finance_officer')->group(function () {
            // Unit management
            Route::post('/units/{id}/release', [InventoryController::class, 'releaseUnit']);
            Route::patch('/units/{id}/pricing', [InventoryController::class, 'updatePricing']);

            // Payment management
            Route::get('/payments', [PaymentController::class, 'index']);
            Route::get('/payments/{contractId}', [PaymentController::class, 'getInstallments']);
            Route::get('/payments/{contractId}/history', [PaymentController::class, 'getPaymentHistory']);
            Route::get('/dashboard', [PaymentController::class, 'getDashboard']);

            // Collections & debt management
            Route::get('/collections', [CollectionController::class, 'getQueue']);
            Route::get('/collections/reschedules', [CollectionController::class, 'getRescheduleRequests']);
            Route::post('/collections/{id}/promise', [CollectionController::class, 'recordPromiseToPay']);
            Route::post('/reschedule/{contractId}', [CollectionController::class, 'reschedule']);
            Route::post('/reschedule/{id}/approve', [CollectionController::class, 'approveReschedule']);
            Route::post('/cancel/{contractId}', [CollectionController::class, 'processCancellation']);
            Route::get('/aging-report', [CollectionController::class, 'getAgingReport']);
        });

        // ── Legal and Contract operations (Legal Team and Finance Officer) ──
        Route::middleware('role:finance_officer,legal_officer')->group(function () {
            // Contract management
            Route::get('/contracts', [ContractController::class, 'index']);
            Route::get('/contracts/{id}', [ContractController::class, 'show']);
            Route::post('/contracts/generate/{reservationId}', [ContractController::class, 'generate']);
            Route::post('/contracts/{id}/sign', [ContractController::class, 'sign']);
            Route::post('/contracts/{id}/cancel', [ContractController::class, 'cancel']);
            Route::get('/contracts/{id}/pdf', [ContractController::class, 'downloadPdf']);
        });
    });

    // ══════════════════════════════════════════════════════════
    // 🟢 DELIVERY & OPERATIONS
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

        // Handover checklist/snags/sign-off (Delivery Engineers, Project Managers, and Technicians)
        Route::middleware('role:delivery_engineer,project_manager,technician')->group(function () {
            Route::get('/units/{unitId}/checklist', [HandoverController::class, 'getChecklist']);
            Route::post('/snag', [HandoverController::class, 'reportSnag']);
            Route::post('/units/{unitId}/signoff', [HandoverController::class, 'signOff']);
        });

        // Maintenance ticket dispatch & contractor lists (Delivery Engineers, Maintenance Managers, and Technicians)
        Route::middleware('role:delivery_engineer,maintenance_manager,technician')->group(function () {
            Route::get('/vendors', [VendorController::class, 'getVendors']);
            Route::get('/tickets', [VendorController::class, 'getTickets']);
            Route::post('/tickets/{ticketId}/dispatch', [VendorController::class, 'dispatchTicket']);

            // Workflow templates manager
            Route::get('/workflows', [WorkflowController::class, 'index']);
            Route::post('/workflows', [WorkflowController::class, 'store']);
            Route::put('/workflows/{id}/toggle', [WorkflowController::class, 'toggle']);
            Route::delete('/workflows/{id}', [WorkflowController::class, 'destroy']);
        });
    });

    // ══════════════════════════════════════════════════════════
    // 👑 SYSTEM ADMINISTRATION MODULE (Admin Only)
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/admin')->middleware('role:admin')->group(function () {
        // Users
        Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'getUsers']);
        Route::post('/users', [\App\Http\Controllers\Admin\AdminController::class, 'createUser']);
        Route::put('/users/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteUser']);
        
        // Configs
        Route::get('/configs', [\App\Http\Controllers\Admin\AdminController::class, 'getConfigs']);
        Route::post('/configs', [\App\Http\Controllers\Admin\AdminController::class, 'updateConfigs']);

        // Projects
        Route::get('/projects', [\App\Http\Controllers\Admin\AdminController::class, 'getProjects']);
        Route::post('/projects', [\App\Http\Controllers\Admin\AdminController::class, 'createProject']);
        Route::put('/projects/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateProject']);
        Route::delete('/projects/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteProject']);

        // Units
        Route::get('/units', [\App\Http\Controllers\Admin\AdminController::class, 'getUnits']);
        Route::post('/units', [\App\Http\Controllers\Admin\AdminController::class, 'createUnit']);
        Route::put('/units/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateUnit']);
        Route::delete('/units/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteUnit']);

        // Leads
        Route::get('/leads', [\App\Http\Controllers\Admin\AdminController::class, 'getLeads']);
        Route::post('/leads', [\App\Http\Controllers\Admin\AdminController::class, 'createLead']);
        Route::put('/leads/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateLead']);
        Route::delete('/leads/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteLead']);

        // Tickets
        Route::get('/tickets', [\App\Http\Controllers\Admin\AdminController::class, 'getTickets']);
        Route::post('/tickets', [\App\Http\Controllers\Admin\AdminController::class, 'createTicket']);
        Route::put('/tickets/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateTicket']);
        Route::delete('/tickets/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteTicket']);

        // Audit Logs
        Route::get('/audit-logs', [\App\Http\Controllers\Admin\AdminController::class, 'getAuditLogs']);
        Route::delete('/audit-logs', [\App\Http\Controllers\Admin\AdminController::class, 'clearAuditLogs']);

        // Upload Branding Logo/Icon
        Route::post('/upload-branding', [\App\Http\Controllers\Admin\AdminController::class, 'uploadBranding']);

        // System Health
        Route::get('/system-health', [\App\Http\Controllers\Admin\AdminController::class, 'getSystemHealth']);

        // Active Sessions
        Route::get('/active-sessions', [\App\Http\Controllers\Admin\AdminController::class, 'getActiveSessions']);
        Route::delete('/active-sessions/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'revokeSession']);
    });
});
