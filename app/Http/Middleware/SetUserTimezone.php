<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetUserTimezone
{
    public function handle(Request $request, Closure $next): Response
    {
        $defaultTimezone = config('app.timezone', 'UTC');
        $userTimezone = $request->user()?->timezone;

        $timezone = (is_string($userTimezone) && in_array($userTimezone, timezone_identifiers_list(), true))
            ? $userTimezone
            : $defaultTimezone;

        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);

        return $next($request);
    }
}
