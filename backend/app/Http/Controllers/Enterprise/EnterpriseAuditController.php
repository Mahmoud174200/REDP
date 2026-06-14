<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnterpriseAuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user');

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->input('action') . '%');
        }

        // Filter by entity type
        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->input('entity_type'));
        }

        // Filter by user ID
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by device type
        if ($request->filled('device_type')) {
            $query->where('device_type', $request->input('device_type'));
        }

        // Filter by date range
        if ($request->filled('date_start')) {
            $query->whereDate('created_at', '>=', $request->input('date_start'));
        }
        if ($request->filled('date_end')) {
            $query->whereDate('created_at', '<=', $request->input('date_end'));
        }

        // Search query
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('entity_type', 'like', "%{$search}%")
                  ->orWhere('entity_id', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('user_agent', 'like', "%{$search}%")
                  ->orWhere('browser', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function show(string $id)
    {
        $log = AuditLog::with('user')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log entry not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $log
        ]);
    }

    public function summary()
    {
        $totalLogs = AuditLog::count();
        
        $byAction = AuditLog::select('action', DB::raw('count(*) as total'))
            ->groupBy('action')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        $byDevice = AuditLog::select('device_type', DB::raw('count(*) as total'))
            ->groupBy('device_type')
            ->get();

        $byBrowser = AuditLog::select('browser', DB::raw('count(*) as total'))
            ->groupBy('browser')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        $dailyTrend = AuditLog::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as total'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_logs' => $totalLogs,
                'by_action' => $byAction,
                'by_device' => $byDevice,
                'by_browser' => $byBrowser,
                'daily_trend' => $dailyTrend
            ]
        ]);
    }
}
