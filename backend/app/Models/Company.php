<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'legal_name', 'registration_number', 'tax_id',
        'type', 'parent_company_id', 'logo_url', 'address', 'city',
        'country_id', 'phone', 'email', 'website', 'status', 'settings',
        'developer_brokerage_rate', 'owner_commission_rate', 'leader_commission_rate', 'agent_commission_rate',
    ];

    protected $casts = [
        'settings' => 'array',
        'developer_brokerage_rate' => 'float',
        'owner_commission_rate' => 'float',
        'leader_commission_rate' => 'float',
        'agent_commission_rate' => 'float',
    ];

    // ── Relationships ──

    public function parentCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'parent_company_id');
    }

    public function subsidiaries(): HasMany
    {
        return $this->hasMany(Company::class, 'parent_company_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(EnterpriseCountry::class, 'country_id');
    }

    public function regions(): HasMany
    {
        return $this->hasMany(Region::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(EmployeeHierarchy::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function delegations(): HasMany
    {
        return $this->hasMany(Delegation::class);
    }

    // ── Computed ──

    /**
     * Get the full company hierarchy tree (recursive).
     */
    public function getHierarchyTree(): array
    {
        $tree = $this->toArray();
        $tree['subsidiaries'] = $this->subsidiaries->map(function ($sub) {
            return $sub->getHierarchyTree();
        })->toArray();
        return $tree;
    }

    /**
     * Get all ancestor companies up to the holding.
     */
    public function getAncestors(): \Illuminate\Support\Collection
    {
        $ancestors = collect();
        $current = $this->parentCompany;
        while ($current) {
            $ancestors->push($current);
            $current = $current->parentCompany;
        }
        return $ancestors;
    }

    /**
     * Check if this is a holding company.
     */
    public function isHolding(): bool
    {
        return $this->type === 'holding';
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeHolding($query)
    {
        return $query->where('type', 'holding');
    }

    public function scopeSubsidiaries($query)
    {
        return $query->where('type', 'subsidiary');
    }
}
