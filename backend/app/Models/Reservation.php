<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'unit_id',
        'client_id',
        'eoi_amount',
        'status', // 'pending', 'confirmed', 'cancelled', 'expired'
        'expires_at',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
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
