<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/');
    }

    public function test_new_login_invalidates_previous_sessions_of_same_user(): void
    {
        config([
            'session.driver' => 'database',
            'session.table' => 'sessions',
        ]);

        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        DB::table('sessions')->insert([
            [
                'id' => 'old-session-a',
                'user_id' => $user->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'test',
                'last_activity' => now()->timestamp,
            ],
            [
                'id' => 'old-session-b',
                'user_id' => $user->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'test',
                'last_activity' => now()->timestamp,
            ],
            [
                'id' => 'other-user-session',
                'user_id' => $otherUser->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PHPUnit',
                'payload' => 'test',
                'last_activity' => now()->timestamp,
            ],
        ]);

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/');

        $this->assertDatabaseMissing('sessions', ['id' => 'old-session-a']);
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session-b']);
        $this->assertDatabaseHas('sessions', ['id' => 'other-user-session']);
    }

    public function test_forced_logout_reason_is_flashed_for_invalidated_session(): void
    {
        config([
            'session.driver' => 'database',
            'session.table' => 'sessions',
        ]);

        $user = User::factory()->create();

        DB::table('sessions')->insert([
            'id' => 'old-session-a',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'payload' => 'test',
            'last_activity' => now()->timestamp,
        ]);

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/');

        $this->post('/logout')->assertRedirect('/login');

        $this->withCookie((string) config('session.cookie'), 'old-session-a')
            ->get('/dashboard')
            ->assertRedirect('/login')
            ->assertSessionHas('logout_reason', '다른 기기에서 로그인되어 자동 로그아웃되었습니다.');
    }

    public function test_account_is_locked_for_fifteen_minutes_after_five_failed_attempts(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $response = $this->from('/login')->post('/login', [
                'login' => $user->email,
                'password' => 'wrong-password',
            ]);

            if ($i < 4) {
                $response->assertRedirect('/login');
            } else {
                $response->assertRedirect('/login/unlock?login=' . urlencode($user->email));
            }
        }

        $this->from('/login')
            ->post('/login', [
                'login' => $user->email,
                'password' => 'wrong-password',
            ])
            ->assertRedirect('/login/unlock?login=' . urlencode($user->email))
            ->assertSessionHas('auth_feedback', function (array $feedback): bool {
                return ($feedback['type'] ?? null) === 'locked'
                    && ($feedback['account_locked'] ?? false) === true;
            });
    }

    public function test_locked_account_can_be_unlocked_with_email_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'login' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/login/unlock/send-code', [
            'login' => $user->email,
        ])->assertOk()->assertJson([
            'success' => true,
        ]);

        $payload = Cache::get('auth:login:unlock_code:' . $user->id);
        $this->assertIsArray($payload);

        $this->postJson('/login/unlock/verify-code', [
            'login' => $user->email,
            'code' => $payload['code'],
            'action' => 'retry',
        ])->assertOk()->assertJson([
            'success' => true,
        ])->assertJsonPath('redirect', '/forgot-password?email=' . urlencode($user->email));

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/');
    }

    public function test_locked_social_account_redirects_to_login_after_unlock(): void
    {
        Mail::fake();
        $user = User::factory()->create([
            'google_id' => 'google-locked-user',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'login' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/login/unlock/send-code', [
            'login' => $user->email,
        ])->assertOk()->assertJson([
            'success' => true,
        ]);

        $payload = Cache::get('auth:login:unlock_code:' . $user->id);
        $this->assertIsArray($payload);

        $this->postJson('/login/unlock/verify-code', [
            'login' => $user->email,
            'code' => $payload['code'],
            'action' => 'retry',
        ])->assertOk()->assertJson([
            'success' => true,
        ])->assertJsonPath('redirect', '/login');
    }

    public function test_unlock_code_resend_is_rate_limited_for_a_short_period(): void
    {
        Mail::fake();
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'login' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/login/unlock/send-code', [
            'login' => $user->email,
        ])->assertOk()->assertJson([
            'success' => true,
        ])->assertJsonPath('ttl_seconds', 90);

        $this->postJson('/login/unlock/send-code', [
            'login' => $user->email,
        ])->assertStatus(429)->assertJson([
            'success' => false,
        ])->assertJsonPath('ttl_seconds', fn ($ttl) => is_int($ttl) && $ttl > 0);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'login' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }
}
