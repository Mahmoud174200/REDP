<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoqItem extends Model
{
    use HasUuids;

    protected $table = 'boq_items';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'phase_id',
        'item_code',
        'description',
        'unit',
        'planned_quantity',
        'actual_quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'planned_quantity' => 'decimal:2',
        'actual_quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function phase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class, 'phase_id');
    }
}
