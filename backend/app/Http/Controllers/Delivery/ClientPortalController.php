<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ClientPortalController extends Controller
{
    /**
     * Get owner dashboard overview.
     */
    public function getOverview(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'message' => 'Base Client compound portal skeleton. Ready for implementation.',
            'todo' => [
                'H.2: Client portal layout integration',
                'H.8: Maintenance tickets submission flow',
                'Compound gate guest QR code generator'
            ]
        ]);
    }

    /**
     * Submit visitor gate code request.
     */
    public function requestGateCode(Request $request)
    {
        return response()->json([
            'success' => true,
            'owner' => '🟢 Mahmoud (Delivery & Infra)',
            'message' => 'Visitor gate request stub. QR generator to be integrated.',
            'qr_code_placeholder' => 'BASE64_STUB_DATA'
        ]);
    }
}
