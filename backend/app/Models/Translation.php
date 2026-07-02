<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Translation extends Model
{
    use HasUuids;

    protected $table = 'translations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'locale',
        'group',
        'key',
        'value',
    ];
}
