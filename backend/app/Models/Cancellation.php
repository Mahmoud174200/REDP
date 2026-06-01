<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cancellation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'reason',
        'refund_amount',
        'penalty_amount',
        'penalty_percentage',
        'status', // 'pending', 'approved', 'processed', 'rejected'
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'penalty_percentage' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Calculate net refund after penalty deduction.
     */
    public function getNetRefundAttribute(): float
    {
        return (float) ($this->refund_amount - $this->penalty_amount);
    }
}
