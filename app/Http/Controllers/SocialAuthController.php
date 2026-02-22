<?php

namespace App\Http\Controllers;

use App\Events\ParticipantUpdated;
use App\Http\Controllers\Concerns\EnforcesSingleSession;
use App\Models\EventInvitation;
use App\Models\EventUser;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    use EnforcesSingleSession;

    private const SOCIAL_PLACEHOLDER_DOMAIN = 'social.local';
    private const LOGIN_MAX_ATTEMPTS = 5;

    public function redirect(string $provider): RedirectResponse
    {
        if ($provider === 'kakao') {
            return $this->redirectToKakao();
        }

        if (!in_array($provider, ['google', 'facebook'], true)) {
            abort(404);
        }

        $driver = Socialite::driver($provider);

        if ($provider === 'google') {
            $driver->scopes(['openid', 'profile', 'email']);
        }

        if ($provider === 'facebook') {
            $driver->scopes(['email']);
        }

        return $driver->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        if ($provider === 'kakao') {
            return $this->handleKakaoCallback($request);
        }

        if (!in_array($provider, ['google', 'facebook'], true)) {
            abort(404);
        }

        if ($request->filled('error')) {
            return redirect()
                ->route('login')
                ->with('social_error', $this->buildSocialErrorMessage($provider, $request));
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            return redirect()
                ->route('login')
                ->with('social_error', ucfirst($provider) . ' 로그인 과정이 취소되었거나 만료되었습니다. 다시 시도해주세요.');
        }

        $socialEmail = $socialUser->getEmail();
        if ($socialEmail) {
            $existingUser = User::where('email', $socialEmail)->first();
            if ($existingUser) {
                return $this->loginAndRedirect($request, $existingUser);
            }
        }

        $user = $this->resolveOrCreateSocialUser(
            provider: $provider,
            providerId: (string) $socialUser->getId(),
            name: $socialUser->getName() ?: $socialUser->getNickname(),
            email: $socialEmail,
        );

        return $this->loginAndRedirect($request, $user);
    }

    public function showCompleteProfile()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->needsSocialProfileCompletion()) {
            return redirect('/');
        }

        $missingEmail = $user->hasPlaceholderEmail();
        $missingNationality = empty($user->nationality);

        return Inertia::render('Auth/SocialCompleteProfile', [
            'provider' => $user->socialProvider(),
            'missing_email' => $missingEmail,
            'missing_nationality' => $missingNationality,
            'email' => $missingEmail ? '' : $user->email,
            'nationality' => $user->nationality,
        ]);
    }

    public function completeProfile(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $missingEmail = $user->hasPlaceholderEmail();
        $missingNationality = empty($user->nationality);

        if (!$missingEmail && !$missingNationality) {
            return redirect('/');
        }

        $rules = [];

        if ($missingEmail) {
            $rules['email'] = ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)];
        } else {
            $rules['email'] = ['nullable', 'email', Rule::unique('users', 'email')->ignore($user->id)];
        }

        if ($missingNationality) {
            $rules['nationality'] = ['required', 'string', Rule::in(array_keys(config('nationality_timezones', [])))];
        } else {
            $rules['nationality'] = ['nullable', 'string', Rule::in(array_keys(config('nationality_timezones', [])))];
        }

        $validated = $request->validate($rules);

        $updates = [];

        if ($missingEmail && !empty($validated['email'])) {
            $updates['email'] = $validated['email'];
        }

        if ($missingNationality && !empty($validated['nationality'])) {
            $updates['nationality'] = $validated['nationality'];
            $updates['timezone'] = config('nationality_timezones.' . $validated['nationality'], config('app.timezone', 'UTC'));
        }

        $user->fill($updates);
        $user->save();

        if ($redirect = $this->acceptInvitationIfPossible($user)) {
            return $redirect;
        }

        return redirect()->intended('/');
    }

    private function loginAndRedirect(Request $request, User $user): RedirectResponse
    {
        $limiterMeta = $this->buildLoginLimiterMeta($request, $user);
        if ($limiterMeta['account_locked'] || $limiterMeta['ip_account_locked']) {
            return $this->redirectLockedSocialLogin($user, $limiterMeta);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $this->invalidateOtherSessions($request, (int) $user->id);
        $this->clearLoginRateLimiters($limiterMeta);

        if ($user->needsSocialProfileCompletion()) {
            return redirect()->route('social.complete.form');
        }

        if ($redirect = $this->acceptInvitationIfPossible($user)) {
            return $redirect;
        }

        return redirect('/');
    }

    private function buildLoginLimiterMeta(Request $request, User $user): array
    {
        $accountIdentifier = 'uid:' . $user->id;
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
            'account_remaining' => max(0, self::LOGIN_MAX_ATTEMPTS - $accountAttempts),
            'ip_account_remaining' => max(0, self::LOGIN_MAX_ATTEMPTS - $ipAccountAttempts),
            'account_retry_after' => $accountLocked ? RateLimiter::availableIn($accountKey) : 0,
            'ip_account_retry_after' => $ipAccountLocked ? RateLimiter::availableIn($ipAccountKey) : 0,
        ];
    }

    private function clearLoginRateLimiters(array $limiterMeta): void
    {
        RateLimiter::clear((string) $limiterMeta['account_key']);
        RateLimiter::clear((string) $limiterMeta['ip_account_key']);
    }

    private function redirectLockedSocialLogin(User $user, array $limiterMeta): RedirectResponse
    {
        $accountLocked = (bool) $limiterMeta['account_locked'];
        $ipAccountLocked = (bool) $limiterMeta['ip_account_locked'];

        return redirect()
            ->route('login.unlock.form', ['login' => (string) ($user->email ?: $user->user_id)])
            ->with('auth_feedback', [
                'type' => 'locked',
                'message' => $accountLocked
                    ? '계정이 15분간 잠겼습니다. 이메일 인증으로 바로 해제할 수 있습니다.'
                    : '현재 IP와 계정 조합이 15분간 차단되었습니다.',
                'account_locked' => $accountLocked,
                'ip_account_locked' => $ipAccountLocked,
                'retry_after' => max((int) $limiterMeta['account_retry_after'], (int) $limiterMeta['ip_account_retry_after']),
                'max_attempts' => self::LOGIN_MAX_ATTEMPTS,
                'account_remaining' => (int) $limiterMeta['account_remaining'],
                'ip_account_remaining' => (int) $limiterMeta['ip_account_remaining'],
                'unlock_available' => $accountLocked && !empty($user->email),
                'login' => (string) ($user->email ?: $user->user_id),
            ]);
    }

    private function resolveOrCreateSocialUser(string $provider, string $providerId, ?string $name, ?string $email): User
    {
        $providerColumn = $provider . '_id';

        $user = User::where($providerColumn, $providerId)->first();

        if ($user) {
            $updates = [];

            if (empty($user->{$providerColumn})) {
                $updates[$providerColumn] = $providerId;
            }

            if ($email && $this->isPlaceholderEmail((string) $user->email)) {
                $updates['email'] = $email;
            }

            if ($name && empty($user->name)) {
                $updates['name'] = $name;
            }

            if (!empty($updates)) {
                $user->fill($updates);
                $user->save();
            }

            return $user;
        }

        return User::create([
            'user_id' => $this->generateUniqueUserId($provider),
            'password' => Hash::make(Str::random(40)),
            'name' => $name ?: ucfirst($provider) . ' User',
            'email' => $email ?: $this->generatePlaceholderEmail($provider, $providerId),
            'nationality' => null,
            'timezone' => config('app.timezone', 'UTC'),
            'role' => 'user',
            $providerColumn => $providerId,
        ]);
    }

    private function generateUniqueUserId(string $provider): string
    {
        do {
            $userId = strtolower($provider . '_' . Str::random(10));
        } while (User::where('user_id', $userId)->exists());

        return $userId;
    }

    private function generatePlaceholderEmail(string $provider, string $providerId): string
    {
        $localPart = strtolower($provider . '_' . Str::slug($providerId, '_'));

        if ($localPart === '') {
            $localPart = strtolower($provider . '_' . Str::random(8));
        }

        return $localPart . '@' . self::SOCIAL_PLACEHOLDER_DOMAIN;
    }

    private function isPlaceholderEmail(string $email): bool
    {
        return str_ends_with(strtolower($email), '@' . self::SOCIAL_PLACEHOLDER_DOMAIN);
    }

    private function redirectToKakao(): RedirectResponse
    {
        $state = Str::random(40);
        Session::put('kakao_oauth_state', $state);

        $query = http_build_query([
            'client_id' => config('services.kakao.client_id'),
            'redirect_uri' => config('services.kakao.redirect'),
            'response_type' => 'code',
            'scope' => 'profile_nickname account_email',
            'state' => $state,
        ]);

        return redirect()->away('https://kauth.kakao.com/oauth/authorize?' . $query);
    }

    private function handleKakaoCallback(Request $request): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()
                ->route('login')
                ->with('social_error', $this->buildSocialErrorMessage('kakao', $request));
        }

        if (!$request->filled('code')) {
            return redirect()->route('login')->with('social_error', '카카오 로그인에 실패했습니다.');
        }

        $savedState = Session::pull('kakao_oauth_state');
        $state = $request->string('state')->toString();

        if (!$savedState || !$state || !hash_equals($savedState, $state)) {
            return redirect()->route('login')->with('social_error', '카카오 로그인 상태 검증에 실패했습니다.');
        }

        $tokenResponse = Http::asForm()->post('https://kauth.kakao.com/oauth/token', [
            'grant_type' => 'authorization_code',
            'client_id' => config('services.kakao.client_id'),
            'client_secret' => config('services.kakao.client_secret'),
            'redirect_uri' => config('services.kakao.redirect'),
            'code' => $request->string('code')->toString(),
        ]);

        if (!$tokenResponse->ok()) {
            return redirect()->route('login')->with('social_error', '카카오 토큰 발급에 실패했습니다.');
        }

        $accessToken = $tokenResponse->json('access_token');

        if (!$accessToken) {
            return redirect()->route('login')->with('social_error', '카카오 액세스 토큰을 받지 못했습니다.');
        }

        $userResponse = Http::withToken($accessToken)->get('https://kapi.kakao.com/v2/user/me');

        if (!$userResponse->ok()) {
            return redirect()->route('login')->with('social_error', '카카오 사용자 정보 조회에 실패했습니다.');
        }

        $payload = $userResponse->json();

        $providerId = (string) ($payload['id'] ?? '');
        $email = $payload['kakao_account']['email'] ?? null;
        $name = $payload['kakao_account']['profile']['nickname'] ?? null;

        if ($providerId === '') {
            return redirect()->route('login')->with('social_error', '카카오 사용자 식별값이 없습니다.');
        }

        if ($email) {
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                return $this->loginAndRedirect($request, $existingUser);
            }
        }

        $user = $this->resolveOrCreateSocialUser(
            provider: 'kakao',
            providerId: $providerId,
            name: $name,
            email: $email,
        );

        return $this->loginAndRedirect($request, $user);
    }

    private function acceptInvitationIfPossible(User $user): ?RedirectResponse
    {
        if (!Session::has('invitation_token')) {
            return null;
        }

        $token = Session::get('invitation_token');

        if (!$token) {
            return null;
        }

        $invitation = EventInvitation::where('token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$invitation) {
            return null;
        }

        if ($invitation->email !== $user->email) {
            return null;
        }

        DB::transaction(function () use ($invitation, $user) {
            $invitation->update(['status' => 'accepted']);

            EventUser::firstOrCreate([
                'event_id' => $invitation->event_id,
                'user_id' => $user->id,
            ], [
                'role' => $invitation->role,
            ]);
        });

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

        return redirect("/calenote/calendar/{$invitation->event->type[0]}/{$invitation->event->uuid}");
    }

    private function buildSocialErrorMessage(string $provider, Request $request): string
    {
        $providerLabel = $provider === 'kakao'
            ? '카카오'
            : ($provider === 'google' ? '구글' : '페이스북');

        $error = strtolower((string) $request->query('error', ''));
        $description = strtolower((string) $request->query('error_description', ''));

        if ($error === 'access_denied' || str_contains($description, 'access_denied') || str_contains($description, 'cancel')) {
            return $providerLabel . ' 로그인 동의가 취소되었습니다.';
        }

        return $providerLabel . ' 로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
}
