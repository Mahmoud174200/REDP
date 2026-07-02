<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuditLog extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'action', // e.g., 'UNIT_LOCK', 'CONTRACT_SIGN', 'LEAD_CREATE'
        'entity_type',
        'entity_id',
        'ip_address',
        'details', // json field
        'old_values',
        'new_values',
        'user_agent',
        'device_type',
        'browser',
        'geo_location',
        'session_id',
    ];

    protected $casts = [
        'details' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'geo_location' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
