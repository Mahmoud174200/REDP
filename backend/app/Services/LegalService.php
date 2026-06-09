<?php

namespace App\Services;

use App\Models\LegalCase;
use App\Models\LegalParty;
use App\Models\CourtSession;
use App\Models\LegalDocument;
use App\Models\LegalAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LegalService
{
    public function getCases(array $filters = [])
    {
        $query = LegalCase::with(['lawyer', 'company', 'parties', 'courtSessions', 'actions']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }
        if (!empty($filters['assigned_lawyer_id'])) {
            $query->where('assigned_lawyer_id', $filters['assigned_lawyer_id']);
        }
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('case_number', 'like', "%{$s}%")
                  ->orWhere('court_name', 'like', "%{$s}%");
            });
        }

        return $query->orderBy('opened_at', 'desc')->get();
    }

    public function createCase(array $data): LegalCase
    {
        return DB::transaction(function () use ($data) {
            $case = LegalCase::create([
                'id' => (string) Str::uuid(),
                'case_number' => $data['case_number'] ?? 'LEG-' . strtoupper(Str::random(8)),
                'title' => $data['title'],
                'entity_type' => $data['entity_type'] ?? null,
                'entity_id' => $data['entity_id'] ?? null,
                'company_id' => $data['company_id'] ?? null,
                'type' => $data['type'] ?? 'litigation',
                'status' => $data['status'] ?? 'open',
                'priority' => $data['priority'] ?? 'medium',
                'jurisdiction' => $data['jurisdiction'] ?? null,
                'court_name' => $data['court_name'] ?? null,
                'description' => $data['description'] ?? null,
                'claim_amount' => $data['claim_amount'] ?? null,
                'legal_fees' => $data['legal_fees'] ?? null,
                'assigned_lawyer_id' => $data['assigned_lawyer_id'] ?? null,
                'opened_at' => $data['opened_at'] ?? now()->toDateString(),
            ]);

            // Add default parties if provided
            if (!empty($data['parties'])) {
                foreach ($data['parties'] as $p) {
                    LegalParty::create([
                        'id' => (string) Str::uuid(),
                        'case_id' => $case->id,
                        'name' => $p['name'],
                        'type' => $p['type'],
                        'role' => $p['role'] ?? 'external',
                        'phone' => $p['phone'] ?? null,
                        'email' => $p['email'] ?? null,
                        'address' => $p['address'] ?? null,
                    ]);
                }
            }

            return $case;
        });
    }

    public function updateCase(string $id, array $data): LegalCase
    {
        $case = LegalCase::findOrFail($id);
        $case->update($data);
        return $case;
    }

    public function addSession(string $caseId, array $data): CourtSession
    {
        return CourtSession::create([
            'id' => (string) Str::uuid(),
            'case_id' => $caseId,
            'session_date' => $data['session_date'],
            'hall_number' => $data['hall_number'] ?? null,
            'judge_name' => $data['judge_name'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => 'scheduled',
            'created_by' => $data['created_by'] ?? null,
        ]);
    }

    public function addAction(string $caseId, array $data): LegalAction
    {
        return LegalAction::create([
            'id' => (string) Str::uuid(),
            'case_id' => $caseId,
            'action_type' => $data['action_type'],
            'due_date' => $data['due_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'assigned_to' => $data['assigned_to'] ?? null,
            'created_by' => $data['created_by'] ?? null,
        ]);
    }

    public function addDocument(string $caseId, array $data): LegalDocument
    {
        return LegalDocument::create([
            'id' => (string) Str::uuid(),
            'case_id' => $caseId,
            'name' => $data['name'],
            'document_type' => $data['document_type'],
            'file_url' => $data['file_url'],
            'uploaded_by' => $data['uploaded_by'] ?? null,
        ]);
    }

    public function getUpcomingSessions(int $days = 30)
    {
        return CourtSession::with(['case'])
            ->where('session_date', '>=', now())
            ->where('session_date', '<=', now()->addDays($days))
            ->where('status', 'scheduled')
            ->orderBy('session_date', 'asc')
            ->get();
    }

    public function getDashboardStats()
    {
        $claimSum = LegalCase::where('status', '!=', 'closed')->sum('claim_amount');
        $activeCases = LegalCase::whereNotIn('status', ['closed', 'archived'])->count();
        $upcomingCount = CourtSession::where('session_date', '>=', now())
            ->where('status', 'scheduled')
            ->count();
        $pendingActions = LegalAction::whereNull('completed_at')->count();

        return [
            'active_cases' => $activeCases,
            'total_claim_amount' => $claimSum,
            'upcoming_hearings' => $upcomingCount,
            'pending_deadlines' => $pendingActions,
        ];
    }
}
