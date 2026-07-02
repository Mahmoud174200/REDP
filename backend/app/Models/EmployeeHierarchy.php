<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeHierarchy extends Model
{
    use HasUuids;

    protected $table = 'employee_hierarchy';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'user_id', 'company_id', 'branch_id', 'department_id',
        'team_id', 'position_id', 'direct_manager_id', 'indirect_manager_id',
        'matrix_manager_id', 'employee_number', 'hire_date',
        'termination_date', 'status',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'termination_date' => 'date',
    ];

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function directManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'direct_manager_id');
    }

    public function indirectManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'indirect_manager_id');
    }

    public function matrixManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'matrix_manager_id');
    }

    // ── Helpers ──

    /**
     * Get the full reporting chain up to the CEO.
     */
    public function getReportingChain(): \Illuminate\Support\Collection
    {
        $chain = collect();
        $currentManagerId = $this->direct_manager_id;

        while ($currentManagerId) {
            $managerHierarchy = self::where('user_id', $currentManagerId)->first();
            if (!$managerHierarchy) break;

            $chain->push($managerHierarchy->load('user', 'position'));
            $currentManagerId = $managerHierarchy->direct_manager_id;

            // Safety: prevent infinite loops
            if ($chain->count() > 20) break;
        }

        return $chain;
    }

    /**
     * Get all direct reports under this employee.
     */
    public function directReports()
    {
        return self::where('direct_manager_id', $this->user_id)
            ->with(['user', 'position', 'department'])
            ->get();
    }

    /**
     * Get all reports recursively (entire subtree).
     */
    public function allSubordinates(): \Illuminate\Support\Collection
    {
        $subordinates = collect();
        $directReports = self::where('direct_manager_id', $this->user_id)->get();

        foreach ($directReports as $report) {
            $subordinates->push($report);
            $subordinates = $subordinates->merge($report->allSubordinates());
        }

        return $subordinates;
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForCompany($query, string $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
