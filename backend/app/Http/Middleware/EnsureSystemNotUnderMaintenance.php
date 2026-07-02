<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemConfig;

class EnsureSystemNotUnderMaintenance
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $mode = SystemConfig::where('key', 'maintenance_mode')->first();
        
        if ($mode && $mode->value === 'true') {
            $user = $request->user();
            
            // Allow only admin users to bypass maintenance mode
            if (!$user || $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'maintenance' => true,
                    'message' => 'The platform is currently undergoing scheduled maintenance. Please try again later.'
                ], 503);
            }
        }

        return $next($request);
    }
}
