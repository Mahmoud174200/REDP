<?php

namespace App\Services\Construction;

use App\Models\ProjectPhase;
use App\Models\ConstructionMilestone;
use App\Models\BoqItem;
use App\Models\ResourceAllocation;
use Carbon\Carbon;

class ConstructionService
{
    /**
     * Create project phase.
     */
    public function createPhase(array $data): ProjectPhase
    {
        return ProjectPhase::create([
            'project_id' => $data['project_id'],
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => 'planned'
        ]);
    }

    /**
     * Update milestone progress percentage and recalculate status.
     */
    public function updateMilestoneProgress(string $milestoneId, float $progress): ConstructionMilestone
    {
        $milestone = ConstructionMilestone::findOrFail($milestoneId);
        $progress = max(0.0, min(100.0, $progress));

        $status = 'pending';
        $completedAt = null;

        if ($progress >= 100.0) {
            $status = 'completed';
            $completedAt = Carbon::now();
        } else {
            // Check if overdue
            $dueDate = Carbon::parse($milestone->due_date);
            if ($dueDate->isPast()) {
                $status = 'delayed';
            }
        }

        $milestone->update([
            'progress_percentage' => $progress,
            'status' => $status,
            'completed_at' => $completedAt
        ]);

        // Automatically update the parent phase status if all milestones completed
        $this->syncPhaseStatus($milestone->phase_id);

        return $milestone;
    }

    /**
     * Calculate phase progress by weighted milestones.
     */
    public function calculatePhaseProgress(string $phaseId): float
    {
        $milestones = ConstructionMilestone::where('phase_id', $phaseId)->get();
        if ($milestones->isEmpty()) {
            return 0.0;
        }

        $totalWeight = 0.0;
        $weightedProgress = 0.0;

        foreach ($milestones as $m) {
            $weight = (float)$m->weight;
            $progress = (float)$m->progress_percentage;

            $totalWeight += $weight;
            $weightedProgress += ($progress * $weight);
        }

        return $totalWeight > 0 ? ($weightedProgress / $totalWeight) : 0.0;
    }

    /**
     * Sync and update the project phase overall status.
     */
    protected function syncPhaseStatus(string $phaseId)
    {
        $phase = ProjectPhase::findOrFail($phaseId);
        $milestones = ConstructionMilestone::where('phase_id', $phaseId)->get();

        if ($milestones->isEmpty()) {
            return;
        }

        $allCompleted = $milestones->every(fn($m) => $m->status === 'completed');
        $anyStarted = $milestones->contains(fn($m) => $m->progress_percentage > 0);

        $status = 'planned';
        if ($allCompleted) {
            $status = 'completed';
        } elseif ($anyStarted) {
            $status = 'active';
        }

        $phase->update(['status' => $status]);
    }
}
