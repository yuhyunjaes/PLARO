<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        if ($request->expectsJson()) {
            return null;
        }

        $sessionCookie = (string) config('session.cookie', '');
        $sessionId = $sessionCookie !== '' ? (string) $request->cookie($sessionCookie, '') : '';

        if ($sessionId !== '' && Cache::pull("forced_logout_session:{$sessionId}")) {
            $request->session()->flash('logout_reason', '다른 기기에서 로그인되어 자동 로그아웃되었습니다.');
        }

        return route('login');
    }
}
