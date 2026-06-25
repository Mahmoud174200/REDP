<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Reservation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'unit_id',
        'client_id',
        'broker_id',
        'eoi_amount',
        'payment_receipt_path',
        'status', // 'pending', 'confirmed', 'cancelled', 'expired'
        'expires_at',
        'approval_notes',
        'cancelled_by',
        'cancellation_reason',
    ];

    /**
     * Scan database and automatically release expired reservation holds.
     */
    public static function checkAndReleaseExpired()
    {
        // A hold expires after its window UNLESS the client has actually signed
        // (an 'active'/'completed' contract). An unsigned draft — including the
        // auto-generated placeholder — does NOT protect the hold.
        $expired = self::where('status', 'confirmed')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->whereDoesntHave('contract', function ($q) {
                $q->whereIn('status', ['active', 'completed']);
            })
            ->get();

        foreach ($expired as $res) {
            DB::transaction(function () use ($res) {
                // 0. Clean up any unsigned contract (draft/placeholder) attached to this hold
                $contract = $res->contract;
                if ($contract && !in_array($contract->status, ['active', 'completed'])) {
                    if ($contract->paymentPlan) {
                        Payment::where('payment_plan_id', $contract->paymentPlan->id)->delete();
                        $contract->paymentPlan->delete();
                    }
                    Payment::where('contract_id', $contract->id)->delete();
                    $contract->delete();
                }

                // 1. Mark reservation as expired
                $res->update(['status' => 'expired']);

                // 2. Set unit back to available if it is currently reserved
                $unit = $res->unit;
                if ($unit && $unit->status === 'reserved') {
                    $unit->update(['status' => 'available']);
                    
                    event(new \App\Events\Finance\UnitStatusChanged(
                        $unit->id,
                        'reserved',
                        'available',
                        null
                    ));
                }

                // 3. Reset associated lead back to negotiation stage if it is in reserved stage
                if ($res->client) {
                    $lead = \App\Models\Lead::where('email', $res->client->email)->first();
                    if ($lead && $lead->status === \App\Models\Lead::STATUS_RESERVED) {
                        $lead->update(['status' => \App\Models\Lead::STATUS_NEGOTIATION]);
                    }
                }

                // 4. Record audit log (for refunds / release tracking)
                \App\Services\AuditLogService::log('RESERVATION_EXPIRED', null, [
                    'reservation_id' => $res->id,
                    'unit_id'        => $res->unit_id,
                    'client_id'      => $res->client_id,
                    'refund_amount'  => (float) $res->eoi_amount,
                ]);
            });
        }
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function broker()
    {
        return $this->belongsTo(Broker::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function contract()
    {
        return $this->hasOne(Contract::class);
    }
}
