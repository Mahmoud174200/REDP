<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Console\Command;

/**
 * Notifies clients before an installment falls due (default: 3 days and 1 day
 * before). Runs daily; each payment matches a single offset day so no dedup
 * tracking is needed.
 *
 * Usage: php artisan payments:send-reminders [--days=3,1]
 */
class SendInstallmentReminders extends Command
{
    protected $signature = 'payments:send-reminders {--days=3,1 : Comma-separated days-before offsets}';
    protected $description = 'Send upcoming-installment reminders to clients';

    public function handle(): int
    {
        $offsets = array_filter(array_map('intval', explode(',', (string) $this->option('days'))));
        $sent = 0;

        foreach ($offsets as $days) {
            $date = now()->addDays($days)->toDateString();

            $payments = Payment::whereNull('paid_at')
                ->whereColumn('paid_amount', '<', 'amount')
                ->whereDate('due_date', $date)
                ->whereHas('contract', fn($q) => $q->whereIn('status', ['active', 'completed']))
                ->with(['contract.client', 'contract.unit'])
                ->get();

            foreach ($payments as $p) {
                $client = $p->contract?->client;
                if (!$client) continue;

                $unitNo = $p->contract->unit->unit_number ?? '';
                $amount = number_format((float) $p->amount, 2);
                $due = $p->due_date->format('F j, Y');

                try {
                    NotificationService::send(
                        $client->id,
                        'push',
                        $client->email,
                        "Installment due in {$days} day(s) / قسط مستحق خلال {$days} يوم",
                        "Reminder: your installment of EGP {$amount} for Unit {$unitNo} is due on {$due}. "
                        . "Please make sure it is settled on time. / تذكير: قسطك بقيمة {$amount} جنيه للوحدة {$unitNo} مستحق يوم {$due}."
                    );
                    $sent++;
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error("Installment reminder failed for payment {$p->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Sent {$sent} installment reminder(s).");
        return self::SUCCESS;
    }
}
