<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Unit;
use App\Models\Payment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /**
     * Broadcast a project update to all owners of units in the project.
     */
    public function broadcastUpdate(Request $request)
    {
        $request->validate([
            'project_id' => 'required|string|exists:projects,id',
            'message' => 'required|string',
            'channels' => 'required|array',
            'channels.*' => 'string|in:email,sms,whatsapp',
        ]);

        $project = Project::findOrFail($request->project_id);
        $message = $request->message;
        $channels = $request->channels;

        // Get all sold or reserved units in the project
        $units = Unit::where('project_id', $project->id)
            ->whereIn('status', ['sold', 'reserved'])
            ->get();

        $clientIds = [];
        
        // Load active contracts / reservations to find clients
        foreach ($units as $unit) {
            $contract = \App\Models\Contract::where('unit_id', $unit->id)
                ->whereIn('status', ['active', 'pending_signature'])
                ->first();
            if ($contract && $contract->client_id) {
                $clientIds[] = $contract->client_id;
            } else {
                $res = \App\Models\Reservation::where('unit_id', $unit->id)
                    ->where('status', 'confirmed')
                    ->first();
                if ($res && $res->client_id) {
                    $clientIds[] = $res->client_id;
                }
            }
        }

        $clientIds = array_unique($clientIds);
        $clients = User::whereIn('id', $clientIds)->get();

        $sentCount = 0;
        foreach ($clients as $client) {
            foreach ($channels as $channel) {
                $recipient = $channel === 'email' ? $client->email : ($client->phone ?: 'unknown');
                NotificationService::sendTemplate(
                    $client->id,
                    $channel,
                    $recipient,
                    'project_broadcast',
                    [
                        'project_name' => $project->name,
                        'message' => $message
                    ]
                );
                $sentCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully broadcasted update to {$sentCount} endpoints.",
            'recipients_count' => count($clients)
        ]);
    }

    /**
     * Run scan of due and overdue installments to trigger alert dispatches.
     */
    public function runScheduleCheckups(Request $request)
    {
        // 1. Scan for upcoming payments in next 7 days
        $upcomingPayments = Payment::where('status', '!=', 'paid')
            ->whereBetween('due_date', [now(), now()->addDays(7)])
            ->with(['contract.client', 'contract.unit'])
            ->get();

        $upcomingSent = 0;
        foreach ($upcomingPayments as $payment) {
            $client = $payment->contract?->client;
            $unit = $payment->contract?->unit;
            if ($client && $unit) {
                // Send SMS, WhatsApp, and Email based on active configs
                $channels = ['email', 'whatsapp']; // default notification channels
                foreach ($channels as $channel) {
                    $recipient = $channel === 'email' ? $client->email : ($client->phone ?: 'unknown');
                    NotificationService::sendTemplate(
                        $client->id,
                        $channel,
                        $recipient,
                        'upcoming_installment',
                        [
                            'amount' => number_format($payment->amount) . ' EGP',
                            'due_date' => $payment->due_date->format('Y-m-d'),
                            'unit_number' => $unit->unit_number
                        ]
                    );
                    $upcomingSent++;
                }
            }
        }

        // 2. Scan for overdue payments (due in past and not paid)
        $overduePayments = Payment::where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->with(['contract.client', 'contract.unit'])
            ->get();

        $overdueSent = 0;
        foreach ($overduePayments as $payment) {
            $client = $payment->contract?->client;
            $unit = $payment->contract?->unit;
            if ($client && $unit) {
                $channels = ['email', 'sms', 'whatsapp'];
                foreach ($channels as $channel) {
                    $recipient = $channel === 'email' ? $client->email : ($client->phone ?: 'unknown');
                    NotificationService::sendTemplate(
                        $client->id,
                        $channel,
                        $recipient,
                        'overdue_installment',
                        [
                            'amount' => number_format($payment->amount) . ' EGP',
                            'due_date' => $payment->due_date->format('Y-m-d'),
                            'unit_number' => $unit->unit_number,
                            'penalty_rate' => '1' // default 1% penalty
                        ]
                    );
                    $overdueSent++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Schedule checkup executed successfully.',
            'upcoming_alerts_sent' => $upcomingSent,
            'overdue_alerts_sent' => $overdueSent
        ]);
    }
}
