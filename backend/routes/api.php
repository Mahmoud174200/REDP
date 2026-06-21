<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

// ── 🟠 Acquisition Controllers ──
use App\Http\Controllers\Acquisition\LeadController;
use App\Http\Controllers\Acquisition\BrokerController;
use App\Http\Controllers\Acquisition\RegistrationController;
use App\Http\Controllers\Acquisition\EOIQueueController;
use App\Http\Controllers\Acquisition\EoiReservationController;
use App\Http\Controllers\Acquisition\CrmPipelineController;
use App\Http\Controllers\Acquisition\VoipCallController;
use App\Http\Controllers\Acquisition\SocialAdsWebhookController;
use App\Http\Controllers\Acquisition\AppointmentController;

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

// 🔓 Public Landing Page API Routes
Route::prefix('v1/public')->group(function () {
    Route::get('/projects', [\App\Http\Controllers\PublicLandingController::class, 'getProjects']);
    Route::get('/projects/{projectId}/units', [\App\Http\Controllers\PublicLandingController::class, 'getProjectUnits']);
    Route::get('/projects/{projectId}/units-by-building', [\App\Http\Controllers\PublicLandingController::class, 'getProjectUnitsByBuilding']);
    Route::get('/projects/{projectId}/media', [\App\Http\Controllers\ProjectMediaController::class, 'getProjectMedia']);
    Route::get('/projects/{projectId}/3d-models', [\App\Http\Controllers\Tripo3DController::class, 'publicModels']);
    Route::get('/3d-models/{mediaId}/file', [\App\Http\Controllers\Tripo3DController::class, 'serveModelFile']);
    Route::get('/units/{unitId}/3d-model/file', [\App\Http\Controllers\Tripo3DController::class, 'serveUnitModelFile']);
    Route::post('/eoi/submit', [\App\Http\Controllers\PublicLandingController::class, 'submitEoi']);
    Route::post('/contact', [\App\Http\Controllers\PublicLandingController::class, 'submitContact']);
});

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
            Route::put('/leads/{id}', [TeleSalesController::class, 'update']);
            Route::put('/leads/{id}/contact', [TeleSalesController::class, 'logContact']);
            Route::put('/leads/{id}/schedule-meeting', [TeleSalesController::class, 'scheduleMeeting']);
            Route::put('/leads/{id}/transfer', [TeleSalesController::class, 'transfer']);

            // Projects (full details with units and pricing)
            Route::get('/projects', [TeleSalesController::class, 'listProjects']);
            Route::get('/projects/{projectId}', [TeleSalesController::class, 'showProject']);

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
            Route::post('/leads', [BrokerSalesController::class, 'registerLead']);
            Route::get('/leads/{id}', [BrokerSalesController::class, 'showLead']);

            // Presentations (own only — strict isolation)
            Route::get('/presentations', [BrokerSalesController::class, 'listPresentations']);
            Route::post('/presentations', [BrokerSalesController::class, 'createPresentation']);
            Route::get('/presentations/{id}', [BrokerSalesController::class, 'showPresentation']);
            Route::put('/presentations/{id}/outcome', [BrokerSalesController::class, 'updateOutcome']);
            Route::put('/presentations/{id}/escalate', [BrokerSalesController::class, 'escalate']);

            // Reservation Requests (broker holds)
            Route::get('/reservations', [BrokerSalesController::class, 'listReservations']);
            Route::post('/reservations', [BrokerSalesController::class, 'submitReservation']);
            Route::get('/reservations/{id}', [BrokerSalesController::class, 'showReservation']);

            // Payout Requests (broker invoices)
            Route::get('/payout-requests', [BrokerSalesController::class, 'listPayoutRequests']);
            Route::post('/payout-requests', [BrokerSalesController::class, 'submitPayoutRequest']);

            // Leaderboard
            Route::get('/leaderboard', [BrokerSalesController::class, 'leaderboard']);

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
            Route::post('/bookings/{id}/cancel', [CompanySalesController::class, 'cancelBooking']);

            // Units (full access + status management)
            Route::get('/units', [CompanySalesController::class, 'listUnits']);
            Route::post('/units', [CompanySalesController::class, 'storeUnit']);
            Route::put('/units/{id}', [CompanySalesController::class, 'updateUnit']);
            Route::put('/units/{id}/status', [CompanySalesController::class, 'updateUnitStatus']);

            // Transactions
            Route::get('/transactions', [CompanySalesController::class, 'listTransactions']);
            Route::get('/transactions/{id}', [CompanySalesController::class, 'showTransaction']);

            // Projects
            Route::get('/projects', [CompanySalesController::class, 'listProjects']);
            Route::put('/projects/{projectId}/phases', [CompanySalesController::class, 'updateProjectPhases']);
            Route::get('/projects/{projectId}/payment-plans', [CompanySalesController::class, 'getProjectPaymentPlans']);

            // Broker Request auditing (reservations & payout approvals)
            Route::get('/reservations', [CompanySalesController::class, 'listBrokerReservations']);
            Route::post('/reservations/{id}/approve', [CompanySalesController::class, 'approveBrokerReservation']);
            Route::post('/reservations/{id}/cancel', [CompanySalesController::class, 'cancelBrokerReservation']);

            Route::get('/payout-requests', [CompanySalesController::class, 'listPayoutRequests']);
            Route::post('/payout-requests/{id}/approve', [CompanySalesController::class, 'approvePayoutRequest']);
            Route::post('/payout-requests/{id}/reject', [CompanySalesController::class, 'rejectPayoutRequest']);

            // Dashboard
            Route::get('/dashboard', [CompanySalesController::class, 'dashboard']);

            // Resale Requests Management (from homeowners)
            $homeCtrl = \App\Http\Controllers\Delivery\HomeownerPortalController::class;
            Route::get('/resale-requests', [$homeCtrl, 'getResaleRequests']);
            Route::put('/resale-requests/{id}/review', [$homeCtrl, 'reviewResale']);
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
        Route::put('/leads/{id}/toggle-vip', [LeadController::class, 'toggleVip']);

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

        // ── EOI Reservation System (Payment Upload & Review Workflow) ──
        Route::get('/eoi-reservations/stats', [EoiReservationController::class, 'stats']);
        Route::get('/eoi-reservations', [EoiReservationController::class, 'index']);
        Route::post('/eoi-reservations', [EoiReservationController::class, 'store']);
        Route::get('/eoi-reservations/{id}', [EoiReservationController::class, 'show']);
        Route::post('/eoi-reservations/{id}/approve', [EoiReservationController::class, 'approve']);
        Route::post('/eoi-reservations/{id}/reject', [EoiReservationController::class, 'reject']);

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

        // ── Appointment Management ──
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
        Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
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
            Route::post('/payments/{id}/collect', [PaymentController::class, 'collectPayment']);
            Route::post('/payments/{id}/waive-penalty', [PaymentController::class, 'waivePenalty']);

            // Collections & debt management
            Route::get('/collections', [CollectionController::class, 'getQueue']);
            Route::get('/collections/reschedules', [CollectionController::class, 'getRescheduleRequests']);
            Route::post('/collections/{id}/promise', [CollectionController::class, 'recordPromiseToPay']);
            Route::post('/reschedule/{contractId}', [CollectionController::class, 'reschedule']);
            Route::post('/reschedule/{id}/approve', [CollectionController::class, 'approveReschedule']);
            Route::post('/cancel/{contractId}', [CollectionController::class, 'processCancellation']);
            Route::get('/aging-report', [CollectionController::class, 'getAgingReport']);
            Route::get('/reserved-units', [ContractController::class, 'getReservedUnits']);
        });

        // ── Legal and Contract operations (Legal Team, Finance Officer, and Company Sales Rep) ──
        Route::middleware('role:finance_officer,legal_officer,company_sales')->group(function () {
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

            // ── Homeowner Portal (H.9) ──
            $homeCtrl = \App\Http\Controllers\Delivery\HomeownerPortalController::class;
            Route::get('/homeowner/dashboard', [$homeCtrl, 'getDashboard']);

            // Family Members
            Route::post('/homeowner/family', [$homeCtrl, 'addFamilyMember']);
            Route::delete('/homeowner/family/{id}', [$homeCtrl, 'removeFamilyMember']);

            // Vehicles
            Route::post('/homeowner/vehicles', [$homeCtrl, 'addVehicle']);
            Route::delete('/homeowner/vehicles/{id}', [$homeCtrl, 'removeVehicle']);

            // Service Requests (electrician, plumber, etc.)
            Route::post('/homeowner/service-requests', [$homeCtrl, 'createServiceRequest']);

            // Resale
            Route::post('/homeowner/resale', [$homeCtrl, 'requestResale']);
            Route::post('/homeowner/resale/{id}/cancel', [$homeCtrl, 'cancelResale']);
        });

        // Handover checklist/snags/sign-off (Delivery Engineers, Project Managers, and Technicians)
        Route::middleware('role:handover_officer,delivery_engineer,project_manager,technician')->group(function () {
            Route::get('/units/{unitId}/checklist', [HandoverController::class, 'getChecklist']);
            Route::post('/snag', [HandoverController::class, 'reportSnag']);
            Route::post('/units/{unitId}/signoff', [HandoverController::class, 'signOff']);
            Route::put('/units/{unitId}/handover-date', [HandoverController::class, 'updateHandoverDate']);
            Route::put('/projects/{projectId}/delivery-date', [HandoverController::class, 'updateDeliveryDate']);
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

        // Project Payment Plans CRUD
        Route::get('/project-payment-plans', [\App\Http\Controllers\Admin\AdminController::class, 'getProjectPaymentPlans']);
        Route::post('/project-payment-plans', [\App\Http\Controllers\Admin\AdminController::class, 'createProjectPaymentPlan']);
        Route::put('/project-payment-plans/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'updateProjectPaymentPlan']);
        Route::delete('/project-payment-plans/{id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteProjectPaymentPlan']);

        // Project Media Upload (Images at all levels)
        $mediaCtrl = \App\Http\Controllers\ProjectMediaController::class;
        Route::post('/projects/{projectId}/image', [$mediaCtrl, 'uploadProjectImage']);
        Route::post('/projects/{projectId}/building-image', [$mediaCtrl, 'uploadBuildingImage']);
        Route::post('/projects/{projectId}/floor-plan-image', [$mediaCtrl, 'uploadFloorPlanImage']);
        Route::post('/units/{unitId}/image', [$mediaCtrl, 'uploadUnitImage']);

        // ── Tripo AI 3D Model Generation ──
        $tripoCtrl = \App\Http\Controllers\Tripo3DController::class;
        Route::post('/projects/{projectId}/generate-3d', [$tripoCtrl, 'generate']);
        Route::get('/projects/{projectId}/3d-status', [$tripoCtrl, 'status']);
        Route::delete('/3d-models/{mediaId}', [$tripoCtrl, 'deleteModel']);
        Route::post('/3d-models/{mediaId}/regenerate', [$tripoCtrl, 'regenerate']);
        Route::post('/3d-models/{mediaId}/copy-from', [$tripoCtrl, 'copyModel']);

        // Floor Units Configuration
        Route::post('/projects/{projectId}/setup-building', [$mediaCtrl, 'setupBuilding']);
        Route::post('/projects/{projectId}/buildings/{buildingName}/floors/{floorNum}/setup-units', [$mediaCtrl, 'setupUnitsForFloor']);

        // Unit 3D Model Generation
        Route::post('/units/{unitId}/generate-3d', [$tripoCtrl, 'generateUnit3D']);
        Route::post('/units/{unitId}/regenerate-3d', [$tripoCtrl, 'regenerateUnit3D']);
        Route::delete('/units/{unitId}/3d-model', [$tripoCtrl, 'deleteUnit3D']);
        Route::post('/units/{unitId}/copy-3d-from', [$tripoCtrl, 'copyUnit3D']);
        Route::post('/units/{unitId}/upload-3d-model', [$tripoCtrl, 'uploadCustomUnit3DModel']);

        // ── Master Plan Module ──
        $mpCtrl = \App\Http\Controllers\Admin\MasterPlanController::class;

        // Master Plan Overview & Land Info
        Route::get('/projects/{projectId}/master-plan', [$mpCtrl, 'getMasterPlan']);
        Route::put('/projects/{projectId}/master-plan/land', [$mpCtrl, 'updateLandInfo']);
        Route::get('/projects/{projectId}/master-plan/summary', [$mpCtrl, 'getSummary']);

        // Buildings CRUD
        Route::get('/projects/{projectId}/buildings', [$mpCtrl, 'getBuildings']);
        Route::post('/projects/{projectId}/buildings', [$mpCtrl, 'createBuilding']);
        Route::put('/projects/{projectId}/buildings/{buildingId}', [$mpCtrl, 'updateBuilding']);
        Route::delete('/projects/{projectId}/buildings/{buildingId}', [$mpCtrl, 'deleteBuilding']);

        // Building Floors CRUD
        Route::get('/buildings/{buildingId}/floors', [$mpCtrl, 'getFloors']);
        Route::post('/buildings/{buildingId}/floors', [$mpCtrl, 'createFloor']);
        Route::put('/buildings/{buildingId}/floors/{floorId}', [$mpCtrl, 'updateFloor']);
        Route::delete('/buildings/{buildingId}/floors/{floorId}', [$mpCtrl, 'deleteFloor']);

        // Auto-generate units for a floor
        Route::post('/buildings/{buildingId}/floors/{floorId}/generate-units', [$mpCtrl, 'generateUnitsForFloor']);

        // Individual Units CRUD (detailed, for Master Plan)
        Route::post('/master-plan/buildings/{buildingId}/floors/{floorId}/units', [$mpCtrl, 'createSingleUnit']);
        Route::put('/master-plan/units/{unitId}', [$mpCtrl, 'updateSingleUnit']);
        Route::delete('/master-plan/units/{unitId}', [$mpCtrl, 'deleteSingleUnit']);

        // Project Amenities CRUD
        Route::get('/projects/{projectId}/amenities', [$mpCtrl, 'getAmenities']);
        Route::post('/projects/{projectId}/amenities', [$mpCtrl, 'createAmenity']);
        Route::put('/projects/{projectId}/amenities/{amenityId}', [$mpCtrl, 'updateAmenity']);
        Route::delete('/projects/{projectId}/amenities/{amenityId}', [$mpCtrl, 'deleteAmenity']);
    });

    // ══════════════════════════════════════════════════════════
    // 🏢 ENTERPRISE ORGANIZATION MODULE
    // ══════════════════════════════════════════════════════════
    Route::prefix('v1/enterprise')->group(function () {
        $orgCtrl = \App\Http\Controllers\Enterprise\OrganizationController::class;

        // Countries (read for all, write for admin)
        Route::get('/countries', [$orgCtrl, 'getCountries']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/countries', [$orgCtrl, 'createCountry']);
            Route::put('/countries/{id}', [$orgCtrl, 'updateCountry']);
        });

        // Companies
        Route::get('/companies', [$orgCtrl, 'getCompanies']);
        Route::get('/companies/tree', [$orgCtrl, 'getCompanyTree']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/companies', [$orgCtrl, 'createCompany']);
            Route::put('/companies/{id}', [$orgCtrl, 'updateCompany']);
            Route::delete('/companies/{id}', [$orgCtrl, 'deleteCompany']);
        });

        // Company Groups
        Route::get('/company-groups', [$orgCtrl, 'getCompanyGroups']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/company-groups', [$orgCtrl, 'createCompanyGroup']);
            Route::put('/company-groups/{id}', [$orgCtrl, 'updateCompanyGroup']);
            Route::delete('/company-groups/{id}', [$orgCtrl, 'deleteCompanyGroup']);
        });

        // Regions
        Route::get('/regions', [$orgCtrl, 'getRegions']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/regions', [$orgCtrl, 'createRegion']);
            Route::put('/regions/{id}', [$orgCtrl, 'updateRegion']);
            Route::delete('/regions/{id}', [$orgCtrl, 'deleteRegion']);
        });

        // Branches
        Route::get('/branches', [$orgCtrl, 'getBranches']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/branches', [$orgCtrl, 'createBranch']);
            Route::put('/branches/{id}', [$orgCtrl, 'updateBranch']);
            Route::delete('/branches/{id}', [$orgCtrl, 'deleteBranch']);
        });

        // Departments
        Route::get('/departments', [$orgCtrl, 'getDepartments']);
        Route::get('/departments/tree', [$orgCtrl, 'getDepartmentTree']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/departments', [$orgCtrl, 'createDepartment']);
            Route::put('/departments/{id}', [$orgCtrl, 'updateDepartment']);
            Route::delete('/departments/{id}', [$orgCtrl, 'deleteDepartment']);
        });

        // Teams
        Route::get('/teams', [$orgCtrl, 'getTeams']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/teams', [$orgCtrl, 'createTeam']);
            Route::put('/teams/{id}', [$orgCtrl, 'updateTeam']);
            Route::delete('/teams/{id}', [$orgCtrl, 'deleteTeam']);
        });

        // Positions
        Route::get('/positions', [$orgCtrl, 'getPositions']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/positions', [$orgCtrl, 'createPosition']);
            Route::put('/positions/{id}', [$orgCtrl, 'updatePosition']);
            Route::delete('/positions/{id}', [$orgCtrl, 'deletePosition']);
        });

        // Employee Hierarchy & Org Chart
        Route::get('/hierarchy', [$orgCtrl, 'getHierarchy']);
        Route::get('/org-chart', [$orgCtrl, 'getOrgChart']);
        Route::get('/reporting/{userId}', [$orgCtrl, 'getReportingStructure']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/hierarchy/assign', [$orgCtrl, 'assignToHierarchy']);
            Route::post('/hierarchy/transfer', [$orgCtrl, 'transferEmployee']);
        });

        // Delegations
        Route::get('/delegations', [$orgCtrl, 'getDelegations']);
        Route::middleware('role:admin')->group(function () use ($orgCtrl) {
            Route::post('/delegations', [$orgCtrl, 'createDelegation']);
            Route::post('/delegations/{id}/revoke', [$orgCtrl, 'revokeDelegation']);
        });

        // ── Advanced RBAC Engine ──
        $rbacCtrl = \App\Http\Controllers\Enterprise\RbacController::class;
        Route::get('/permissions', [$rbacCtrl, 'getPermissions']);
        Route::get('/roles', [$rbacCtrl, 'getRoles']);
        Route::get('/permission-templates', [$rbacCtrl, 'getTemplates']);

        Route::middleware('role:admin')->group(function () use ($rbacCtrl) {
            // Roles CRUD
            Route::post('/roles', [$rbacCtrl, 'createRole']);
            Route::put('/roles/{id}', [$rbacCtrl, 'updateRole']);
            Route::delete('/roles/{id}', [$rbacCtrl, 'deleteRole']);

            // Role Permissions
            Route::get('/roles/{roleId}/permissions', [$rbacCtrl, 'getRolePermissions']);
            Route::post('/roles/{roleId}/permissions', [$rbacCtrl, 'assignRolePermissions']);
            Route::post('/roles/{roleId}/apply-template', [$rbacCtrl, 'applyTemplateToRole']);

            // Templates CRUD
            Route::post('/permission-templates', [$rbacCtrl, 'createTemplate']);

            // User Assignment
            Route::get('/users/{userId}/permissions', [$rbacCtrl, 'getUserPermissions']);
            Route::post('/users/{userId}/roles', [$rbacCtrl, 'assignUserRole']);
            Route::delete('/users/{userId}/roles', [$rbacCtrl, 'removeUserRole']);
            Route::post('/users/{userId}/permissions/override', [$rbacCtrl, 'overrideUserPermission']);
            Route::delete('/users/{userId}/permissions/{permissionId}/override', [$rbacCtrl, 'revokeUserPermissionOverride']);
        });

        // ── Approval Workflow Engine ──
        $wfCtrl = \App\Http\Controllers\Enterprise\ApprovalWorkflowController::class;
        $apprCtrl = \App\Http\Controllers\Enterprise\ApprovalController::class;

        // Requester/Approver Inbox & Actions (available to authenticated users)
        Route::get('/approvals/inbox', [$apprCtrl, 'getInbox']);
        Route::post('/approvals/{id}/action', [$apprCtrl, 'submitDecision']);
        Route::get('/approvals/history', [$apprCtrl, 'getHistory']);
        Route::post('/approvals/test-initiate', [$apprCtrl, 'initiateTestApproval']);

        // Workflow Designer (Admin only)
        Route::get('/approval-workflows/entity-types', [$wfCtrl, 'getEntityTypes']);
        Route::get('/approval-workflows', [$wfCtrl, 'index']);
        Route::middleware('role:admin')->group(function () use ($wfCtrl) {
            Route::post('/approval-workflows', [$wfCtrl, 'store']);
            Route::put('/approval-workflows/{id}', [$wfCtrl, 'update']);
            Route::delete('/approval-workflows/{id}', [$wfCtrl, 'destroy']);
        });

        // ── Legal Management Module ──
        $legalCtrl = \App\Http\Controllers\Enterprise\LegalController::class;
        Route::get('/legal/dashboard', [$legalCtrl, 'getDashboard']);
        Route::get('/legal/cases', [$legalCtrl, 'index']);
        Route::post('/legal/cases', [$legalCtrl, 'store']);
        Route::get('/legal/cases/{id}', [$legalCtrl, 'show']);
        Route::put('/legal/cases/{id}', [$legalCtrl, 'update']);
        Route::post('/legal/cases/{id}/sessions', [$legalCtrl, 'addSession']);
        Route::put('/legal/cases/{id}/sessions/{sessionId}', [$legalCtrl, 'updateSession']);
        Route::post('/legal/cases/{id}/actions', [$legalCtrl, 'addAction']);
        Route::put('/legal/cases/{id}/actions/{actionId}/complete', [$legalCtrl, 'completeAction']);
        Route::post('/legal/cases/{id}/documents', [$legalCtrl, 'addDocument']);

        // ── Customer 360 View ──
        $c360Ctrl = \App\Http\Controllers\Enterprise\Customer360Controller::class;
        Route::get('/customer360/search', [$c360Ctrl, 'search']);
        Route::get('/customer360/{id}', [$c360Ctrl, 'show']);

        // ── Task & Work Management ──
        $taskCtrl = \App\Http\Controllers\Enterprise\TaskController::class;
        Route::get('/tasks', [$taskCtrl, 'index']);
        Route::post('/tasks', [$taskCtrl, 'store']);
        Route::get('/tasks/{id}', [$taskCtrl, 'show']);
        Route::put('/tasks/{id}', [$taskCtrl, 'update']);
        Route::delete('/tasks/{id}', [$taskCtrl, 'destroy']);
        Route::post('/tasks/{id}/comments', [$taskCtrl, 'addComment']);
        Route::post('/tasks/{id}/attachments', [$taskCtrl, 'addAttachment']);
        Route::post('/tasks/{id}/checklists', [$taskCtrl, 'addChecklistItem']);
        Route::put('/tasks/{id}/checklists/{itemId}', [$taskCtrl, 'toggleChecklistItem']);
        Route::post('/tasks/{id}/dependencies', [$taskCtrl, 'addDependency']);

        // ── Omnichannel Communication Hub ──
        $omniCtrl = \App\Http\Controllers\Enterprise\OmnichannelController::class;
        Route::get('/omnichannel/conversations', [$omniCtrl, 'getConversations']);
        Route::post('/omnichannel/conversations', [$omniCtrl, 'storeConversation']);
        Route::get('/omnichannel/conversations/{id}/messages', [$omniCtrl, 'getMessages']);
        Route::post('/omnichannel/conversations/{id}/messages', [$omniCtrl, 'sendMessage']);
        Route::get('/omnichannel/templates', [$omniCtrl, 'getTemplates']);
        Route::post('/omnichannel/receive-mock', [$omniCtrl, 'receiveMockMessage']);

        // ── Enterprise Audit System ──
        $auditCtrl = \App\Http\Controllers\Enterprise\EnterpriseAuditController::class;
        Route::get('/audit/logs', [$auditCtrl, 'index']);
        Route::get('/audit/logs/summary', [$auditCtrl, 'summary']);
        Route::get('/audit/logs/{id}', [$auditCtrl, 'show']);

        // ── Full Accounting ERP ──
        $accCtrl = \App\Http\Controllers\Enterprise\AccountingController::class;
        Route::get('/accounting/accounts', [$accCtrl, 'getAccounts']);
        Route::post('/accounting/accounts', [$accCtrl, 'createAccount']);
        Route::get('/accounting/cost-centers', [$accCtrl, 'getCostCenters']);
        Route::post('/accounting/cost-centers', [$accCtrl, 'createCostCenter']);
        Route::get('/accounting/profit-centers', [$accCtrl, 'getProfitCenters']);
        Route::post('/accounting/profit-centers', [$accCtrl, 'createProfitCenter']);
        Route::get('/accounting/entries', [$accCtrl, 'getJournalEntries']);
        Route::post('/accounting/entries', [$accCtrl, 'createJournalEntry']);
        Route::post('/accounting/entries/{id}/post', [$accCtrl, 'postJournalEntry']);
        Route::get('/accounting/reports', [$accCtrl, 'getReports']);
        Route::get('/accounting/budgets', [$accCtrl, 'getBudgets']);
        Route::post('/accounting/budgets', [$accCtrl, 'createBudget']);

        // ── Procurement & Vendor Management ──
        $procCtrl = \App\Http\Controllers\Enterprise\ProcurementController::class;
        Route::get('/procurement/requests', [$procCtrl, 'getPurchaseRequests']);
        Route::post('/procurement/requests', [$procCtrl, 'createPurchaseRequest']);
        Route::get('/procurement/requests/{id}', [$procCtrl, 'showPurchaseRequest']);
        Route::put('/procurement/requests/{id}', [$procCtrl, 'updatePurchaseRequest']);
        Route::post('/procurement/requests/{id}/submit-approval', [$procCtrl, 'submitPRApproval']);

        Route::get('/procurement/rfqs', [$procCtrl, 'getRFQs']);
        Route::post('/procurement/rfqs', [$procCtrl, 'createRFQ']);
        Route::get('/procurement/rfqs/{id}', [$procCtrl, 'showRFQ']);
        Route::post('/procurement/rfqs/{id}/quotations', [$procCtrl, 'submitVendorQuotation']);
        Route::get('/procurement/rfqs/{id}/quotations', [$procCtrl, 'getRFQQuotations']);
        Route::put('/procurement/quotations/{id}/status', [$procCtrl, 'updateQuotationStatus']);

        Route::get('/procurement/orders', [$procCtrl, 'getPurchaseOrders']);
        Route::post('/procurement/orders', [$procCtrl, 'createPurchaseOrder']);
        Route::get('/procurement/orders/{id}', [$procCtrl, 'showPurchaseOrder']);
        Route::post('/procurement/orders/{id}/submit-approval', [$procCtrl, 'submitPOApproval']);

        Route::get('/procurement/receipts', [$procCtrl, 'getGoodsReceipts']);
        Route::post('/procurement/receipts', [$procCtrl, 'createGoodsReceipt']);
        Route::get('/procurement/receipts/{id}', [$procCtrl, 'showGoodsReceipt']);

        Route::get('/procurement/invoices', [$procCtrl, 'getVendorInvoices']);
        Route::post('/procurement/invoices', [$procCtrl, 'createVendorInvoice']);
        Route::get('/procurement/invoices/{id}', [$procCtrl, 'showVendorInvoice']);
        Route::post('/procurement/invoices/{id}/match', [$procCtrl, 'matchInvoice']);

        // ── Commission Engine ──
        $commCtrl = \App\Http\Controllers\Enterprise\CommissionController::class;
        Route::get('/commissions/rules', [$commCtrl, 'getRules']);
        Route::post('/commissions/rules', [$commCtrl, 'createRule']);
        Route::put('/commissions/rules/{id}', [$commCtrl, 'updateRule']);
        Route::delete('/commissions/rules/{id}', [$commCtrl, 'deleteRule']);
        Route::get('/commissions/calculations', [$commCtrl, 'getCalculations']);
        Route::get('/commissions/payouts', [$commCtrl, 'getPayouts']);
        Route::post('/commissions/payouts', [$commCtrl, 'createPayoutBatch']);
        Route::post('/commissions/payouts/{id}/pay', [$commCtrl, 'payOut']);

        // ── AI Layer ──
        $aiCtrl = \App\Http\Controllers\Enterprise\AiController::class;
        Route::post('/ai/lead-score/{lead}', [$aiCtrl, 'scoreLead']);
        Route::get('/ai/sales-forecast', [$aiCtrl, 'salesForecast']);
        Route::post('/ai/collection-risk/{payment}', [$aiCtrl, 'predictCollectionRisk']);
        Route::post('/ai/chat', [$aiCtrl, 'chat']);
        Route::post('/ai/chat/clear', [$aiCtrl, 'clearChat']);
        Route::get('/ai/predictions', [$aiCtrl, 'getPredictions']);

        // ── Enterprise Data Platform ──
        $dpCtrl = \App\Http\Controllers\Enterprise\DataPlatformController::class;
        Route::get('/kpis', [$dpCtrl, 'getKpis']);
        Route::get('/dashboards/{roleType}', [$dpCtrl, 'getDashboard']);
        Route::post('/kpis/recalculate', [$dpCtrl, 'recalculateKpis']);
        Route::get('/dashboards/export', [$dpCtrl, 'exportDashboardData']);

        // ── Multi-Tenant SaaS ──
        $tenantCtrl = \App\Http\Controllers\Enterprise\TenantController::class;
        Route::get('/tenants', [$tenantCtrl, 'index']);
        Route::post('/tenants/register', [$tenantCtrl, 'register']);
        Route::put('/tenants/branding', [$tenantCtrl, 'updateBranding']);
        Route::get('/tenants/quotas', [$tenantCtrl, 'getQuotas']);

        // ── Globalization & Multi-Currency ──
        $globCtrl = \App\Http\Controllers\Enterprise\GlobalizationController::class;
        Route::get('/currencies', [$globCtrl, 'getCurrencies']);
        Route::get('/currencies/rates', [$globCtrl, 'getExchangeRates']);
        Route::post('/currencies/rates/sync', [$globCtrl, 'syncExchangeRates']);
        Route::get('/translations/{locale}', [$globCtrl, 'getTranslations']);
        Route::post('/translations', [$globCtrl, 'saveTranslation']);

        // ── Project & Construction Management ──
        $constCtrl = \App\Http\Controllers\Enterprise\ConstructionController::class;
        Route::get('/construction/phases', [$constCtrl, 'getPhases']);
        Route::get('/construction/milestones', [$constCtrl, 'getMilestones']);
        Route::post('/construction/phases', [$constCtrl, 'createPhase']);
        Route::put('/construction/milestones/{id}/progress', [$constCtrl, 'updateMilestone']);
        Route::get('/construction/boq', [$constCtrl, 'getBoq']);
        Route::post('/construction/resources', [$constCtrl, 'createResource']);

        // ── Quality Management ──
        $qualCtrl = \App\Http\Controllers\Enterprise\QualityController::class;
        Route::get('/quality/inspections', [$qualCtrl, 'getInspections']);
        Route::post('/quality/inspections', [$qualCtrl, 'createInspection']);
        Route::get('/quality/ncrs', [$qualCtrl, 'getNcrs']);
        Route::post('/quality/ncrs/{id}/resolve', [$qualCtrl, 'resolveNcr']);
        Route::post('/quality/capa', [$qualCtrl, 'createCapa']);
    });
});



