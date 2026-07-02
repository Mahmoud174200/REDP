<?php

namespace App\Services\Ai;

use App\Models\KnowledgeChunk;
use App\Models\Document;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — RAG Knowledge Base Service
 *
 * Retrieval-Augmented knowledge for the AI assistant. Ingests company
 * knowledge (documents/SOPs/policies/FAQs/uploads) as embedded chunks and
 * retrieves the most relevant ones (semantic cosine search) so the assistant
 * answers ONLY from grounded, citable company sources.
 *
 * Embeddings: Google Gemini `gemini-embedding-001` (L2-normalized so cosine
 * similarity is a plain dot product). Vectors are stored as JSON and scored
 * in-process — fine for hundreds–low-thousands of chunks; swap in a vector DB
 * for larger corpora.
 * ─────────────────────────────────────────────────────────
 */
class KnowledgeBaseService
{
    protected string $apiKey;
    protected string $model;
    protected int $dims;

    public function __construct()
    {
        $this->apiKey = (string) (config('services.gemini.key') ?: env('GEMINI_API_KEY', ''));
        $this->model = (string) (config('services.gemini.embedding_model') ?: 'gemini-embedding-001');
        $this->dims = (int) (config('services.gemini.embedding_dims') ?: 768);
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    // ── Ingestion ──────────────────────────────────────────────────────

    /**
     * Index one knowledge source (chunks + embeds + replaces prior chunks).
     *
     * @param array $item {source_type, title, content, source_id?, source_ref?, tenant_id?, metadata?}
     * @return int number of chunks stored
     */
    public function indexContent(array $item): int
    {
        $content = trim((string) ($item['content'] ?? ''));
        if ($content === '') {
            return 0;
        }

        $sourceType = $item['source_type'] ?? 'manual';
        $sourceId = $item['source_id'] ?? null;

        // Replace any previous chunks for this exact source.
        $prior = KnowledgeChunk::where('source_type', $sourceType);
        $sourceId ? $prior->where('source_id', $sourceId) : $prior->where('title', $item['title'] ?? '');
        $prior->delete();

        $chunks = $this->chunkText($content);
        $stored = 0;

        foreach ($chunks as $i => $chunkText) {
            $vec = $this->embed($chunkText, 'RETRIEVAL_DOCUMENT');
            if (!$vec) {
                continue;
            }
            KnowledgeChunk::create([
                'id' => (string) Str::uuid(),
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'source_ref' => $item['source_ref'] ?? ($item['title'] ?? null),
                'title' => $item['title'] ?? 'Untitled',
                'content' => $chunkText,
                'embedding' => $vec,
                'chunk_index' => $i,
                'tenant_id' => $item['tenant_id'] ?? null,
                'metadata' => $item['metadata'] ?? null,
            ]);
            $stored++;
        }

        return $stored;
    }

    /** Index a row from the DMS `documents` table. */
    public function indexDocument(Document $doc): int
    {
        $text = trim((string) $doc->ocr_content);
        if ($text === '') {
            return 0;
        }
        return $this->indexContent([
            'source_type' => 'document',
            'source_id' => $doc->id,
            'source_ref' => $doc->title,
            'title' => $doc->title,
            'content' => $text,
        ]);
    }

    // ── Retrieval ──────────────────────────────────────────────────────

    /**
     * Semantic search. Returns the top-K most relevant chunks.
     *
     * @return array<int, array{title:string, source_type:string, source_ref:?string, score:float, content:string}>
     */
    public function search(string $query, int $k = 5, ?string $sourceType = null, ?string $tenantId = null): array
    {
        $query = trim($query);
        if ($query === '') {
            return [];
        }

        $qvec = $this->embed($query, 'RETRIEVAL_QUERY');
        if (!$qvec) {
            return [];
        }

        $rows = KnowledgeChunk::query()
            ->when($sourceType, fn ($q) => $q->where('source_type', $sourceType))
            ->when($tenantId, fn ($q) => $q->where(fn ($w) => $w->whereNull('tenant_id')->orWhere('tenant_id', $tenantId)))
            ->get(['title', 'source_type', 'source_ref', 'content', 'embedding']);

        $scored = [];
        foreach ($rows as $row) {
            $vec = $row->embedding;
            if (!is_array($vec) || empty($vec)) {
                continue;
            }
            $scored[] = [
                'title' => $row->title,
                'source_type' => $row->source_type,
                'source_ref' => $row->source_ref,
                'score' => round($this->dot($qvec, $vec), 4),
                'content' => $row->content,
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, max(1, $k));
    }

    public function count(): int
    {
        return KnowledgeChunk::count();
    }

    // ── Internals ──────────────────────────────────────────────────────

    /** Call Gemini embedContent and return an L2-normalized vector. */
    public function embed(string $text, string $taskType = 'RETRIEVAL_DOCUMENT'): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:embedContent?key={$this->apiKey}";
        $payload = [
            'model' => "models/{$this->model}",
            'content' => ['parts' => [['text' => mb_substr($text, 0, 8000)]]],
            'taskType' => $taskType,
            'outputDimensionality' => $this->dims,
        ];

        try {
            $resp = Http::withOptions(['verify' => $this->caBundle()])->timeout(30)->post($url, $payload);
            if ($resp->successful()) {
                $vec = $resp->json()['embedding']['values'] ?? null;
                return is_array($vec) ? $this->normalize($vec) : null;
            }
            Log::warning('[KnowledgeBase] embed HTTP ' . $resp->status() . ': ' . $resp->body());
        } catch (\Throwable $e) {
            Log::error('[KnowledgeBase] embed exception: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Embed many texts in one call. Returns an array aligned to the input
     * (each entry a normalized vector, or null on failure).
     */
    public function embedBatch(array $texts, string $taskType = 'RETRIEVAL_DOCUMENT'): array
    {
        if (!$this->isConfigured() || empty($texts)) {
            return [];
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:batchEmbedContents?key={$this->apiKey}";
        $requests = array_map(fn ($t) => [
            'model' => "models/{$this->model}",
            'content' => ['parts' => [['text' => mb_substr((string) $t, 0, 8000)]]],
            'taskType' => $taskType,
            'outputDimensionality' => $this->dims,
        ], array_values($texts));

        try {
            $resp = Http::withOptions(['verify' => $this->caBundle()])->timeout(60)
                ->post($url, ['requests' => $requests]);
            if ($resp->successful()) {
                $embs = $resp->json()['embeddings'] ?? [];
                return array_map(
                    fn ($e) => isset($e['values']) ? $this->normalize($e['values']) : null,
                    $embs
                );
            }
            Log::warning('[KnowledgeBase] batchEmbed HTTP ' . $resp->status() . ': ' . $resp->body());
        } catch (\Throwable $e) {
            Log::error('[KnowledgeBase] batchEmbed exception: ' . $e->getMessage());
        }

        return [];
    }

    /** Split text into overlapping chunks on paragraph/sentence boundaries. */
    protected function chunkText(string $text, int $maxChars = 1100, int $overlap = 150): array
    {
        $text = preg_replace('/\r\n?/', "\n", $text);
        $paras = preg_split('/\n{2,}/', trim($text)) ?: [];

        $chunks = [];
        $buf = '';
        foreach ($paras as $para) {
            $para = trim($para);
            if ($para === '') {
                continue;
            }
            if (mb_strlen($buf) + mb_strlen($para) + 2 <= $maxChars) {
                $buf = $buf === '' ? $para : $buf . "\n\n" . $para;
            } else {
                if ($buf !== '') {
                    $chunks[] = $buf;
                }
                // A single oversized paragraph is hard-split.
                if (mb_strlen($para) > $maxChars) {
                    foreach (str_split($para, $maxChars) as $piece) {
                        $chunks[] = $piece;
                    }
                    $buf = '';
                } else {
                    $buf = $para;
                }
            }
        }
        if ($buf !== '') {
            $chunks[] = $buf;
        }

        // Add a little overlap between consecutive chunks for context continuity.
        if ($overlap > 0 && count($chunks) > 1) {
            for ($i = 1; $i < count($chunks); $i++) {
                $tail = mb_substr($chunks[$i - 1], -$overlap);
                $chunks[$i] = $tail . ' ' . $chunks[$i];
            }
        }

        return $chunks;
    }

    protected function normalize(array $vec): array
    {
        $norm = 0.0;
        foreach ($vec as $v) {
            $norm += $v * $v;
        }
        $norm = sqrt($norm);
        if ($norm <= 0) {
            return $vec;
        }
        return array_map(fn ($v) => $v / $norm, $vec);
    }

    /** Dot product (== cosine similarity for normalized vectors). */
    protected function dot(array $a, array $b): float
    {
        $sum = 0.0;
        $n = min(count($a), count($b));
        for ($i = 0; $i < $n; $i++) {
            $sum += $a[$i] * $b[$i];
        }
        return $sum;
    }

    protected function caBundle(): bool|string
    {
        $ca = env('CURL_CA_BUNDLE') ?: storage_path('cacert.pem');
        return (is_string($ca) && is_file($ca)) ? $ca : true;
    }
}
