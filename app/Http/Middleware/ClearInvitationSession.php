<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Session;

class ClearInvitationSession
{
    private const INVITATION_SESSION_TTL_SECONDS = 1800; // 30 minutes

    public function handle($request, Closure $next)
    {
        if (!Session::has('invitation_token')) {
            return $next($request);
        }

        $issuedAt = Session::get('invitation_session_started_at');
        $isExpired = !is_numeric($issuedAt)
            || ((int) $issuedAt + self::INVITATION_SESSION_TTL_SECONDS) < now()->timestamp;

        if ($isExpired) {
            Session::forget([
                'invitation_token',
                'invitation_email',
                'invitation_active',
                'invitation_session_started_at',
            ]);

            return $next($request);
        }

        $routeName = $request->route()?->getName();
        $method = strtoupper($request->method());

        $invitationFlowRoutes = [
            'login',
            'register',
            'login.submit',
            'register.submit',
            'checkId',
            'sendEmail',
            'checkEmail',
            'invitations.show',
            'invitations.accept',
            'invitations.accept.session.store',
            'invitations.decline',
            'social.redirect',
            'social.callback',
            'social.complete.form',
            'social.complete.submit',
        ];

        if (in_array($routeName, $invitationFlowRoutes, true)) {
            return $next($request);
        }

        if ($method === 'POST') {
            return $next($request);
        }

        Session::forget([
            'invitation_token',
            'invitation_email',
            'invitation_active',
            'invitation_session_started_at',
        ]);

        return $next($request);
    }
}
