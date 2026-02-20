<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSocialProfileCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->needsSocialProfileCompletion()) {
            return $next($request);
        }

        return redirect()->guest(route('social.complete.form'));
    }
}
