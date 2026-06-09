<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExchangeRate extends Model
{
    use HasUuids;

    protected $table = 'exchange_rates';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'from_currency_id',
        'to_currency_id',
        'rate',
        'last_updated_at',
    ];

    protected $casts = [
        'rate' => 'decimal:6',
        'last_updated_at' => 'datetime',
    ];

    public function fromCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'from_currency_id');
    }

    public function toCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'to_currency_id');
    }
}
