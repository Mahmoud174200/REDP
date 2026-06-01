<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'location',
        'total_units',
        'status', // 'planning', 'active', 'completed'
    ];

    public function units()
    {
        return $this->hasMany(Unit::class);
    }
}
