<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'assigned_agent_id',
        'stage', // 'new', 'contacted', 'qualified', 'meeting_scheduled', 'negotiation', 'reserved', 'closed_won', 'closed_lost'
        'kyc_status', // 'none', 'pending', 'verified', 'rejected'
        'source', // 'facebook', 'google', 'broker', 'direct'
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }
}
