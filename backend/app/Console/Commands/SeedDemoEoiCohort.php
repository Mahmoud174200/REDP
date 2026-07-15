<?php

namespace App\Console\Commands;

use App\Models\EoiReservation;
use App\Models\Lead;
use App\Models\Project;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Seeds a launch-day cohort of approved EOI reservations.
 *
 * The queue engine only tells its story when there is a crowd to rank: a single
 * reservation reorders into itself. This builds a spread of buyers that differ on
 * exactly the axes the queue rules score — income, cash vs transfer, VIP, past
 * client, arrival time — so changing one weight visibly reshuffles the board.
 *
 *   php artisan demo:eoi-cohort "Golden Gates" --count=24
 */
class SeedDemoEoiCohort extends Command
{
    protected $signature = 'demo:eoi-cohort
                            {project? : Project name (or part of it). Defaults to the first project.}
                            {--count=24 : How many approved EOIs to create.}
                            {--fresh : Delete previously seeded cohort EOIs for this project first.}';

    protected $description = 'Seed a realistic cohort of approved EOI reservations so the queue engine has a crowd to rank.';

    /** Every lead this command owns lives on this domain, so --fresh never touches real data. */
    private const DOMAIN = '@demo-cohort.test';

    private const FIRST = [
        'Ahmed', 'Mohamed', 'Mahmoud', 'Youssef', 'Omar', 'Khaled', 'Tarek', 'Hany',
        'Sara', 'Nour', 'Mona', 'Dina', 'Yasmin', 'Heba', 'Rana', 'Salma',
        'Karim', 'Amr', 'Hossam', 'Sherif', 'Laila', 'Mariam', 'Farida', 'Aya',
    ];

    private const LAST = [
        'Mostafa', 'Ibrahim', 'El-Sayed', 'Hassan', 'Fouad', 'Nasser', 'Zaki', 'Sultan',
        'Ramzy', 'Shafik', 'Adel', 'Roshdy', 'Kamal', 'Sabry', 'Fahmy', 'Lotfy',
    ];

    private const JOBS = [
        'Marketing Manager', 'Surgeon', 'Civil Engineer', 'Bank Manager', 'Pharmacist',
        'Business Owner', 'IT Director', 'Lawyer', 'Airline Pilot', 'University Professor',
        'Financial Analyst', 'Architect',
    ];

    private const EDUCATION = [
        "Bachelor's Degree", "Master's Degree", 'PhD', "Bachelor's Degree", "Master's Degree",
    ];

    private const RESIDENCE = ['New Cairo', 'Sheikh Zayed', 'Maadi', 'Zamalek', 'Nasr City', 'October', 'Heliopolis'];

