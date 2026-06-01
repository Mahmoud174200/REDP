<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Acquisition\LeadController;
use App\Http\Controllers\Acquisition\BrokerController;
use App\Http\Controllers\Finance\InventoryController;
use App\Http\Controllers\Finance\PaymentController;
use App\Http\Controllers\Delivery\ClientPortalController;
use App\Http\Controllers\Delivery\HandoverController;

/*
|--------------------------------------------------------------------------
| REDP API Routes
|--------------------------------------------------------------------------
*/

// 🔓 Public Authentication Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// 🔒 Protected API Routes (Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // 👥 Shared User Profile & Sign Out
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // 🟠 Acquisition Modules (Owner: Ragab)
    Route::prefix('acquisition')->group(function () {
        // Leads & KYC Management (Sales Agents and Admins)
        Route::middleware('role:sales_agent')->group(function () {
            Route::get('/leads', [LeadController::class, 'index']);
            Route::post('/leads', [LeadController::class, 'store']);
            Route::post('/leads/{id}/kyc', [LeadController::class, 'submitKyc']);
        });

        // Broker Portal Integrations (External Brokers and Admins)
        Route::middleware('role:broker')->group(function () {
            Route::get('/broker/commissions', [BrokerController::class, 'getCommissions']);
            Route::post('/broker/lock', [BrokerController::class, 'lockLead']);
        });
    });

    // 🔵 Financial Engine (Owner: Melwany)
    Route::prefix('finance')->group(function () {
        // Unit Inventory lookup is open to all logged in profiles
        Route::get('/units', [InventoryController::class, 'index']);

        // Reservations and direct purchases (Clients and Admins)
        Route::middleware('role:client')->group(function () {
            Route::post('/units/{id}/reserve', [InventoryController::class, 'reserveUnit']);
            Route::get('/installments', [PaymentController::class, 'getInstallments']);
            Route::post('/charge', [PaymentController::class, 'chargeInstallment']);
        });
    });

    // 🟢 Delivery & Compound Operations (Owner: Mahmoud)
    Route::prefix('delivery')->group(function () {
        // Compound Client Portal (Clients and Admins)
        Route::get('/overview', [ClientPortalController::class, 'getOverview']);
        Route::middleware('role:client')->group(function () {
            Route::post('/gate-code', [ClientPortalController::class, 'requestGateCode']);
        });

        // Handover snags & Quality checks (Delivery Engineers and Admins)
        Route::middleware('role:delivery_engineer')->group(function () {
            Route::get('/units/{unitId}/checklist', [HandoverController::class, 'getChecklist']);
            Route::post('/snag', [HandoverController::class, 'reportSnag']);
        });
    });
});
