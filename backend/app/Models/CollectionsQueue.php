<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollectionsQueue extends Model
{
    protected $table = 'collections_queue';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'client_id',
        'aging_bucket', // '30_days', '60_days', '90_days_plus'
        'outstanding_amount',
        'promise_to_pay_date',
        'status', // 'active', 'promised', 'resolved', 'escalated'
        'notes',
    ];

    protected $casts = [
        'outstanding_amount' => 'decimal:2',
        'promise_to_pay_date' => 'date',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Scope: active collections only.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'promised']);
    }

    /**
     * Scope: filter by aging bucket.
     */
    public function scopeBucket($query, string $bucket)
    {
        return $query->where('aging_bucket', $bucket);
    }
}
