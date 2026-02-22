<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait EnforcesSingleSession
{
    protected function invalidateOtherSessions(Request $request, int $userId): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        $table = (string) config('session.table', 'sessions');
        if ($table === '' || !Schema::hasTable($table)) {
            return;
        }

        $currentSessionId = (string) $request->session()->getId();
        if ($currentSessionId === '') {
            return;
        }

        DB::table($table)
            ->where('user_id', $userId)
            ->where('id', '!=', $currentSessionId)
            ->pluck('id')
            ->each(function ($sessionId): void {
                $sessionId = (string) $sessionId;
                if ($sessionId !== '') {
                    Cache::put("forced_logout_session:{$sessionId}", true, now()->addDay());
                }
            });

        DB::table($table)
            ->where('user_id', $userId)
            ->where('id', '!=', $currentSessionId)
            ->delete();
    }
}
