<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'tenants';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'subdomain',
        'domain',
        'status',
        'branding',
        'settings',
    ];

    protected $casts = [
        'branding' => 'array',
        'settings' => 'array',
    ];

    protected static ?string $currentTenantId = null;

    /**
     * Set the active tenant ID in current request context.
     */
    public static function setCurrentId(?string $id): void
    {
        self::$currentTenantId = $id;
    }

    /**
     * Get the active tenant ID in current request context.
     */
    public static function currentId(): ?string
    {
        return self::$currentTenantId;
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(TenantSubscription::class);
    }
}
