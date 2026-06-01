<?php

namespace App\Events\Finance;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UnitStatusChanged
{
    use Dispatchable, SerializesModels;

    public string $unitId;
    public string $previousStatus;
    public string $newStatus;
    public ?string $changedBy;

    /**
     * Create a new event instance.
     */
    public function __construct(string $unitId, string $previousStatus, string $newStatus, ?string $changedBy = null)
    {
        $this->unitId = $unitId;
        $this->previousStatus = $previousStatus;
        $this->newStatus = $newStatus;
        $this->changedBy = $changedBy;
    }
}
