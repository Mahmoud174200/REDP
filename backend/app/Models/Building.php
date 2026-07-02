<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'name',
        'name_ar',
        'type',
        'total_floors',
        'has_basement',
        'basement_floors',
        'has_roof_floor',
        'has_elevator',
        'elevator_count',
        'staircase_count',
        'building_footprint_area',
        'total_built_area',
        'lobby_area',
        'common_area_per_floor',
        'parking_type',
        'parking_capacity',
        'status',
        'sort_order',
        'notes',
    ];

    protected $casts = [
        'has_basement' => 'boolean',
        'has_roof_floor' => 'boolean',
        'has_elevator' => 'boolean',
        'building_footprint_area' => 'decimal:2',
        'total_built_area' => 'decimal:2',
        'lobby_area' => 'decimal:2',
        'common_area_per_floor' => 'decimal:2',
    ];

    // ── Relationships ──

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function floors()
    {
        return $this->hasMany(BuildingFloor::class)->orderBy('floor_number');
    }

    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    public function hotspot()
    {
        return $this->hasOne(BuildingHotspot::class);
    }

    // ── Accessors ──

    /**
     * Total number of units in this building (computed).
     */
    public function getUnitsCountAttribute(): int
    {
        return $this->units()->count();
    }

    /**
     * Total number of all floors including basements and roof.
     */
    public function getAllFloorsCountAttribute(): int
    {
        $total = $this->total_floors;
        if ($this->has_basement) {
            $total += $this->basement_floors ?: 1;
        }
        if ($this->has_roof_floor) {
            $total += 1;
        }
        return $total;
    }

    /**
     * Auto-generate the floor label based on number.
     */
    public static function generateFloorLabel(int $floorNumber): string
    {
        if ($floorNumber < 0) {
            $level = abs($floorNumber);
            return "بدروم {$level}";
        }
        if ($floorNumber === 0) {
            return 'الدور الأرضي';
        }

        $labels = [
            1 => 'الدور الأول',
            2 => 'الدور الثاني',
            3 => 'الدور الثالث',
            4 => 'الدور الرابع',
            5 => 'الدور الخامس',
            6 => 'الدور السادس',
            7 => 'الدور السابع',
            8 => 'الدور الثامن',
            9 => 'الدور التاسع',
            10 => 'الدور العاشر',
        ];

        return $labels[$floorNumber] ?? "الدور {$floorNumber}";
    }
}
