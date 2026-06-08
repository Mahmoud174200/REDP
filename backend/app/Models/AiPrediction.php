<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AiPrediction extends Model
{
    use HasUuids;

    protected $table = 'ai_predictions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'company_id',
        'model_name',
        'entity_type',
        'entity_id',
        'prediction_score',
        'prediction_output',
        'status',
    ];

    protected $casts = [
        'prediction_score' => 'decimal:2',
        'prediction_output' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
