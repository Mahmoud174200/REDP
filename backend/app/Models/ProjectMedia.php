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
        // Tripo AI 3D Model fields
        'model_3d_status',   // 'pending', 'processing', 'completed', 'failed'
        'model_3d_url',      // path to .glb file or remote URL
        'tripo_task_id',     // Tripo task ID for polling
        'tripo_error_msg',   // Error message if failed
        'model_generated_at', // When model completed
    ];

    protected $casts = [
        'model_generated_at' => 'datetime',
    ];

    protected $appends = [
        'image_url',
        'model_3d_public_url',
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
    public function getImageUrlAttribute(): ?string
    {
        if (empty($this->image_path)) {
            return null;
        }
        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }
        return asset('storage/' . $this->image_path);
    }

    /**
     * Check if this media has a completed 3D model.
     */
    public function has3DModel(): bool
    {
        return $this->model_3d_status === 'completed' && !empty($this->model_3d_url);
    }

    /**
     * Check if 3D generation is currently in progress.
     */
    public function is3DProcessing(): bool
    {
        return in_array($this->model_3d_status, ['pending', 'processing']);
    }

    /**
     * Get the public URL for the 3D model file.
     */
    public function getModel3dPublicUrlAttribute(): ?string
    {
        if (!$this->model_3d_url) {
            return null;
        }

        // If it's already a full URL (external), return as-is
        if (str_starts_with($this->model_3d_url, 'http://') || str_starts_with($this->model_3d_url, 'https://')) {
            return $this->model_3d_url;
        }

        // Otherwise, it's a local storage path
        return asset('storage/' . $this->model_3d_url);
    }
}
