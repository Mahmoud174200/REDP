<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CapaAction extends Model
{
    use HasUuids;

    protected $table = 'capa_actions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'ncr_id',
        'action_plan',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function ncrReport(): BelongsTo
    {
        return $this->belongsTo(NcrReport::class, 'ncr_id');
    }
}
