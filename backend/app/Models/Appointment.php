<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointments';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'type',
        'scheduled_at',
        'status', // 'pending', 'confirmed', 'cancelled'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
