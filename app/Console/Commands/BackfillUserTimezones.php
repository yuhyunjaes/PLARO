<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class BackfillUserTimezones extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:backfill-timezones
                            {--default-nationality=KR : Nationality code used when missing/invalid}
                            {--default-timezone=Asia/Seoul : Timezone used when mapping is unavailable}
                            {--dry-run : Show affected users without writing changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill users.nationality and users.timezone for legacy users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $map = config('nationality_timezones', []);
        $tzSet = array_flip(timezone_identifiers_list());

        $defaultNationality = strtoupper((string) $this->option('default-nationality'));
        $defaultTimezone = (string) $this->option('default-timezone');
        $dryRun = (bool) $this->option('dry-run');

        if (!isset($map[$defaultNationality])) {
            $this->error("Invalid --default-nationality: {$defaultNationality}");
            return self::FAILURE;
        }

        if (!isset($tzSet[$defaultTimezone])) {
            $this->error("Invalid --default-timezone: {$defaultTimezone}");
            return self::FAILURE;
        }

        $query = User::query()
            ->where(function ($q) {
                $q->whereNull('nationality')
                    ->orWhere('nationality', '')
                    ->orWhereNull('timezone')
                    ->orWhere('timezone', '');
            });

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No users require backfill.');
            return self::SUCCESS;
        }

        $this->info("Target users: {$total}");
        $this->line('Mode: ' . ($dryRun ? 'DRY RUN' : 'WRITE'));

        $updated = 0;
        $skipped = 0;

        $query->select(['id', 'nationality', 'timezone'])
            ->orderBy('id')
            ->chunkById(200, function ($users) use (
                $map,
                $tzSet,
                $defaultNationality,
                $defaultTimezone,
                $dryRun,
                &$updated,
                &$skipped
            ) {
                foreach ($users as $user) {
                    $nationality = is_string($user->nationality)
                        ? strtoupper(trim($user->nationality))
                        : '';

                    if ($nationality === '' || !isset($map[$nationality])) {
                        $nationality = $defaultNationality;
                    }

                    $timezone = is_string($user->timezone)
                        ? trim($user->timezone)
                        : '';

                    if ($timezone === '' || !isset($tzSet[$timezone])) {
                        $timezone = $map[$nationality] ?? $defaultTimezone;
                    }

                    if (!isset($tzSet[$timezone])) {
                        $timezone = $defaultTimezone;
                    }

                    $changes = [];

                    if ($user->nationality !== $nationality) {
                        $changes['nationality'] = $nationality;
                    }

                    if ($user->timezone !== $timezone) {
                        $changes['timezone'] = $timezone;
                    }

                    if (empty($changes)) {
                        $skipped++;
                        continue;
                    }

                    if (!$dryRun) {
                        $user->forceFill($changes)->save();
                    }

                    $updated++;
                }
            });

        $this->info("Updated: {$updated}");
        $this->info("Skipped: {$skipped}");

        if ($dryRun) {
            $this->line('Dry run complete. Re-run without --dry-run to apply changes.');
        }

        return self::SUCCESS;
    }
}
