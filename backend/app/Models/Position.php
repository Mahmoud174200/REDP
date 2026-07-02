<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Position extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'title', 'code', 'company_id', 'department_id',
        'level', 'min_salary', 'max_salary', 'description',
        'responsibilities', 'status',
    ];

    protected $casts = [
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        'responsibilities' => 'array',
        'level' => 'integer',
    ];

    /**
     * Position levels:
     * 1 = C-Suite (CEO, CFO, CTO)
     * 2 = Vice President
     * 3 = Director
     * 4 = Manager
     * 5 = Senior Staff
     * 6 = Staff
     * 7 = Junior
     * 8 = Intern
     */
    public const LEVELS = [
        1 => 'C-Suite',
        2 => 'Vice President',
        3 => 'Director',
        4 => 'Manager',
        5 => 'Senior Staff',
        6 => 'Staff',
        7 => 'Junior',
        8 => 'Intern',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function getLevelNameAttribute(): string
    {
        return self::LEVELS[$this->level] ?? 'Unknown';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
