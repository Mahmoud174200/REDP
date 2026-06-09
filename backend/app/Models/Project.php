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
    ];

    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    public function paymentPlans()
    {
        return $this->hasMany(ProjectPaymentPlan::class);
    }
}
