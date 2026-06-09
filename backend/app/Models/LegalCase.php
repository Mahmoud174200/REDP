<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class LegalCase extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'case_number', 'title', 'entity_type', 'entity_id', 'company_id',
        'type', 'status', 'priority', 'jurisdiction', 'court_name', 'description',
        'claim_amount', 'legal_fees', 'assigned_lawyer_id', 'opened_at', 'closed_at',
    ];

    protected $casts = [
        'claim_amount' => 'decimal:2',
        'legal_fees' => 'decimal:2',
        'opened_at' => 'date',
        'closed_at' => 'date',
    ];

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function lawyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_lawyer_id');
    }

    public function parties(): HasMany
    {
        return $this->hasMany(LegalParty::class, 'case_id');
    }

    public function courtSessions(): HasMany
    {
        return $this->hasMany(CourtSession::class, 'case_id')->orderBy('session_date', 'asc');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(LegalDocument::class, 'case_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(LegalAction::class, 'case_id')->orderBy('due_date', 'asc');
    }
}
