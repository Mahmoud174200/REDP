<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
 * Model: EoiQueue (Expression of Interest Priority Queue)
 * Manages project launch express booking with microtime ordering.
 * ─────────────────────────────────────────────────────────
 */
class EoiQueue extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $table = 'eoi_queue';
    protected $keyType = 'string';
    public $incrementing = false;

    protected static function booted()
    {
        static::created(function ($eoiQueue) {
            $exists = EoiReservation::where('id', $eoiQueue->id)->exists();
            if (!$exists) {
                $lead = $eoiQueue->lead;
                $unitId = request()->input('unit_id') ?: null;
                if (!$unitId && $eoiQueue->notes) {
                    if (preg_match('/Reserved Unit:\s*([a-f0-9\-]{36})/i', $eoiQueue->notes, $matches)) {
                        $unitId = $matches[1];
                    }
                }

                EoiReservation::create([
                    'id' => $eoiQueue->id,
                    'lead_id' => $eoiQueue->lead_id,
                    'project_id' => $eoiQueue->project_id,
                    'unit_id' => $unitId,
                    'client_name' => $lead ? ($lead->first_name . ' ' . $lead->last_name) : 'Client',
                    'client_email' => $lead ? $lead->email : 'client@redp.com',
                    'client_phone' => $lead ? $lead->phone : '0000000000',
                    'client_location' => EoiReservation::LOCATION_INSIDE_EGYPT,
                    'payment_method' => EoiReservation::PAYMENT_BANK_TRANSFER,
                    'payment_amount' => $eoiQueue->eoi_amount ?: 50000.00,
                    'receipt_path' => 'eoi_queue_sync',
                    'status' => EoiReservation::STATUS_PENDING_REVIEW,
                ]);
            }
        });

        static::updated(function ($eoiQueue) {
            $res = EoiReservation::find($eoiQueue->id);
            if ($res) {
                $newStatus = null;
                if ($eoiQueue->status === self::STATUS_CONFIRMED && $res->status !== EoiReservation::STATUS_APPROVED) {
                    $newStatus = EoiReservation::STATUS_APPROVED;
                } elseif ($eoiQueue->status === self::STATUS_CANCELLED && $res->status !== EoiReservation::STATUS_REJECTED) {
                    $newStatus = EoiReservation::STATUS_REJECTED;
                }

                if ($newStatus) {
                    $res->status = $newStatus;
                    if ($newStatus === EoiReservation::STATUS_APPROVED) {
                        $res->order_number = $res->order_number ?: EoiReservation::generateOrderNumber();
                        $res->queue_number = $eoiQueue->queue_number;
                    }
                    $res->saveQuietly();
                }
            }
        });
    }

    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_EXPIRED   = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'id',
        'lead_id',
        'project_id',
        'queue_number',
        'priority_score',
        'status',
        'eoi_amount',
        'notes',
    ];

    protected $casts = [
        'queue_number'   => 'integer',
        'priority_score' => 'decimal:6',
        'eoi_amount'     => 'decimal:2',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    // ── Relationships ──

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ── Scopes ──

    public function scopeForProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority_score', 'asc');
    }
}
