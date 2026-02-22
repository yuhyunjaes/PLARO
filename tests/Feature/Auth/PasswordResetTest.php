<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_password_reset_code_can_be_requested_for_registered_email(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/password/send-reset-code', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)->assertJson([
            'success' => true,
        ])->assertJsonPath('ttl_seconds', 90);

        $sessionData = session('password_reset');

        $this->assertNotNull($sessionData);
        $this->assertSame($user->email, $sessionData['email']);
        $this->assertFalse((bool) $sessionData['verified']);
        $this->assertNotEmpty($sessionData['code']);
    }

    public function test_password_reset_code_can_be_verified(): void
    {
        $user = User::factory()->create();

        $this->postJson('/password/send-reset-code', [
            'email' => $user->email,
        ])->assertStatus(200);

        $code = session('password_reset.code');

        $response = $this->postJson('/password/verify-reset-code', [
            'code' => $code,
        ]);

        $response->assertStatus(200)->assertJson([
            'success' => true,
        ]);

        $this->assertTrue((bool) session('password_reset.verified'));
    }

    public function test_password_can_be_reset_after_email_verification(): void
    {
        $user = User::factory()->create();

        $this->postJson('/password/send-reset-code', [
            'email' => $user->email,
        ])->assertStatus(200);

        $code = session('password_reset.code');
        $this->postJson('/password/verify-reset-code', [
            'code' => $code,
        ])->assertStatus(200);

        $response = $this->postJson('/password/reset', [
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)->assertJson([
            'success' => true,
        ]);

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
        $this->assertNull(session('password_reset'));
    }

    public function test_social_account_can_not_request_password_reset_code(): void
    {
        $socialUser = User::factory()->create([
            'google_id' => 'google-12345',
        ]);

        $response = $this->postJson('/password/send-reset-code', [
            'email' => $socialUser->email,
        ]);

        $response->assertStatus(200)->assertJson([
            'success' => false,
            'message' => '소셜 로그인 계정은 비밀번호 찾기를 사용할 수 없습니다.',
        ]);
    }

    public function test_locked_account_can_not_request_password_reset_code(): void
    {
        $user = User::factory()->create();
        $accountKey = 'auth:login:account:' . sha1('uid:' . $user->id);

        for ($i = 0; $i < 5; $i++) {
            RateLimiter::hit($accountKey, 900);
        }

        $response = $this->postJson('/password/send-reset-code', [
            'email' => $user->email,
        ]);

        $response->assertStatus(423)->assertJson([
            'success' => false,
            'message' => '계정이 잠겨 있습니다. 계정 잠금 해제 후 다시 시도해주세요.',
        ]);
    }
}
