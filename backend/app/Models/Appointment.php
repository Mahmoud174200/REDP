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

    protected $fillable = [
        'id',
        'user_id',
        'lead_id',
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
}
