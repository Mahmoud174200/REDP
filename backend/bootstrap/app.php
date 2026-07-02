<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\ResolveTenant::class);
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'tier' => \App\Http\Middleware\EnsureTierAccess::class,
            'maintenance' => \App\Http\Middleware\EnsureSystemNotUnderMaintenance::class,
            'audit.access' => \App\Http\Middleware\AuditDataAccess::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Customize global API error response behavior
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $statusCode = $response->getStatusCode() ?: 500;
                
                // Keep development exception tracing transparent
                $data = [
                    'success' => false,
                    'message' => $e->getMessage() ?: 'An unexpected server error occurred.',
                ];
                
                if (config('app.debug')) {
                    $data['trace'] = $e->getTrace();
                    $data['code'] = $e->getCode();
                }
                
                return response()->json($data, $statusCode == 0 ? 500 : $statusCode);
            }
            return $response;
        });
    })->create();
