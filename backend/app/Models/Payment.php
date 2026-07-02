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
        'paid_amount',
        'penalty_amount',
        'penalty_waived',
        'status', // 'paid', 'upcoming', 'overdue', 'partial'
        'transaction_reference',
        'gateway', // 'stripe', 'fawry', 'bank_transfer', 'cash'
        'paid_at',
        'due_date',
        'installment_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'penalty_waived' => 'boolean',
        'paid_at' => 'datetime',
        'due_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($payment) {
            $paidAmount = (float) ($payment->paid_amount ?? 0);
            $amount = (float) $payment->amount;

            if ($paidAmount >= $amount) {
                $payment->status = 'paid';
            } elseif ($paidAmount > 0) {
                $payment->status = 'partial';
            } elseif ($payment->due_date && $payment->due_date->isPast()) {
                $payment->status = 'overdue';
            } else {
                $payment->status = 'upcoming';
            }
        });
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function paymentPlan()
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    /**
     * Get dynamic status attribute.
     */
    public function getStatusAttribute($value): string
    {
        $paidAmount = (float) ($this->attributes['paid_amount'] ?? 0);
        $amount = (float) $this->amount;

        if ($paidAmount >= $amount) {
            return 'paid';
        }
        if ($paidAmount > 0) {
            return 'partial';
        }
        if ($this->due_date && $this->due_date->isPast()) {
            return 'overdue';
        }
        return 'upcoming';
    }

    /**
     * Check if this payment is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->paid_amount < $this->amount && $this->due_date && $this->due_date->isPast();
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
