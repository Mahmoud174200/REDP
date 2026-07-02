<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReschedulingRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'contract_id',
        'reason',
        'current_installments',
        'proposed_installments_count',
        'proposed_monthly_amount',
        'status', // 'pending', 'approved', 'rejected'
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'proposed_monthly_amount' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
