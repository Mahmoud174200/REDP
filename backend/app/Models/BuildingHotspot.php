<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuildingHotspot extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'building_id',
        'x_percent',
        'y_percent',
        'label',
        'pin_color',
    ];

    protected $casts = [
        'x_percent' => 'decimal:2',
        'y_percent' => 'decimal:2',
    ];

    // ── Relationships ──

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function building()
    {
        return $this->belongsTo(Building::class);
    }
}
