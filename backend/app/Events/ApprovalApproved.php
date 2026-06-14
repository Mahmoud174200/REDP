<?php

namespace App\Events;

use App\Models\ApprovalInstance;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalApproved
{
    use Dispatchable, SerializesModels;

    public ApprovalInstance $instance;

    public function __construct(ApprovalInstance $instance)
    {
        $this->instance = $instance;
    }
}
