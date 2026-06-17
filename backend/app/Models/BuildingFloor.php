<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BuildingFloor extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'building_id',
        'floor_number',
        'floor_label',
        'floor_type',
        'gross_area',
        'common_area',
        'net_usable_area',
        'units_count',
        'ceiling_height',
        'notes',
    ];

    protected $casts = [
        'gross_area' => 'decimal:2',
        'common_area' => 'decimal:2',
        'net_usable_area' => 'decimal:2',
        'ceiling_height' => 'decimal:2',
    ];

    // ── Relationships ──

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function units()
    {
        return $this->hasMany(Unit::class, 'floor_id');
    }

    // ── Accessors ──

    /**
     * Actual number of units on this floor (computed from units table).
     */
    public function getActualUnitsCountAttribute(): int
    {
        return $this->units()->count();
    }

    /**
     * Detect floor type from floor number.
     */
    public static function detectFloorType(int $floorNumber, int $totalFloors, bool $hasRoof): string
    {
        if ($floorNumber < 0) return 'basement';
        if ($floorNumber === 0) return 'ground';
        if ($hasRoof && $floorNumber === $totalFloors) return 'roof';
        return 'typical';
    }
}
