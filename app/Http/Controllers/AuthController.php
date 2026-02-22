<?php

namespace App\Http\Controllers;

use App\Events\ParticipantUpdated;
use App\Http\Controllers\Concerns\EnforcesSingleSession;
use App\Http\Controllers\Controller;
use App\Models\EventInvitation;
use App\Models\EventUser;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use EnforcesSingleSession;

    private const PASSWORD_RESET_CODE_TTL_SECONDS = 90;
    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_LOCK_SECONDS = 900;
    private const LOGIN_UNLOCK_CODE_TTL_SECONDS = 90;
    private const LOGIN_UNLOCK_CODE_RESEND_COOLDOWN_SECONDS = 90;

    // 아이디 중복체크
    public function checkId(Request $request) {
        $id = $request->id;
        if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,15}$/', $id)) {
            return response()->json(['success' => false]);
        }
        $exists = User::where('user_id', $id)->exists();
        if($exists) {
            return response()->json(['success' => false]);
        }
        return response()->json(['success' => true]);
    }

    // 이메일 확인 코드 전송
    public function sendEmail(Request $request) {
        try {
            $email = $request->email;
            if(empty($email)) return response()->json(['success' => false, 'message' => '이메일을 작성해주세요.', 'type' => 'danger']);

            $exists = User::where('email', $email)->exists();
            if($exists) return response()->json(['success' => false, 'message' => '이미 가입된 이메일입니다', 'type' => 'danger']);

            $code = rand(100000,999999);
            Session::put('code', $code);

            Mail::raw("회원가입 인증번호 : $code", function($message) use ($email) {
                $message->to($email)
                    ->subject('라이프허브 회원가입 이메일 인증');
            });

            return response()->json(['success' => true, 'message' => '인증번호가 발송되었습니다.', 'type' => 'success']);
        } catch(\Exception $e) {
            return response()->json(['success' => false, 'message' => '이메일이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

    // 이메일 코드 확인(세션기반)
    public function checkEmail(Request $request) {
        $code = $request->code;

        if (!$code) {
            return response()->json(['success' => false, 'message' => '인증번호를 입력해주세요.', 'type' => 'danger']);
        }

        if(Session::get('code') == $code) {
            Session::forget('code');
            return response()->json(['success' => true, 'message' => '인증이 완료되었습니다.', 'type' => 'success']);
        }

        return response()->json(['success' => false, 'message' => '인증번호가 일치하지 않습니다.', 'type' => 'danger']);
    }

    // 비밀번호 재설정용 이메일 코드 전송
    public function sendPasswordResetCode(Request $request)
    {
        try {
            $email = trim((string) $request->email);
            if ($email === '') {
                return response()->json(['success' => false, 'message' => '이메일을 입력해주세요.', 'type' => 'danger']);
            }

            $user = User::where('email', $email)->first();
            if (!$user) {
                return response()->json(['success' => false, 'message' => '가입된 이메일이 아닙니다.', 'type' => 'danger']);
            }
            if ($user->isSocialAccount()) {
                return response()->json(['success' => false, 'message' => '소셜 로그인 계정은 비밀번호 찾기를 사용할 수 없습니다.', 'type' => 'danger']);
            }
            if ($this->isUserAccountLocked((int) $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => '계정이 잠겨 있습니다. 계정 잠금 해제 후 다시 시도해주세요.',
                    'type' => 'danger',
                    'unlock_url' => route('login.unlock.form', ['login' => Str::lower((string) $user->email)]),
                ], 423);
            }

            $code = rand(100000, 999999);
            $expiresAt = Carbon::now()->addSeconds(self::PASSWORD_RESET_CODE_TTL_SECONDS);

            Session::put('password_reset', [
                'email' => $email,
                'code' => (string) $code,
                'expires_at' => $expiresAt->toDateTimeString(),
                'verified' => false,
            ]);

            Mail::raw("비밀번호 재설정 인증번호 : $code", function ($message) use ($email) {
                $message->to($email)->subject('라이프허브 비밀번호 재설정 인증');
            });

            return response()->json([
                'success' => true,
                'message' => '인증번호가 발송되었습니다.',
                'type' => 'success',
                'ttl_seconds' => self::PASSWORD_RESET_CODE_TTL_SECONDS,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '인증번호 발송에 실패했습니다.', 'type' => 'danger']);
        }
    }

    // 비밀번호 재설정용 코드 확인
    public function verifyPasswordResetCode(Request $request)
    {
        $code = trim((string) $request->code);
        if ($code === '') {
            return response()->json(['success' => false, 'message' => '인증번호를 입력해주세요.', 'type' => 'danger']);
        }

        $sessionData = Session::get('password_reset');
        if (!$sessionData || empty($sessionData['code']) || empty($sessionData['expires_at']) || empty($sessionData['email'])) {
            return response()->json(['success' => false, 'message' => '인증정보가 없습니다. 다시 시도해주세요.', 'type' => 'danger']);
        }

        $expiresAt = Carbon::parse((string) $sessionData['expires_at']);
        if (Carbon::now()->greaterThan($expiresAt)) {
            Session::forget('password_reset');
            return response()->json(['success' => false, 'message' => '인증시간이 만료되었습니다. 다시 요청해주세요.', 'type' => 'danger']);
        }

        if ((string) $sessionData['code'] !== $code) {
            return response()->json(['success' => false, 'message' => '인증번호가 일치하지 않습니다.', 'type' => 'danger']);
        }

        $sessionData['verified'] = true;
        Session::put('password_reset', $sessionData);

        return response()->json(['success' => true, 'message' => '인증이 완료되었습니다.', 'type' => 'success']);
    }

    // 비밀번호 재설정
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8', 'string'],
        ]);

        $sessionData = Session::get('password_reset');
        if (
            !$sessionData ||
            empty($sessionData['verified']) ||
            empty($sessionData['email']) ||
            (string) $sessionData['email'] !== (string) $data['email']
        ) {
            throw ValidationException::withMessages([
                'message' => '이메일 인증이 필요합니다.',
            ]);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'message' => '가입된 이메일이 아닙니다.',
            ]);
        }
        if ($user->isSocialAccount()) {
            throw ValidationException::withMessages([
                'message' => '소셜 로그인 계정은 비밀번호 찾기를 사용할 수 없습니다.',
            ]);
        }
        if ($this->isUserAccountLocked((int) $user->id)) {
            return response()->json([
                'success' => false,
                'message' => '계정이 잠겨 있습니다. 잠금 해제 후 다시 시도해주세요.',
                'unlock_url' => route('login.unlock.form', ['login' => Str::lower((string) $user->email)]),
            ], 423);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        Session::forget('password_reset');

        return response()->json(['success' => true, 'message' => '비밀번호가 변경되었습니다. 로그인해주세요.']);
    }

    // 회원가입
    public function register(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'string', 'min:4', 'max:15', 'unique:users,user_id', 'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/'],
            'password' => ['required', 'confirmed', 'min:8', 'string'],
            'name' => ['required', 'string', 'min:2', 'max:15'],
            'email' => ['required', 'email', 'unique:users,email'],
            'nationality' => ['required', 'string', Rule::in(array_keys(config('nationality_timezones', [])))],
        ]);

        $timezone = config('nationality_timezones.' . $data['nationality'], config('app.timezone', 'UTC'));

        $user = User::create([
            'user_id' => $data['user_id'],
            'password' => Hash::make($data['password']),
            'name' => $data['name'],
            'email' => $data['email'],
            'nationality' => $data['nationality'],
            'timezone' => $timezone,
        ]);

        Auth::login($user);
        $request->session()->regenerate();
        $this->invalidateOtherSessions($request, (int) $user->id);

        if (Session::has('invitation_token')) {
            $token = Session::get('invitation_token');
            if ($token) {
                $invitation = EventInvitation::where('token', $token)
                    ->where('status', 'pending')
                    ->first();

                if ($invitation && $invitation->email === $user->email) {
                DB::transaction(function () use ($invitation, $user) {
                    $invitation->update(['status' => 'accepted']);

                    EventUser::create([
                        'event_id' => $invitation->event_id,
                        'user_id' => $user->id,
                        'role' => $invitation->role,
                    ]);
                });

                // 초대 수락 - 해당 이벤트 참가자들에게만 브로드캐스트
                broadcast(new ParticipantUpdated(
                    $invitation->event->uuid,
                    [
                        'type' => 'invitation_accepted',
                        'participant' => [
                            'user_name' => $user->name,
                            'user_id' => $user->id,
                            'event_id' => $invitation->event->uuid,
                            'email' => $user->email,
                            'role' => $invitation->role,
                            'status' => null,
                        ],
                        'user_id' => $user->id,
                    ]
                ))->toOthers();

                return Inertia::location("/calenote/calendar/{$invitation->event->type[0]}/{$invitation->event->uuid}");
                }
            }
        }

        return Inertia::location(route('home'));
    }

    // 로그인
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $rawLogin = (string) $request->input('login');
        $normalizedLogin = $this->normalizeLogin($rawLogin);
        if ($normalizedLogin === '') {
            throw ValidationException::withMessages([
                'login' => '아이디 또는 이메일을 입력해주세요.',
            ]);
        }

        $isEmailLogin = filter_var($normalizedLogin, FILTER_VALIDATE_EMAIL) !== false;
        if (!$isEmailLogin) {
            $request->merge(['login' => $normalizedLogin]);
            $request->validate([
                'login' => ['min:4', 'max:15', 'regex:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/'],
            ]);
        }

        $targetUser = $this->resolveLoginUser($normalizedLogin);
        $limiterMeta = $this->buildLoginLimiterMeta($request, $normalizedLogin, $targetUser);

        if ($limiterMeta['account_locked'] || $limiterMeta['ip_account_locked']) {
            return $this->redirectLockedLogin($normalizedLogin, $this->buildLockedFeedback($limiterMeta, $targetUser));
        }

        $loginField = $isEmailLogin ? 'email' : 'user_id';
        $loginValueForAttempt = $targetUser
            ? (string) $targetUser->{$loginField}
            : $normalizedLogin;

        if (Auth::attempt([$loginField => $loginValueForAttempt, 'password' => (string) $request->input('password')])) {
            $request->session()->regenerate();
            $this->invalidateOtherSessions($request, (int) Auth::id());
            $this->clearLoginRateLimiters($limiterMeta);

            if (Session::has('invitation_token')) {
                $token = Session::get('invitation_token');

                if ($token) {
                    $invitation = EventInvitation::where('token', $token)
                        ->where('status', 'pending')
                        ->first();

                    if ($invitation && Auth::user()->email === $invitation->email) {
                        $user = Auth::user();

                        DB::transaction(function () use ($invitation) {
                            $invitation->update(['status' => 'accepted']);

                            EventUser::create([
                                'event_id' => $invitation->event_id,
                                'user_id' => Auth::id(),
                                'role' => $invitation->role,
                            ]);
                        });

                        // 초대 수락 - 해당 이벤트 참가자들에게만 브로드캐스트
                        broadcast(new ParticipantUpdated(
                            $invitation->event->uuid,
                            [
                                'type' => 'invitation_accepted',
                                'participant' => [
                                    'user_name' => $user->name,
                                    'user_id' => $user->id,
                                    'event_id' => $invitation->event->uuid,
                                    'email' => $user->email,
                                    'role' => $invitation->role,
                                    'status' => null,
                                ],
                                'user_id' => $user->id,
                            ]
                        ))->toOthers();

                        return inertia::location("/calenote/calendar/{$invitation->event->type[0]}/{$invitation->event->uuid}");
                    }
                }
            }

            return redirect()->route('home');
        }

        RateLimiter::hit($limiterMeta['account_key'], self::LOGIN_LOCK_SECONDS);
        RateLimiter::hit($limiterMeta['ip_account_key'], self::LOGIN_LOCK_SECONDS);

        $limiterMeta = $this->buildLoginLimiterMeta($request, $normalizedLogin, $targetUser);

        if ($limiterMeta['account_locked'] || $limiterMeta['ip_account_locked']) {
            return $this->redirectLockedLogin($normalizedLogin, $this->buildLockedFeedback($limiterMeta, $targetUser));
        }

        return $this->redirectLoginFailure($request, $normalizedLogin, [
            'type' => 'invalid_credentials',
            'message' => '아이디 또는 이메일, 비밀번호를 확인해주세요.',
            'remaining_attempts' => min($limiterMeta['account_remaining'], $limiterMeta['ip_account_remaining']),
            'max_attempts' => self::LOGIN_MAX_ATTEMPTS,
            'account_remaining' => $limiterMeta['account_remaining'],
            'ip_account_remaining' => $limiterMeta['ip_account_remaining'],
        ]);
    }

    public function showLoginUnlockForm(Request $request)
    {
        $requestedLogin = trim((string) $request->query('login', ''));
        $normalizedLogin = $this->normalizeLogin($requestedLogin);

        if ($normalizedLogin === '') {
            return redirect()->route('login');
        }

        $user = $this->resolveLoginUser($normalizedLogin);
        if (!$user) {
            return redirect()->route('login');
        }

        $limiterMeta = $this->buildLoginLimiterMeta($request, $normalizedLogin, $user);
        if (!$limiterMeta['account_locked'] && !$limiterMeta['ip_account_locked']) {
            return redirect()->route('login');
        }

        $feedback = $this->buildLockedFeedback($limiterMeta, $user);
        $feedback['login'] = $normalizedLogin;
        $feedback['email'] = (string) $user->email;
        $feedback['is_social_account'] = $user->isSocialAccount();

        return Inertia::render('Auth/LoginUnlock', [
            'authFeedback' => $feedback,
            'prefillLogin' => $normalizedLogin,
            'prefillEmail' => (string) $user->email,
        ]);
    }

    public function sendLoginUnlockCode(Request $request)
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
        ]);

        $normalizedLogin = $this->normalizeLogin($data['login']);
        $user = $this->resolveLoginUser($normalizedLogin);

        if (!$user) {
            return response()->json(['success' => false, 'message' => '잠긴 계정을 찾을 수 없습니다.']);
        }

        $limiterMeta = $this->buildLoginLimiterMeta($request, $normalizedLogin, $user);
        if (!$limiterMeta['account_locked']) {
            return response()->json(['success' => false, 'message' => '계정 잠금 상태가 아닙니다.']);
        }

        if (empty($user->email)) {
            return response()->json(['success' => false, 'message' => '이메일이 등록되지 않은 계정입니다. 관리자에게 문의해주세요.']);
        }

        $resendLimiterKey = $this->loginUnlockResendLimiterKey((int) $user->id);
        if (RateLimiter::tooManyAttempts($resendLimiterKey, 1)) {
            return response()->json([
                'success' => false,
                'message' => '인증코드가 이미 발송되었습니다. 잠시 후 다시 시도해주세요.',
                'ttl_seconds' => RateLimiter::availableIn($resendLimiterKey),
            ], 429);
        }

        $code = (string) random_int(100000, 999999);
        $cacheKey = $this->loginUnlockCodeKey((int) $user->id);
        Cache::put($cacheKey, ['code' => $code], now()->addSeconds(self::LOGIN_UNLOCK_CODE_TTL_SECONDS));
        RateLimiter::hit($resendLimiterKey, self::LOGIN_UNLOCK_CODE_RESEND_COOLDOWN_SECONDS);

        Mail::raw("로그인 잠금 해제 인증번호 : {$code}", function ($message) use ($user) {
            $message->to($user->email)->subject('라이프허브 로그인 잠금 해제 인증');
        });

        return response()->json([
            'success' => true,
            'message' => '인증번호를 이메일로 발송했습니다.',
            'ttl_seconds' => self::LOGIN_UNLOCK_CODE_RESEND_COOLDOWN_SECONDS,
            'code_ttl_seconds' => self::LOGIN_UNLOCK_CODE_TTL_SECONDS,
        ]);
    }

    public function verifyLoginUnlockCode(Request $request)
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'code' => ['required', 'digits:6'],
            'action' => ['required', Rule::in(['retry', 'reset_password'])],
        ]);

        $normalizedLogin = $this->normalizeLogin($data['login']);
        $user = $this->resolveLoginUser($normalizedLogin);

        if (!$user) {
            return response()->json(['success' => false, 'message' => '계정을 찾을 수 없습니다.'], 404);
        }

        $cacheKey = $this->loginUnlockCodeKey((int) $user->id);
        $payload = Cache::get($cacheKey);
        if (!is_array($payload) || (string) ($payload['code'] ?? '') !== (string) $data['code']) {
            return response()->json(['success' => false, 'message' => '인증번호가 일치하지 않습니다.'], 422);
        }

        Cache::forget($cacheKey);

        $limiterMeta = $this->buildLoginLimiterMeta($request, $normalizedLogin, $user);
        $this->clearLoginRateLimiters($limiterMeta);

        if ($data['action'] === 'reset_password') {
            return response()->json([
                'success' => true,
                'message' => '잠금이 해제되었습니다. 비밀번호를 변경해주세요.',
                'redirect' => '/forgot-password?email=' . urlencode((string) $user->email),
            ]);
        }

        if (!$user->isSocialAccount()) {
            return response()->json([
                'success' => true,
                'message' => '잠금이 해제되었습니다. 비밀번호를 변경해주세요.',
                'redirect' => '/forgot-password?email=' . urlencode((string) $user->email),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => '잠금이 해제되었습니다. 다시 로그인해 주세요.',
            'redirect' => '/login',
        ]);
    }

    private function redirectLoginFailure(Request $request, string $login, array $feedback)
    {
        $feedback['login'] = $login;

        return redirect()
            ->route('login')
            ->withInput(['login' => $login])
            ->with('auth_feedback', $feedback);
    }

    private function redirectLockedLogin(string $login, array $feedback)
    {
        $feedback['login'] = $login;

        return redirect()
            ->route('login.unlock.form', ['login' => $login])
            ->with('auth_feedback', $feedback);
    }

    private function normalizeLogin(string $login): string
    {
        return Str::lower(trim($login));
    }

    private function resolveLoginUser(string $normalizedLogin): ?User
    {
        if ($normalizedLogin === '') {
            return null;
        }

        if (filter_var($normalizedLogin, FILTER_VALIDATE_EMAIL)) {
            return User::whereRaw('LOWER(email) = ?', [$normalizedLogin])->first();
        }

        return User::whereRaw('LOWER(user_id) = ?', [$normalizedLogin])->first();
    }

    private function buildLoginLimiterMeta(Request $request, string $normalizedLogin, ?User $user): array
    {
        $accountIdentifier = $user
            ? 'uid:' . $user->id
            : 'login:' . $normalizedLogin;

        $ip = (string) ($request->ip() ?? 'unknown');
        $accountKey = 'auth:login:account:' . sha1($accountIdentifier);
        $ipAccountKey = 'auth:login:ip_account:' . sha1($ip . '|' . $accountIdentifier);

        $accountAttempts = RateLimiter::attempts($accountKey);
        $ipAccountAttempts = RateLimiter::attempts($ipAccountKey);

        $accountLocked = RateLimiter::tooManyAttempts($accountKey, self::LOGIN_MAX_ATTEMPTS);
        $ipAccountLocked = RateLimiter::tooManyAttempts($ipAccountKey, self::LOGIN_MAX_ATTEMPTS);

        return [
            'account_key' => $accountKey,
            'ip_account_key' => $ipAccountKey,
            'account_locked' => $accountLocked,
            'ip_account_locked' => $ipAccountLocked,
            'account_attempts' => $accountAttempts,
            'ip_account_attempts' => $ipAccountAttempts,
            'account_remaining' => max(0, self::LOGIN_MAX_ATTEMPTS - $accountAttempts),
            'ip_account_remaining' => max(0, self::LOGIN_MAX_ATTEMPTS - $ipAccountAttempts),
            'account_retry_after' => $accountLocked ? RateLimiter::availableIn($accountKey) : 0,
            'ip_account_retry_after' => $ipAccountLocked ? RateLimiter::availableIn($ipAccountKey) : 0,
        ];
    }

    private function buildLockedFeedback(array $limiterMeta, ?User $user): array
    {
        $accountLocked = (bool) $limiterMeta['account_locked'];
        $ipAccountLocked = (bool) $limiterMeta['ip_account_locked'];
        $retryAfter = max((int) $limiterMeta['account_retry_after'], (int) $limiterMeta['ip_account_retry_after']);

        return [
            'type' => 'locked',
            'message' => $accountLocked
                ? '계정이 15분간 잠겼습니다. 이메일 인증으로 바로 해제할 수 있습니다.'
                : '현재 IP와 계정 조합이 15분간 차단되었습니다.',
            'account_locked' => $accountLocked,
            'ip_account_locked' => $ipAccountLocked,
            'retry_after' => $retryAfter,
            'max_attempts' => self::LOGIN_MAX_ATTEMPTS,
            'account_remaining' => (int) $limiterMeta['account_remaining'],
            'ip_account_remaining' => (int) $limiterMeta['ip_account_remaining'],
            'unlock_available' => $accountLocked && $user && !empty($user->email),
            'is_social_account' => $user ? $user->isSocialAccount() : false,
            'email' => $user ? (string) $user->email : null,
        ];
    }

    private function clearLoginRateLimiters(array $limiterMeta): void
    {
        RateLimiter::clear((string) $limiterMeta['account_key']);
        RateLimiter::clear((string) $limiterMeta['ip_account_key']);
    }

    private function loginUnlockCodeKey(int $userId): string
    {
        return 'auth:login:unlock_code:' . $userId;
    }

    private function loginUnlockResendLimiterKey(int $userId): string
    {
        return 'auth:login:unlock_resend:' . $userId;
    }

    private function isUserAccountLocked(int $userId): bool
    {
        return RateLimiter::tooManyAttempts($this->loginAccountLimiterKey($userId), self::LOGIN_MAX_ATTEMPTS);
    }

    private function loginAccountLimiterKey(int $userId): string
    {
        return 'auth:login:account:' . sha1('uid:' . $userId);
    }

    // 로그아웃
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
