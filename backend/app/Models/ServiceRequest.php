<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'unit_id',
        'service_type', // 'electrician', 'plumber', 'carpenter', 'ac_technician', 'painter', 'general'
        'title',
        'description',
        'priority', // 'low', 'medium', 'high', 'urgent'
        'status', // 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
        'assigned_vendor',
        'scheduled_at',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
