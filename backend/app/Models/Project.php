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
    ];

    protected $casts = [
        'released_phases' => 'array',
    ];

    public function getReleasedPhasesAttribute($value)
    {
        if (!$value) {
            return ['Phase 1'];
        }
        $val = json_decode($value, true);
        return empty($val) ? ['Phase 1'] : $val;
    }

    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    public function paymentPlans()
    {
        return $this->hasMany(ProjectPaymentPlan::class);
    }

    public function media()
    {
        return $this->hasMany(ProjectMedia::class);
    }
}

