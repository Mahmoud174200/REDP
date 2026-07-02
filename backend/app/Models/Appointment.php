<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Appointment extends Model
{
    use HasUuids;

    protected $table = 'appointments';
    protected $keyType = 'string';
    public $incrementing = false;

    /** Appointment type for the payment-plan setup meeting at the developer office. */
    public const TYPE_PAYMENT_PLAN = 'payment_plan';

    public const STATUS_PENDING   = 'pending';   // awaiting rep/time assignment
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'id',
        'user_id',
        'lead_id',
        'project_id',
        'unit_id',
        'reservation_id',
        'eoi_reservation_id',
        'assigned_rep_id',
        'rep_name',
        'rep_phone',
        'rep_title',
        'location',
        'notes',
        'type',
        'booking_date',
        'booking_time',
        'booking_type',
        'scheduled_at',
        'status', // 'pending', 'confirmed', 'cancelled'
        'remind_email',
        'remind_sms',
        'remind_whatsapp',
        'email_sent',
        'sms_sent',
        'whatsapp_sent',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'scheduled_at' => 'datetime',
        'remind_email' => 'boolean',
        'remind_sms' => 'boolean',
        'remind_whatsapp' => 'boolean',
        'email_sent' => 'boolean',
        'sms_sent' => 'boolean',
        'whatsapp_sent' => 'boolean',
    ];

    /**
     * Relationship: User (Client)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relationship: Lead
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * Relationship: the developer representative the client will meet.
     */
    public function assignedRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_rep_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id');
    }

    public function scopePaymentPlan($query)
    {
        return $query->where('type', self::TYPE_PAYMENT_PLAN);
    }
}
