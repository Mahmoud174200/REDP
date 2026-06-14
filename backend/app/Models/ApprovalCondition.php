<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalCondition extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    // This table has created_at but no updated_at
    public $timestamps = false;

    protected $fillable = [
        'id', 'step_id', 'field', 'operator', 'value', 'logic',
    ];

    public function step(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'step_id');
    }
}
