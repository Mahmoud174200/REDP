<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPaymentPlan extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'project_id',
        'name',
        'name_ar',
        'down_payment_pct',
        'installments',
        'discount_pct',
        'description',
        'settings',
    ];

    protected $casts = [
        'down_payment_pct' => 'decimal:2',
        'discount_pct' => 'decimal:2',
        'installments' => 'integer',
        'settings' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
