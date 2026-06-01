<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceTicket extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'client_id',
        'unit_id',
        'category', // 'plumbing', 'electrical', 'structural', 'other'
        'title',
        'description',
        'status', // 'open', 'assigned', 'resolved', 'closed'
        'priority', // 'low', 'medium', 'high', 'critical'
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
