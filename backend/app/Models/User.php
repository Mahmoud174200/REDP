<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Primary key is a UUID string.
     */
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'phone',
        'role', // 'admin', 'sales_agent', 'tele_sales', 'broker', 'company_sales', 'client', 'finance_officer', 'delivery_engineer', 'contractor'
        'status', // 'active', 'inactive', 'pending_kyc', 'verified'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // ── Tier-Level Helper Methods ──

    public function isTeleSales(): bool
    {
        return $this->role === 'tele_sales';
    }

    public function isBroker(): bool
    {
        return $this->role === 'broker';
    }

    public function isCompanySales(): bool
    {
        return $this->role === 'company_sales';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Get the numeric tier level for this user.
     * Returns 0 for non-sales roles.
     */
    public function getTierLevel(): int
    {
        return match ($this->role) {
            'tele_sales'    => 1,
            'broker'        => 2,
            'company_sales' => 3,
            'admin'         => 99, // Admin bypasses all tiers
            default         => 0,
        };
    }

    /**
     * Get the allowed API endpoint prefix for this user's tier.
     */
    public function getAllowedEndpoints(): array
    {
        return match ($this->role) {
            'tele_sales'    => ['/v1/sales/tele'],
            'broker'        => ['/v1/sales/broker'],
            'company_sales' => ['/v1/sales/company'],
            'admin'         => ['/v1/sales/tele', '/v1/sales/broker', '/v1/sales/company', '/v1/admin'],
            default         => [],
        };
    }

    // ── Model Relationships ──

    public function leads()
    {
        return $this->hasMany(Lead::class, 'assigned_agent_id');
    }

    /**
     * Leads assigned to this user as a tele-sales agent (Tier 1).
     */
    public function teleSalesLeads()
    {
        return $this->hasMany(Lead::class, 'tele_sales_agent_id');
    }

    /**
     * Leads assigned to this user as a company sales rep (Tier 3).
     */
    public function companySalesLeads()
    {
        return $this->hasMany(Lead::class, 'company_sales_agent_id');
    }

    public function broker()
    {
        return $this->hasOne(Broker::class, 'user_id');
    }

    /**
     * Client presentations made by this user (Tier 2 brokers).
     */
    public function presentations()
    {
        return $this->hasMany(ClientPresentation::class, 'broker_user_id');
    }

    /**
     * Journey log entries where this user was the actor.
     */
    public function journeyLogs()
    {
        return $this->hasMany(ClientJourneyLog::class, 'actor_user_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function maintenanceTickets()
    {
        return $this->hasMany(MaintenanceTicket::class, 'client_id');
    }
}
