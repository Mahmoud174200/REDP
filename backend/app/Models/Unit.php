<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'unit_number',
        'floor',
        'type', // 'apartment', 'villa', 'commercial'
        'price',
        'status', // 'available', 'reserved', 'sold', 'blocked'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
