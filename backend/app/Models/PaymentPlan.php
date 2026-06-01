<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentPlan extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'total_installments',
        'unpaid_installments',
        'monthly_amount',
        'status', // 'active', 'completed', 'rescheduled', 'cancelled'
        'start_date',
    ];

    protected $casts = [
        'monthly_amount' => 'decimal:2',
        'start_date' => 'date',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Check if all installments have been paid.
     */
    public function isFullyPaid(): bool
    {
        return $this->unpaid_installments <= 0;
    }

    /**
     * Get total paid amount across all installments.
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->where('status', 'paid')->sum('amount');
    }

    /**
     * Get total outstanding amount.
     */
    public function getOutstandingAmountAttribute(): float
    {
        return (float) ($this->monthly_amount * $this->unpaid_installments);
    }
}
