<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Str;

class AuditLogService
{
    /**
     * Record an audit log entry.
     */
    public static function log(string $action, ?string $userId, array $details = []): AuditLog
    {
        return AuditLog::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => request()->ip() ?: '127.0.0.1',
            'details' => $details,
        ]);
    }
}
