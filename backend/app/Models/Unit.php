<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'unit_number',
        'floor',
        'type', // 'apartment', 'villa', 'commercial', 'office', 'duplex', 'penthouse'
        'area', // in square meters
        'bedrooms',
        'bathrooms',
        'view_type', // 'garden', 'pool', 'street', 'sea', 'landmark'
        'building',
        'layout_description',
        'price',
        'status', // 'available', 'reserved', 'sold', 'hidden', 'coming_soon', 'frozen'
        'handover_date',
        'phase',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'area' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
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
