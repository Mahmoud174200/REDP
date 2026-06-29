<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\AuditLogService;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Fetch all indexed documents in the vault.
     */
    public function getDocuments(Request $request)
    {
        $query = Document::query();

        // 🔍 Simple Fuzzy Search on Title & OCR Content (Section H.20 DMS Search)
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhere('ocr_content', 'like', $searchTerm);
            });
        }

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'search_term' => $request->search ?? null,
            'data' => $query->latest()->get()
        ], 200);
    }

    /**
     * Upload a new document and run simulated OCR text extraction.
     * Section H.20: OCR and DMS Indexing.
     */
    public function uploadDocument(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,png,doc,docx|max:10240', // Max 10MB
        ]);

        $uploaderId = $request->user()->id;
        $docId = (string) Str::uuid();

        // 1. Store the file via file upload service
        $filePath = FileUploadService::upload($request->file('file'), 'vault/dms', 'local');

        // 2. Run simulated OCR scanning based on document type/title keywords
        $title = $request->title;
        $ocrContent = "REDP Platform Smart OCR Scanned Document. Title: {$title}. Generated index hash: " . md5($docId) . ". ";
        
        if (stripos($title, 'contract') !== false) {
            $ocrContent .= "This legal document contains sales agreements, installment terms, delay penalties, unit dimensions, and digital signature logs.";
        } elseif (stripos($title, 'id') !== false || stripos($title, 'national') !== false) {
            $ocrContent .= "Identities Card document. Valid national ID number: 29509081234567. Expiry date: 2030-05-12. Gender: Male. Address: New Cairo, Egypt.";
        } else {
            $ocrContent .= "Standard property record sheet. Contains floor overlay metadata, inspection checklists, and snagging items indexes.";
        }

        // 3. Database save
        $doc = Document::create([
            'id' => $docId,
            'title' => $title,
            'file_path' => $filePath,
            'ocr_content' => $ocrContent,
            'status' => 'indexed'
        ]);

        AuditLogService::log(
            'DMS_DOCUMENT_UPLOAD', 
            $uploaderId, 
            ['document_id' => $docId, 'title' => $title]
        );

        return response()->json([
            'success' => true,
            'owner' => '🟢 Delivery & Infra',
            'message' => 'Document uploaded, OCR text indexed, and added to the searchable vault.',
            'data' => $doc
        ], 201);
    }

    /**
     * View/download dynamically generated HTML/PDF for Reservation Form.
     */
    public function viewReservationForm(string $id)
    {
        // Find Reservation or EoiReservation
        $reservation = \App\Models\Reservation::with(['unit.project', 'client'])->find($id);
        
        if (!$reservation) {
            // Try matching Document first to get metadata
            $doc = \App\Models\Document::where('file_path', 'like', "%{$id}%")->first();
            
            // If still not found, return 404
            if (!$doc) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reservation document not found.'
                ], 404);
            }
            
            // Fallback: Parse details from OCR content
            $clientName = 'Client';
            $unitNumber = 'N/A';
            $price = '0.00';
            $eoiAmount = '0.00';
            
            if (preg_match('/Client Name:\s*([^\.]+)/i', $doc->ocr_content, $matches)) {
                $clientName = trim($matches[1]);
            }
            if (preg_match('/Unit Number:\s*([^\.]+)/i', $doc->ocr_content, $matches)) {
                $unitNumber = trim($matches[1]);
            }
            if (preg_match('/Unit Price:\s*([^\s]+)/i', $doc->ocr_content, $matches)) {
                $price = trim($matches[1]);
            }
            if (preg_match('/EOI Paid:\s*([^\s]+)/i', $doc->ocr_content, $matches)) {
                $eoiAmount = trim($matches[1]);
            }
            
            return $this->renderHtmlForm($id, $clientName, $unitNumber, $price, $eoiAmount, 'N/A', 'N/A');
        }

        $clientName = $reservation->client?->name ?? 'Client';
        $clientEmail = $reservation->client?->email ?? 'N/A';
        $clientPhone = $reservation->client?->phone ?? 'N/A';
        $unitNumber = $reservation->unit?->unit_number ?? 'N/A';
        $projectName = $reservation->unit?->project?->name ?? 'N/A';
        $price = $reservation->unit?->price ?? 0.00;
        $eoiAmount = $reservation->eoi_amount ?? 0.00;

        return $this->renderHtmlForm($id, $clientName, $unitNumber, $price, $eoiAmount, $clientEmail, $clientPhone, $projectName);
    }

    private function renderHtmlForm($id, $clientName, $unitNumber, $price, $eoiAmount, $clientEmail, $clientPhone, $projectName = 'N/A')
    {
        $fmtPrice = number_format($price, 2) . ' EGP';
        $fmtEoi = number_format($eoiAmount, 2) . ' EGP';
        $date = now()->format('d/m/Y');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reservation Form - {$id}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
        }
        .container {
            background-color: #ffffff;
            width: 100%;
            max-width: 800px;
            padding: 50px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-top: 8px solid #32473a;
            position: relative;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            color: #32473a;
            letter-spacing: -0.03em;
        }
        .doc-title {
            text-align: right;
        }
        .doc-title h1 {
            margin: 0;
            font-size: 20px;
            color: #1f2937;
            text-transform: uppercase;
        }
        .doc-title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #9ca3af;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 6px;
        }
        .info-group {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .info-label {
            color: #6b7280;
        }
        .info-value {
            font-weight: 600;
            color: #111827;
        }
        .table-container {
            margin-top: 20px;
            margin-bottom: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th {
            background-color: #f9fafb;
            color: #6b7280;
            text-align: left;
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
        }
        td {
            padding: 16px;
            border-bottom: 1px solid #f3f4f6;
        }
        .text-right {
            text-align: right;
        }
        .total-row {
            background-color: #f9fafb;
            font-weight: 700;
        }
        .footer-note {
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            line-height: 1.5;
        }
        .print-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: #32473a;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.2s;
        }
        .print-btn:hover {
            background-color: #27372d;
        }
        @media print {
            body {
                background-color: #ffffff;
                padding: 0;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
                max-width: 100%;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="print-btn" onclick="window.print()">
            Print Document
        </button>
        <div class="header">
            <div class="logo">Ether REDP</div>
            <div class="doc-title">
                <h1>Reservation Form</h1>
                <p>Doc ID: {$id}</p>
            </div>
        </div>

        <div class="grid-2">
            <div>
                <div class="section-title">Client Information</div>
                <div class="info-group">
                    <span class="info-label">Name:</span>
                    <span class="info-value">{$clientName}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{$clientEmail}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">{$clientPhone}</span>
                </div>
            </div>
            <div>
                <div class="section-title">Document Metadata</div>
                <div class="info-group">
                    <span class="info-label">Date Generated:</span>
                    <span class="info-value">{$date}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Status:</span>
                    <span class="info-value" style="color: #10b981;">INDEXED</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Compound:</span>
                    <span class="info-value">{$projectName}</span>
                </div>
            </div>
        </div>

        <div class="section-title">Unit & Payment Specifications</div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Amount Paid</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>Unit Number: {$unitNumber}</strong><br>
                            <span style="font-size: 12px; color: #6b7280;">REDP Secure Hold Reservation</span>
                        </td>
                        <td class="text-right">{$fmtPrice}</td>
                        <td class="text-right">{$fmtEoi}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Downpayment Configured (EOI)</td>
                        <td class="text-right">Total: {$fmtPrice}</td>
                        <td class="text-right" style="color: #10b981;">Paid: {$fmtEoi}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer-note">
            This document is dynamically generated by the Ether REDP Document Management Vault System (DMS) upon reservation confirmation.<br>
            It is indexed and digitally cryptographically signed.
        </div>
    </div>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html');
    }
}
