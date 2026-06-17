<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\Auditable;

class Contract extends Model
{
    use HasUuids, Auditable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_number',
        'reservation_id',
        'unit_id',
        'client_id',
        'total_amount',
        'paid_amount',
        'document_path',
        'type', // 'sale', 'reservation', 'installment'
        'status', // 'draft', 'pending_signature', 'active', 'completed', 'cancelled', 'withdrawn'
        'withdrawal_status', // 'none', 'reminder', 'warning', 'final_notice', 'withdrawn'
        'notes',
        'signed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function paymentPlan()
    {
        return $this->hasOne(PaymentPlan::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function cancellation()
    {
        return $this->hasOne(Cancellation::class);
    }

    public function collectionsQueue()
    {
        return $this->hasMany(CollectionsQueue::class);
    }

    public function reschedulingRequests()
    {
        return $this->hasMany(ReschedulingRequest::class);
    }

    /**
     * Check if contract is fully paid.
     */
    public function isPaid(): bool
    {
        return $this->paid_amount >= $this->total_amount;
    }

    /**
     * Get outstanding amount.
     */
    public function getOutstandingAmountAttribute(): float
    {
        return (float) max(0, $this->total_amount - $this->paid_amount);
    }

    /**
     * Generate a unique contract number.
     */
    public static function generateContractNumber(): string
    {
        $prefix = 'REDP-CTR';
        $year = date('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $count);
    }

    /**
     * Scope: filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: active contracts only.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'pending_signature']);
    }
}
