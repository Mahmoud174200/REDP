<?php

namespace App\Services\Quality;

use App\Models\SiteInspection;
use App\Models\NcrReport;
use App\Models\CapaAction;
use Carbon\Carbon;

class QualityControlService
{
    /**
     * Log site quality inspection outcome.
     */
    public function logInspection(array $data): SiteInspection
    {
        return \DB::transaction(function () use ($data) {
            $inspection = SiteInspection::create([
                'project_id' => $data['project_id'],
                'milestone_id' => $data['milestone_id'] ?? null,
                'inspector_id' => $data['inspector_id'],
                'inspection_date' => $data['inspection_date'] ?? Carbon::now()->toDateString(),
                'comments' => $data['comments'] ?? null,
                'status' => $data['status'] ?? 'passed'
            ]);

            // If inspection failed, automatically issue an NCR ticket
            if ($inspection->status === 'failed') {
                NcrReport::create([
                    'inspection_id' => $inspection->id,
                    'description' => $data['ncr_description'] ?? 'Site inspection quality test failed.',
                    'severity' => $data['ncr_severity'] ?? 'medium',
                    'status' => 'open'
                ]);
            }

            return $inspection;
        });
    }

    /**
     * Resolve a quality defect ticket.
     */
    public function resolveNcr(string $ncrId, ?string $engineerId = null): NcrReport
    {
        $ncr = NcrReport::findOrFail($ncrId);
        
        $ncr->update([
            'status' => 'resolved',
            'assigned_engineer_id' => $engineerId ?: $ncr->assigned_engineer_id,
            'resolved_at' => Carbon::now()
        ]);

        // Auto pass the linked inspection status
        $inspection = $ncr->inspection;
        if ($inspection) {
            $inspection->update(['status' => 'passed']);
        }

        return $ncr;
    }

    /**
     * Create Corrective Action.
     */
    public function createCapa(array $data): CapaAction
    {
        return CapaAction::create([
            'ncr_id' => $data['ncr_id'],
            'action_plan' => $data['action_plan'],
            'due_date' => $data['due_date'],
            'status' => 'pending'
        ]);
    }
}
