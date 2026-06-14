<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\Auditable;

class Payment extends Model
{
    use HasUuids, Auditable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'payment_plan_id',
        'amount',
        'penalty_amount',
        'penalty_waived',
        'status', // 'pending', 'paid', 'failed', 'refunded'
        'transaction_reference',
        'gateway', // 'stripe', 'fawry', 'bank_transfer', 'cash'
        'paid_at',
        'due_date',
        'installment_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'penalty_waived' => 'boolean',
        'paid_at' => 'datetime',
        'due_date' => 'date',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function paymentPlan()
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    /**
     * Check if this payment is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_date && $this->due_date->isPast();
    }

    /**
     * Get aging bucket for collections.
     */
    public function getAgingBucketAttribute(): ?string
    {
        if (!$this->isOverdue()) {
            return null;
        }

        $daysOverdue = $this->due_date->diffInDays(now());

        if ($daysOverdue <= 30) return '30_days';
        if ($daysOverdue <= 60) return '60_days';
        return '90_days_plus';
    }
}
