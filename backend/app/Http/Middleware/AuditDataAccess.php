<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Middleware: AuditDataAccess
 *
 * Automatically logs every data access (read) request that
 * returns a successful response. Captures: user ID, role,
 * endpoint, HTTP method, query parameters, and resource IDs
 * found in the route.
 * ─────────────────────────────────────────────────────────
 */
class AuditDataAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log successful responses to avoid noise from errors
        $statusCode = $response->getStatusCode();
        if ($statusCode >= 200 && $statusCode < 300 && $request->user()) {
            $this->logAccess($request);
        }

        return $response;
    }

    private function logAccess(Request $request): void
    {
        try {
            $user = $request->user();
            $routeParams = $request->route()?->parameters() ?? [];

            AuditLogService::log('DATA_ACCESS', $user->id, [
                'role'         => $user->role,
                'tier_level'   => $user->getTierLevel(),
                'method'       => $request->method(),
                'endpoint'     => $request->path(),
                'route_params' => $routeParams,
                'query_params' => $request->query(),
                'user_agent'   => substr($request->userAgent() ?? '', 0, 200),
            ]);
        } catch (\Throwable $e) {
            // Never let audit logging break the request
            \Illuminate\Support\Facades\Log::warning('[AuditDataAccess] Failed to log', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
