<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowTemplate extends Model
{
    protected $table = 'workflow_templates';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'trigger_name',
        'action_name',
        'rules_payload',
        'active',
    ];

    protected $casts = [
        'rules_payload' => 'array',
        'active' => 'boolean',
    ];
}
