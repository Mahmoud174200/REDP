<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\Customer360Service;
use Illuminate\Http\Request;

class Customer360Controller extends Controller
{
    protected Customer360Service $service;

    public function __construct(Customer360Service $service)
    {
        $this->service = $service;
    }

    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $results = $this->service->searchDirectory($request->query('query'));

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    public function show(Request $request, string $id)
    {
        $type = $request->query('type', 'lead');
        if (!in_array($type, ['lead', 'client'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid lookup type. Must be lead or client.'
            ], 400);
        }

        $profile = $this->service->getCustomerProfile($id, $type);

        return response()->json([
            'success' => true,
            'data' => $profile
        ]);
    }
}
