<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DashboardLayout extends Model
{
    use HasUuids;

    protected $table = 'dashboard_layouts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'role_type',
        'widgets',
    ];

    protected $casts = [
        'widgets' => 'array',
    ];
}
