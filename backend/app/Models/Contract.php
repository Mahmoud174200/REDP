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
        'is_custom_plan',
        'plan_approval_status', // 'not_required', 'pending', 'approved', 'rejected'
        'plan_approval_notes',
        'plan_reviewed_by',
        'plan_reviewed_at',
        'status', // 'draft', 'pending_signature', 'active', 'completed', 'cancelled', 'withdrawn'
        'withdrawal_status', // 'none', 'reminder', 'warning', 'final_notice', 'withdrawn'
        'notes',
        'signed_at',
        'accounting_handover_at',
        'accounting_handover_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'signed_at' => 'datetime',
        'accounting_handover_at' => 'datetime',
        'is_custom_plan' => 'boolean',
        'plan_reviewed_at' => 'datetime',
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

        // Base the next sequence on the highest existing number (not the row count),
        // so deleting/replacing contracts can't produce a duplicate.
        $last = static::where('contract_number', 'like', "{$prefix}-{$year}-%")
            ->orderByDesc('contract_number')
            ->value('contract_number');

        $seq = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        // Guard against any gaps/races.
        do {
            $number = sprintf('%s-%s-%04d', $prefix, $year, $seq);
            $seq++;
        } while (static::where('contract_number', $number)->exists());

        return $number;
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
