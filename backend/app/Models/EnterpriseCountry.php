<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnterpriseCountry extends Model
{
    use HasUuids;

    protected $table = 'enterprise_countries';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'code', 'phone_code', 'currency_code',
        'timezone', 'flag_emoji', 'status',
    ];

    // ── Relationships ──

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'country_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'country_id');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
