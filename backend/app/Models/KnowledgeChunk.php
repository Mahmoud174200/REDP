<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * A single embedded chunk of company knowledge for the RAG knowledge base.
 */
class KnowledgeChunk extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'source_type',
        'source_id',
        'source_ref',
        'title',
        'content',
        'embedding',
        'chunk_index',
        'tenant_id',
        'metadata',
    ];

    protected $casts = [
        'embedding' => 'array',
        'metadata' => 'array',
        'chunk_index' => 'integer',
    ];
}
