<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Unit extends Model
{
    use Auditable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'building_id',
        'floor_id',
        'unit_number',
        'floor',
        'type', // 'apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'
        'area', // in square meters
        'net_area',
        'finishing_type',
        'bedrooms',
        'bathrooms',
        'living_rooms',
        'kitchen_count',
        'balcony_count',
        'balcony_area',
        'has_maid_room',
        'has_storage',
        'has_private_garden',
        'has_private_parking',
        'view_type', // 'garden', 'pool', 'street', 'sea', 'landmark'
        'orientation',
        'building',
        'layout_description',
        'layout_image_url',
        'model_3d_status',
        'model_3d_url',
        'tripo_task_id',
        'tripo_error_msg',
        'model_generated_at',
        'price',
        'min_down_payment',
        'status', // 'available', 'reserved', 'sold', 'hidden', 'coming_soon', 'frozen'
        'handover_date',
        'phase',
        'handover_status',
        'handover_report',
        'handover_images',
        'handover_signature',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'min_down_payment' => 'decimal:2',
        'area' => 'decimal:2',
        'net_area' => 'decimal:2',
        'balcony_area' => 'decimal:2',
        'has_maid_room' => 'boolean',
        'has_storage' => 'boolean',
        'has_private_garden' => 'boolean',
        'has_private_parking' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function buildingRef()
    {
        return $this->belongsTo(Building::class, 'building_id');
    }

    public function floorRef()
    {
        return $this->belongsTo(BuildingFloor::class, 'floor_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function activeReservation()
    {
        return $this->hasOne(Reservation::class)->where('status', 'confirmed');
    }

    /**
     * Scope: Only available units.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope: Filter by project.
     */
    public function scopeByProject($query, string $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope: Filter by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Filter by price range.
     */
    public function scopePriceRange($query, float $min, float $max)
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    /**
     * Check if unit can be reserved.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
