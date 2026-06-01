<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Broker extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'agency_name',
        'commission_rate', // decimal
        'status', // 'pending', 'approved', 'suspended'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
