<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionPayoutRequest extends Model
{
    use HasUuids;

    protected $table = 'commission_payout_requests';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'broker_id',
        'amount',
        'invoice_path',
        'status', // pending_review, approved, rejected, paid
        'rejection_reason',
    ];

    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }
}
