<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin marketing broadcast: filter the whole customer base (prospect leads and
 * signed-up clients) and blast a multi-channel announcement (email / SMS /
 * WhatsApp) — e.g. "New project launched, hurry and reserve".
 */
class CampaignController extends Controller
{
    /** Lead statuses/sources surfaced to the filter UI. */
    private const LEAD_STATUSES = ['new', 'contacted', 'interested', 'visit_scheduled', 'negotiation', 'reserved', 'contracted'];
    private const LEAD_SOURCES  = ['facebook', 'google', 'tiktok', 'direct', 'referral', 'broker', 'website_interested', 'website_contact', 'website_eoi'];

    /**
     * GET /v1/admin/campaigns/filter-options
     * Options to populate the filter UI (projects + enum lists).
     */
    public function filterOptions(): JsonResponse
    {
        return response()->json([
            'success'  => true,
            'projects' => Project::orderBy('name')->get(['id', 'name', 'status']),
            'statuses' => self::LEAD_STATUSES,
            'sources'  => self::LEAD_SOURCES,
            'channels' => ['email', 'sms', 'whatsapp'],
        ]);
    }

    /**
     * POST /v1/admin/campaigns/preview
     * Resolve the audience for the given filters — returns counts (per channel
     * reachability) and a small sample, WITHOUT sending anything.
     */
    public function preview(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $recipients = $this->resolveRecipients($filters);

        return response()->json([
            'success'         => true,
            'total'           => $recipients->count(),
            'reachable_email' => $recipients->whereNotNull('email')->where('email', '!=', '')->count(),
            'reachable_phone' => $recipients->whereNotNull('phone')->where('phone', '!=', '')->count(),
            'sample'          => $recipients->take(8)->map(fn($r) => [
                'name'  => $r['name'],
                'type'  => $r['type'],
                'email' => $r['email'],
                'phone' => $r['phone'],
            ])->values(),
        ]);
    }

    /**
     * POST /v1/admin/campaigns/send
     * Send the message to every resolved recipient across the chosen channels.
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'    => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
            'channels' => 'required|array|min:1',
            'channels.*' => 'in:email,sms,whatsapp',
        ]);

        $filters = $this->validateFilters($request);
        $recipients = $this->resolveRecipients($filters);

        if ($recipients->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No recipients match the selected filters.'], 422);
        }

        $channels = array_values(array_unique($data['channels']));
        $sent = ['email' => 0, 'sms' => 0, 'whatsapp' => 0];
        $failed = 0;

        foreach ($recipients as $r) {
            foreach ($channels as $channel) {
                // Route each channel to the right address; skip if unreachable there.
                $to = $channel === 'email' ? $r['email'] : $r['phone'];
                if (empty($to)) {
                    continue;
                }
                try {
                    NotificationService::send($r['id'], $channel, $to, $data['title'], $data['message']);
                    $sent[$channel]++;
                } catch (\Throwable $e) {
                    $failed++;
                    \Illuminate\Support\Facades\Log::error("Campaign send failed ({$channel}) to {$to}: " . $e->getMessage());
                }
            }
        }

        AuditLogService::log('CAMPAIGN_BROADCAST', $request->user()->id, [
            'recipients' => $recipients->count(),
            'channels'   => $channels,
            'filters'    => $filters,
            'sent'       => $sent,
        ]);

        $totalSent = array_sum($sent);
        return response()->json([
            'success'    => true,
            'message'    => "Campaign dispatched to {$recipients->count()} recipient(s) across " . count($channels) . " channel(s).",
            'recipients' => $recipients->count(),
            'sent'       => $sent,
            'total_sent' => $totalSent,
            'failed'     => $failed,
        ]);
    }

    // ── internals ──────────────────────────────────────────────

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'audience'              => 'nullable|in:leads,clients,both',
            'status'                => 'nullable|array',
            'status.*'              => 'string',
            'source'                => 'nullable|array',
            'source.*'              => 'string',
            'interested_project_id' => 'nullable|uuid|exists:projects,id',
            'owns_project_id'       => 'nullable|uuid|exists:projects,id',
            'payment_method'        => 'nullable|in:cash,installment',
            'budget_min'            => 'nullable|numeric|min:0',
            'budget_max'            => 'nullable|numeric|min:0',
        ]);
    }

    /**
     * Resolve a de-duplicated recipient list (by phone/email) from leads and/or
     * clients according to the filters. Each row: id, type, name, email, phone.
     */
    private function resolveRecipients(array $f): \Illuminate\Support\Collection
    {
        $audience = $f['audience'] ?? 'both';
        $out = collect();

        // ── Prospect leads ──
        if (in_array($audience, ['leads', 'both'], true)) {
            $q = Lead::query();
            if (!empty($f['status']))                $q->whereIn('status', $f['status']);
            if (!empty($f['source']))                $q->whereIn('source', $f['source']);
            if (!empty($f['interested_project_id'])) $q->where('interested_project_id', $f['interested_project_id']);
            if (!empty($f['payment_method']))        $q->where('payment_method', $f['payment_method']);
            if (isset($f['budget_min']))             $q->where('budget', '>=', $f['budget_min']);
            if (isset($f['budget_max']))             $q->where('budget', '<=', $f['budget_max']);

            foreach ($q->get() as $lead) {
                $out->push([
                    'id'    => $lead->id,
                    'type'  => 'lead',
                    'name'  => trim($lead->first_name . ' ' . $lead->last_name),
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                ]);
            }
        }

        // ── Signed-up clients (buyers) ──
        if (in_array($audience, ['clients', 'both'], true)) {
            $q = User::where('role', 'client');
            if (!empty($f['owns_project_id'])) {
                $clientIds = \App\Models\Contract::whereHas('unit', fn($u) => $u->where('project_id', $f['owns_project_id']))
                    ->pluck('client_id')->unique()->all();
                $q->whereIn('id', $clientIds);
            }
            foreach ($q->get() as $client) {
                $out->push([
                    'id'    => $client->id,
                    'type'  => 'client',
                    'name'  => $client->name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                ]);
            }
        }

        // De-dupe: prefer a stable key of email|phone so the same person isn't hit twice.
        return $out->unique(fn($r) => strtolower(trim(($r['email'] ?? '') . '|' . ($r['phone'] ?? ''))))->values();
    }
}
