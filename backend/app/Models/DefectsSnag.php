<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefectsSnag extends Model
{
    protected $table = 'defects_snags';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'unit_id',
        'description',
        'severity', // 'low', 'medium', 'high', 'critical'
        'status',   // 'pending', 'resolved'
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
