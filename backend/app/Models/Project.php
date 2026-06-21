<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'location',
        'total_units',
        'status', // 'planning', 'active', 'completed'
        'delivery_date',
        'released_phases',
        'image_url',
        'master_plan_image_url',
        // Master Plan fields
        'land_area',
        'land_area_unit',
        'building_ratio',
        'max_height_allowed',
        'max_floors_allowed',
        'total_buildings_count',
        'total_built_area',
        'total_green_area',
        'total_roads_area',
        'total_parking_spaces',
        'infrastructure_notes',
        'density_per_feddan',
        'master_plan_status',
        'project_type',
    ];

    protected $casts = [
        'released_phases' => 'array',
        'land_area' => 'decimal:2',
        'building_ratio' => 'decimal:2',
        'max_height_allowed' => 'decimal:2',
        'total_built_area' => 'decimal:2',
        'total_green_area' => 'decimal:2',
        'total_roads_area' => 'decimal:2',
        'density_per_feddan' => 'decimal:2',
    ];

    public function getReleasedPhasesAttribute($value)
    {
        if (!$value) {
            return ['Phase 1'];
        }
        $val = json_decode($value, true);
        return empty($val) ? ['Phase 1'] : $val;
    }

    // ── Relationships ──

    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    public function buildings()
    {
        return $this->hasMany(Building::class)->orderBy('sort_order');
    }

    public function amenities()
    {
        return $this->hasMany(ProjectAmenity::class);
    }

    public function paymentPlans()
    {
        return $this->hasMany(ProjectPaymentPlan::class);
    }

    public function media()
    {
        return $this->hasMany(ProjectMedia::class);
    }

    public function hotspots()
    {
        return $this->hasMany(BuildingHotspot::class);
    }

    // ── Accessors ──

    /**
     * Get a comprehensive master plan summary.
     */
    public function getMasterPlanSummaryAttribute(): array
    {
        $buildings = $this->buildings;
        $units = $this->units()->whereNotNull('building_id')->get();

        $totalUnits = $units->count();
        $availableUnits = $units->where('status', 'available')->count();
        $soldUnits = $units->where('status', 'sold')->count();
        $reservedUnits = $units->where('status', 'reserved')->count();

        // Land area in sqm for calculations
        $landAreaSqm = $this->land_area;
        if ($this->land_area_unit === 'feddan') {
            $landAreaSqm = $this->land_area * 4200;
        } elseif ($this->land_area_unit === 'acre') {
            $landAreaSqm = $this->land_area * 4046.86;
        }

        return [
            'total_buildings' => $buildings->count(),
            'total_units' => $totalUnits,
            'available_units' => $availableUnits,
            'sold_units' => $soldUnits,
            'reserved_units' => $reservedUnits,
            'total_built_area' => $buildings->sum('total_built_area'),
            'land_area_sqm' => $landAreaSqm,
            'density' => $landAreaSqm > 0
                ? round($totalUnits / ($landAreaSqm / 4200), 2)
                : null,
            'building_types' => $buildings->groupBy('type')->map->count(),
            'total_parking' => $buildings->sum('parking_capacity'),
            'amenities_count' => $this->amenities->count(),
        ];
    }
}

