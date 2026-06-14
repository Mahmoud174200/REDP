<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorQuotation extends Model
{
    use HasUuids;

    protected $table = 'vendor_quotations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'rfq_id',
        'vendor_id',
        'submitted_date',
        'total_quoted_amount',
        'delivery_timeline_days',
        'notes',
        'status',
        'items',
    ];

    protected $casts = [
        'submitted_date' => 'datetime',
        'total_quoted_amount' => 'decimal:2',
        'items' => 'array',
    ];

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'vendor_quotation_id');
    }
}
