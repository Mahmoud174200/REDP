<?php

namespace App\Http\Controllers\Acquisition;

use App\Http\Controllers\Controller;
use App\Models\CallLog;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Developer 1: Ragab)
 * Controller: VoipCallController
 * Blueprint Section: H.10 — VoIP Softphone Call Logs
 *
 * Webhook endpoint accepting call metrics from VoIP providers
 * (e.g., Twilio) and AWS S3 recording URLs.
 * ─────────────────────────────────────────────────────────
 */
class VoipCallController extends Controller
{
    /**
     * POST /api/v1/webhooks/voip/call-status
     * Twilio-compatible call status webhook.
     * Accepts call metrics and links them to matching leads via phone number.
     */
    public function handleCallStatus(Request $request): JsonResponse
    {
        // Validate incoming Twilio-style payload
        $fields = $request->validate([
            'CallSid'          => 'required|string',
            'CallStatus'       => 'required|string',
            'Direction'        => 'nullable|string|in:inbound,outbound',
            'CallDuration'     => 'nullable|integer|min:0',
            'RecordingUrl'     => 'nullable|url',
            'From'             => 'nullable|string',
            'To'               => 'nullable|string',
        ]);

        $callSid  = $fields['CallSid'];
        $status   = $fields['CallStatus'];
        $direction = strtolower($fields['Direction'] ?? 'outbound');
        $duration  = (int) ($fields['CallDuration'] ?? 0);
        $recordingUrl = $fields['RecordingUrl'] ?? null;

        // Determine phone number to match against leads
        $phoneNumber = $direction === 'inbound'
            ? ($fields['From'] ?? null)
            : ($fields['To'] ?? null);

        // Find matching lead by phone number
        $lead = null;
        if ($phoneNumber) {
            // Normalize phone number (strip spaces and special chars)
            $normalizedPhone = preg_replace('/[^0-9+]/', '', $phoneNumber);
            $lead = Lead::where('phone', $normalizedPhone)
                ->orWhere('phone', 'LIKE', "%{$normalizedPhone}")
                ->first();
        }

        if (!$lead) {
            Log::warning('[VoIP] No matching lead found for phone number', [
                'call_sid' => $callSid,
                'phone'    => $phoneNumber,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Call logged but no matching lead found.',
                'matched' => false,
            ]);
        }

        // Upsert call log (update if exists, create if new)
        $callLog = CallLog::updateOrCreate(
            ['call_sid' => $callSid],
            [
                'id'               => (string) Str::uuid(),
                'lead_id'          => $lead->id,
                'direction'        => $direction,
                'duration_seconds' => $duration,
                'recording_url'    => $recordingUrl,
                'status'           => $status,
            ]
        );

        Log::info('[VoIP] Call log recorded', [
            'call_sid'  => $callSid,
            'lead_id'   => $lead->id,
            'direction' => $direction,
            'duration'  => $duration,
            'status'    => $status,
        ]);

        return response()->json([
            'success'   => true,
            'message'   => 'Call log recorded successfully.',
            'matched'   => true,
            'lead_id'   => $lead->id,
            'lead_name' => $lead->full_name,
            'data'      => $callLog,
        ]);
    }

    /**
     * POST /api/v1/webhooks/voip/recording-ready
     * Webhook for when a call recording is ready on S3.
     */
    public function handleRecordingReady(Request $request): JsonResponse
    {
        $fields = $request->validate([
            'CallSid'      => 'required|string',
            'RecordingUrl' => 'required|url',
            'RecordingSid' => 'nullable|string',
        ]);

        $callLog = CallLog::where('call_sid', $fields['CallSid'])->first();

        if (!$callLog) {
            return response()->json([
                'success' => false,
                'message' => 'No call log found for this CallSid.',
            ], 404);
        }

        $callLog->update([
            'recording_url' => $fields['RecordingUrl'],
        ]);

        Log::info('[VoIP] Recording URL updated', [
            'call_sid'      => $fields['CallSid'],
            'recording_url' => $fields['RecordingUrl'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recording URL attached to call log.',
        ]);
    }

    /**
     * GET /api/v1/acquisition/calls
     * Retrieve call logs for dashboard (authenticated).
     */
    public function index(Request $request): JsonResponse
    {
        $query = CallLog::with('lead:id,first_name,last_name,phone');

        if ($request->has('lead_id')) {
            $query->where('lead_id', $request->input('lead_id'));
        }

        if ($request->has('direction')) {
            $query->where('direction', $request->input('direction'));
        }

        $calls = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $calls,
        ]);
    }
}
