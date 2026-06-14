<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResaleRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'unit_id',
        'asking_price',
        'reason',
        'status', // 'pending', 'approved', 'listed', 'sold', 'rejected', 'cancelled'
        'reviewed_by',
        'review_notes',
        'reviewed_at',
    ];

    protected $casts = [
        'asking_price' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
