<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'lead_id',
        'channel', // 'email', 'sms', 'whatsapp', 'push'
        'recipient',
        'title',
        'content',
        'status', // 'pending', 'sent', 'failed'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
