<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Tiered RBAC System
 * Middleware: EnsureTierAccess
 *
 * Checks that the authenticated user's tier level meets or
 * exceeds the minimum required tier for the route.
 * Admin users (tier 99) always pass.
 *
 * Usage: ->middleware('tier:2') for Tier 2+ access
 * ─────────────────────────────────────────────────────────
 */
class EnsureTierAccess
{
    public function handle(Request $request, Closure $next, int $requiredTier): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.',
            ], 401);
        }

        $userTier = $user->getTierLevel();

        // Admin always passes (tier 99)
        if ($user->isAdmin()) {
            return $next($request);
        }

        if ($userTier < $requiredTier) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Your access tier does not meet the minimum requirement for this resource.',
                'your_tier' => $userTier,
                'required_tier' => $requiredTier,
            ], 403);
        }

        return $next($request);
    }
}
