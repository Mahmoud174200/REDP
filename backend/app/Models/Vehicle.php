<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'make',
        'model',
        'color',
        'plate_number',
        'year',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
