<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\LegalService;
use App\Models\LegalCase;
use App\Models\CourtSession;
use App\Models\LegalAction;
use Illuminate\Http\Request;

class LegalController extends Controller
{
    protected LegalService $service;

    public function __construct(LegalService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['status', 'priority', 'company_id', 'assigned_lawyer_id', 'search']);
        $cases = $this->service->getCases($filters);

        return response()->json([
            'success' => true,
            'data' => $cases
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'case_number' => 'nullable|string|unique:legal_cases,case_number',
            'entity_type' => 'nullable|string',
            'entity_id' => 'nullable|uuid',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'type' => 'required|in:litigation,arbitration,dispute,consultation',
            'status' => 'required|in:open,investigation,litigation,resolved,closed,archived',
            'priority' => 'required|in:low,medium,high,critical',
            'jurisdiction' => 'nullable|string',
            'court_name' => 'nullable|string',
            'description' => 'nullable|string',
            'claim_amount' => 'nullable|numeric|min:0',
            'legal_fees' => 'nullable|numeric|min:0',
            'assigned_lawyer_id' => 'nullable|uuid|exists:users,id',
            'opened_at' => 'required|date',
            'parties' => 'nullable|array',
            'parties.*.name' => 'required|string',
            'parties.*.type' => 'required|in:plaintiff,defendant,claimant,respondent,witness,expert',
            'parties.*.role' => 'nullable|in:internal,external',
            'parties.*.phone' => 'nullable|string',
            'parties.*.email' => 'nullable|string|email',
            'parties.*.address' => 'nullable|string',
        ]);

        $case = $this->service->createCase($validated);

        return response()->json([
            'success' => true,
            'message' => 'Legal case created successfully',
            'data' => $case
        ], 211);
    }

    public function show(string $id)
    {
        $case = LegalCase::with(['lawyer', 'company', 'parties', 'courtSessions.creator', 'documents.uploader', 'actions.assignee'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $case
        ]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'type' => 'sometimes|required|in:litigation,arbitration,dispute,consultation',
            'status' => 'sometimes|required|in:open,investigation,litigation,resolved,closed,archived',
            'priority' => 'sometimes|required|in:low,medium,high,critical',
            'jurisdiction' => 'nullable|string',
            'court_name' => 'nullable|string',
            'description' => 'nullable|string',
            'claim_amount' => 'nullable|numeric|min:0',
            'legal_fees' => 'nullable|numeric|min:0',
            'assigned_lawyer_id' => 'nullable|uuid|exists:users,id',
            'opened_at' => 'sometimes|required|date',
            'closed_at' => 'nullable|date',
        ]);

        $case = $this->service->updateCase($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Case updated successfully',
            'data' => $case
        ]);
    }

    public function addSession(Request $request, string $id)
    {
        $validated = $request->validate([
            'session_date' => 'required|date',
            'hall_number' => 'nullable|string',
            'judge_name' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;
        $session = $this->service->addSession($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Hearing session scheduled successfully',
            'data' => $session
        ], 211);
    }

    public function updateSession(Request $request, string $id, string $sessionId)
    {
        $session = CourtSession::where('case_id', $id)->findOrFail($sessionId);

        $validated = $request->validate([
            'status' => 'required|in:scheduled,attended,postponed,cancelled',
            'postponed_to' => 'nullable|date|after:now',
            'notes' => 'nullable|string',
        ]);

        $session->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hearing session updated successfully',
            'data' => $session
        ]);
    }

    public function addAction(Request $request, string $id)
    {
        $validated = $request->validate([
            'action_type' => 'required|string',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $validated['created_by'] = $request->user()->id;
        $action = $this->service->addAction($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Legal action created successfully',
            'data' => $action
        ], 211);
    }

    public function completeAction(Request $request, string $id, string $actionId)
    {
        $action = LegalAction::where('case_id', $id)->findOrFail($actionId);
        $action->update([
            'completed_at' => now()->toDateString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Action marked as completed successfully',
            'data' => $action
        ]);
    }

    public function addDocument(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'document_type' => 'required|string',
            'file_url' => 'required|string', // mockup file URL
        ]);

        $validated['uploaded_by'] = $request->user()->id;
        $document = $this->service->addDocument($id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => $document
        ], 211);
    }

    public function getDashboard()
    {
        $stats = $this->service->getDashboardStats();
        $upcoming = $this->service->getUpcomingSessions(30);

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'upcoming_sessions' => $upcoming
        ]);
    }
}
