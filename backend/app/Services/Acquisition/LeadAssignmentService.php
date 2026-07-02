<?php

namespace App\Services\Acquisition;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Service: LeadAssignmentService
 *
 * Implements Round-Robin assignment of new leads to active
 * sales agents for fair workload distribution.
 * Blueprint Section: H.9 CRM Pipeline
 * ─────────────────────────────────────────────────────────
 */
class LeadAssignmentService
{
    /**
     * Cache key for tracking the last assigned agent index.
     */
    private const ROUND_ROBIN_KEY = 'acquisition:round_robin_index';

    /**
     * Assign a lead to the next available sales agent via Round-Robin.
     *
     * @param Lead $lead The lead to assign.
     * @return User|null The assigned agent, or null if no agents available.
     */
    public function assignLeadRoundRobin(Lead $lead): ?User
    {
        // Get all active sales agents
        $agents = User::where('role', 'sales_agent')
            ->orderBy('id')
            ->get();

        if ($agents->isEmpty()) {
            Log::warning('[LeadAssignment] No active sales agents available for round-robin', [
                'lead_id' => $lead->id,
            ]);
            return null;
        }

        // Get current round-robin index from cache (or start at 0)
        $currentIndex = (int) cache()->get(self::ROUND_ROBIN_KEY, 0);

        // Wrap around if index exceeds agent count
        $assignIndex = $currentIndex % $agents->count();
        $agent = $agents[$assignIndex];

        // Update lead assignment
        $lead->update([
            'assigned_sales_agent_id' => $agent->id,
        ]);

        // Advance the round-robin pointer
        cache()->put(self::ROUND_ROBIN_KEY, $assignIndex + 1);

        Log::info('[LeadAssignment] Lead assigned via Round-Robin', [
            'lead_id'    => $lead->id,
            'agent_id'   => $agent->id,
            'agent_name' => $agent->name ?? 'N/A',
            'robin_index' => $assignIndex,
        ]);

        return $agent;
    }

    /**
     * Reassign a lead to a specific agent (manual override).
     */
    public function reassignLead(Lead $lead, string $agentId): bool
    {
        $agent = User::where('id', $agentId)
            ->where('role', 'sales_agent')
            ->first();

        if (!$agent) {
            Log::warning('[LeadAssignment] Invalid agent for reassignment', [
                'lead_id'  => $lead->id,
                'agent_id' => $agentId,
            ]);
            return false;
        }

        $lead->update(['assigned_sales_agent_id' => $agentId]);

        Log::info('[LeadAssignment] Lead manually reassigned', [
            'lead_id'  => $lead->id,
            'agent_id' => $agentId,
        ]);

        return true;
    }

    /**
     * Get agent workload distribution metrics.
     */
    public function getWorkloadMetrics(): array
    {
        $agents = User::where('role', 'sales_agent')->get();
        $metrics = [];

        foreach ($agents as $agent) {
            $leadCount = Lead::where('assigned_sales_agent_id', $agent->id)
                ->whereNotIn('status', ['contracted'])
                ->count();

            $metrics[] = [
                'agent_id'   => $agent->id,
                'agent_name' => $agent->name ?? 'N/A',
                'active_leads' => $leadCount,
            ];
        }

        return $metrics;
    }
}