    public function handle(): int
    {
        $name = $this->argument('project');

        $project = $name
            ? Project::where('name', 'like', "%{$name}%")->first()
            : Project::first();

        if (! $project) {
            $this->error($name ? "No project matching \"{$name}\"." : 'No projects exist.');
            return self::FAILURE;
        }

        $count = max(1, min(200, (int) $this->option('count')));

        if ($this->option('fresh')) {
            $removed = $this->purge($project->id);
            $this->line("  Removed {$removed} previously seeded cohort reservations.");
        }

        $receipt = $this->ensureReceipt();

        $this->info("Seeding {$count} approved EOIs for \"{$project->name}\"…");
        $bar = $this->output->createProgressBar($count);

        for ($i = 0; $i < $count; $i++) {
            $this->makeBuyer($project->id, $i, $count, $receipt);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // The whole point: rank the cohort under the currently configured rules.
        EoiReservation::recalculateQueueNumbers($project->id);

        $this->table(
            ['#', 'Client', 'Income', 'Method', 'VIP'],
            EoiReservation::with('lead')
                ->where('project_id', $project->id)
                ->where('status', EoiReservation::STATUS_APPROVED)
                ->orderBy('queue_number')
                ->take(10)
                ->get()
                ->map(fn ($e) => [
                    $e->queue_number,
                    $e->client_name,
                    number_format((float) $e->monthly_income),
                    $e->payment_method,
                    $e->lead?->is_vip ? 'yes' : '',
                ])
                ->all()
        );

        $this->info("Queue ranked. Change a rule in Queue Rules (or ask the assistant) and watch this reorder.");

        return self::SUCCESS;
    }

    /**
     * One buyer, deliberately varied on the axes the queue engine scores.
     */
    private function makeBuyer(string $projectId, int $i, int $count, string $receiptPath): void
    {
        $first = self::FIRST[$i % count(self::FIRST)];
        $last  = self::LAST[($i * 7) % count(self::LAST)];
        $slug  = strtolower($first) . '.' . strtolower(str_replace(['-', ' '], '', $last)) . ($i + 1);

        // Income spans the rule thresholds: a third comfortably above 150k, a third around it, a third below.
        $income = match ($i % 3) {
            0 => 180_000 + ($i * 4_000),
            1 => 120_000 + ($i * 1_500),
            default => 45_000 + ($i * 900),
        };

        // Roughly a third pay cash — enough that the cash weight visibly moves the board.
        $method = match ($i % 3) {
            0 => EoiReservation::PAYMENT_CASH,
            1 => EoiReservation::PAYMENT_INSTAPAY,
            default => EoiReservation::PAYMENT_BANK_TRANSFER,
        };

        $isVip = $i % 8 === 0;

        $lead = Lead::updateOrCreate(
            ['email' => $slug . self::DOMAIN],
            [
                'id'         => (string) Str::uuid(),
                'first_name' => $first,
                'last_name'  => $last,
                'phone'      => '010' . str_pad((string) (10_000_000 + $i * 137), 8, '0', STR_PAD_LEFT),
                'status'     => Lead::STATUS_NEW,
                'source'     => 'website_eoi',
                'is_vip'     => $isVip,
            ]
        );

        // Arrival order matters: FIFO is the final tiebreak, so spread reviewed_at
        // across the launch day rather than stamping them all at the same instant.
        $reviewedAt = now()->subMinutes(($count - $i) * 7);

        EoiReservation::updateOrCreate(
            ['lead_id' => $lead->id, 'project_id' => $projectId],
            [
                'id'                 => (string) Str::uuid(),
                'client_name'        => "{$first} {$last}",
                'client_email'       => $lead->email,
                'client_phone'       => $lead->phone,
                'client_location'    => EoiReservation::LOCATION_INSIDE_EGYPT,
                'payment_method'     => $method,
                'payment_amount'     => 50_000 + ($i % 4) * 25_000,
                'receipt_path'       => $receiptPath,
                'status'             => EoiReservation::STATUS_APPROVED,
                'order_number'       => EoiReservation::generateOrderNumber(),
                'reviewed_at'        => $reviewedAt,
                'created_at'         => $reviewedAt->copy()->subHours(2),
                'education'          => self::EDUCATION[$i % count(self::EDUCATION)],
                'job_title'          => self::JOBS[$i % count(self::JOBS)],
                'monthly_income'     => $income,
                'income_currency'    => 'EGP',
                'marital_status'     => $i % 4 === 0 ? 'single' : 'married',
                'number_of_children' => $i % 4,
                'current_residence'  => self::RESIDENCE[$i % count(self::RESIDENCE)],
                'residence_type'     => $i % 3 === 0 ? 'owned' : 'rented',
                'cars_owned'         => $i % 3,
            ]
        );
    }

    /**
     * Cohort receipts point at one shared placeholder — the reviewer needs *a*
     * receipt to open on screen, not two dozen distinct ones.
     */
    private function ensureReceipt(): string
    {
        $path = 'eoi-receipts/demo-receipt.svg';

        if (! Storage::disk('public')->exists($path)) {
            $this->warn("  {$path} is missing — run the demo seed first, or receipts will render broken.");
        }

        return $path;
    }

    private function purge(string $projectId): int
    {
        $leadIds = Lead::where('email', 'like', '%' . self::DOMAIN)->pluck('id');

        return EoiReservation::where('project_id', $projectId)
            ->whereIn('lead_id', $leadIds)
            ->delete();
    }
}
