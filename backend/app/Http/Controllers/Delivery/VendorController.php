<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\MaintenanceTicket;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VendorController extends Controller
{
    /**
     * Get registered contractors/vendors.
     * Section H.16: Lists compound contractors, contact information, and quality ratings.
     */
    public function getVendors(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'data' => Vendor::latest()->get()
        ], 200);
    }

    /**
     * Get list of compound maintenance tickets.
     */
    public function getTickets(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'data' => MaintenanceTicket::with(['client', 'unit'])->latest()->get()
        ], 200);
    }

    /**
     * Submit a homeowner maintenance ticket.
     * Section H.8: Files a new compound repair/maintenance ticket.
     */
    public function storeTicket(Request $request)
    {
        $request->validate([
            'unit_id' => 'required|uuid|exists:units,id',
            'category' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,critical'
        ]);

        $clientId = $request->user()->id;
        $ticketId = (string) Str::uuid();

        $ticket = MaintenanceTicket::create([
            'id' => $ticketId,
            'client_id' => $clientId,
            'unit_id' => $request->unit_id,
            'category' => $request->category,
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'open',
            'priority' => $request->priority,
        ]);

        AuditLogService::log(
            'MAINTENANCE_TICKET_CREATE', 
            $clientId, 
            ['ticket_id' => $ticketId, 'category' => $request->category]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Maintenance ticket submitted successfully. Dispatching alert to contractors.',
            'ticket' => $ticket
        ], 201);
    }

    /**
     * Dispatch an open ticket to a registered contractor.
     * Section H.16/H.18: Dispatches tickets, tracking contractor response times.
     */
    public function dispatchTicket(Request $request, string $ticketId)
    {
        $request->validate([
            'vendor_id' => 'required|uuid|exists:vendors,id',
        ]);

        $adminId = $request->user()->id;
        $ticket = MaintenanceTicket::findOrFail($ticketId);
        $vendor = Vendor::findOrFail($request->vendor_id);

        $ticket->update([
            'status' => 'assigned'
        ]);

        AuditLogService::log('MAINTENANCE_TICKET_DISPATCH', $adminId, [
            'ticket_id' => $ticketId,
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name
        ]);

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Maintenance ticket successfully assigned and dispatched to ' . $vendor->name . '.',
            'ticket' => $ticket,
            'sla_details' => [
                'max_response_hours' => 24, // 24 hours SLA
                'countdown_expires' => now()->addHours(24)->toIso8601String()
            ]
        ], 200);
    }
}
