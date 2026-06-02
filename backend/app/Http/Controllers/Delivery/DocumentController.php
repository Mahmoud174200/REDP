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
        $filePath = FileUploadService::upload($request->file('file'), 'vault/dms');

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
}
