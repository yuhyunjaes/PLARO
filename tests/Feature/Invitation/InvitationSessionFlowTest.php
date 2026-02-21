<?php

namespace Tests\Feature\Invitation;

use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class InvitationSessionFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_accept_session_always_redirects_to_login_for_guest(): void
    {
        $inviter = User::factory()->create();
        $invitation = $this->createInvitation($inviter, 'guest-invitee@example.com');

        $response = $this->post("/invitations/{$invitation->token}/accept/session");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('redirect', 'login');

        $response->assertSessionHas('invitation_token', $invitation->token);
        $response->assertSessionHas('invitation_active', true);
        $response->assertSessionMissing('invitation_email');
    }

    public function test_accept_session_redirects_to_login_even_when_invited_email_is_registered(): void
    {
        $inviter = User::factory()->create();
        $registeredUser = User::factory()->create([
            'email' => 'registered-invitee@example.com',
        ]);

        $invitation = $this->createInvitation($inviter, $registeredUser->email);

        $response = $this->post("/invitations/{$invitation->token}/accept/session");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('redirect', 'login');
    }

    public function test_invitation_token_is_not_cleared_before_thirty_minutes(): void
    {
        $this->withSession([
            'invitation_token' => 'live-token',
            'invitation_active' => true,
            'invitation_session_started_at' => now()->subMinutes(29)->timestamp,
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSessionHas('invitation_token', 'live-token');
        $response->assertSessionHas('invitation_active', true);
    }

    public function test_invitation_token_is_cleared_after_thirty_minutes(): void
    {
        $this->withSession([
            'invitation_token' => 'expired-token',
            'invitation_email' => 'legacy@example.com',
            'invitation_active' => true,
            'invitation_session_started_at' => now()->subMinutes(31)->timestamp,
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSessionMissing('invitation_token');
        $response->assertSessionMissing('invitation_email');
        $response->assertSessionMissing('invitation_active');
        $response->assertSessionMissing('invitation_session_started_at');
    }

    public function test_login_page_does_not_receive_session_email_prop(): void
    {
        $response = $this->withSession([
            'invitation_email' => 'invitee@example.com',
        ])->get('/login');

        $response->assertOk();
        $page = $response->viewData('page');

        $this->assertIsArray($page);
        $this->assertArrayHasKey('props', $page);
        $this->assertArrayNotHasKey('sessionEmail', $page['props']);
    }

    private function createInvitation(User $inviter, string $email): EventInvitation
    {
        $event = Event::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $inviter->id,
            'title' => 'Invitation Test Event',
            'start_at' => now(),
            'end_at' => now()->addHour(),
            'type' => 'normal',
            'status' => 'active',
        ]);

        return EventInvitation::create([
            'event_id' => $event->id,
            'inviter_id' => $inviter->id,
            'email' => $email,
            'role' => 'viewer',
            'token' => Str::random(64),
            'status' => 'pending',
            'expires_at' => now()->addDay(),
        ]);
    }
}
