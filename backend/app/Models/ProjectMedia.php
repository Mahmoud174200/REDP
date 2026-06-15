<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectMedia extends Model
{
    protected $table = 'project_media';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'media_type',   // 'building', 'floor_plan'
        'reference_key', // building name or "BuildingName|FloorNum"
        'image_path',
        'caption',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Scope: Filter by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('media_type', $type);
    }

    /**
     * Scope: Filter by reference key.
     */
    public function scopeByRef($query, string $key)
    {
        return $query->where('reference_key', $key);
    }

    /**
     * Get full URL for the image.
     */
    public function getImageUrlAttribute(): string
    {
        return asset('storage/' . $this->image_path);
    }
}
