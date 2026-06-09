<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Resolve subdomain from custom header 'X-Tenant-Subdomain' or HTTP Host
        $subdomain = $request->header('X-Tenant-Subdomain');
        
        if (empty($subdomain)) {
            // fallback: extract first segment of Host (e.g. tenant1.example.com)
            $host = $request->getHost();
            $parts = explode('.', $host);
            if (count($parts) > 2) {
                $subdomain = $parts[0];
            }
        }

        // 2. Query matching tenant
        if (!empty($subdomain) && $subdomain !== 'www') {
            $tenant = Tenant::where('subdomain', $subdomain)
                ->orWhere('domain', $request->getHost())
                ->first();

            if ($tenant) {
                Tenant::setCurrentId($tenant->id);
                
                // Enforce status check (block if suspended)
                if ($tenant->status === 'suspended') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This organization account is suspended. Please contact system administrators.'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
