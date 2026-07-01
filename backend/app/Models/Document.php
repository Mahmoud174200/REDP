<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $table = 'documents';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'title',
        'document_type', // e.g. delivery_receipt
        'unit_id',
        'file_path',
        'ocr_content',
        'status', // 'indexed', 'failed', 'processing'
        'signed_at',
        'signed_by',
    ];

    protected $casts = [
        'signed_at'  => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const TYPE_DELIVERY_RECEIPT = 'delivery_receipt';
}
