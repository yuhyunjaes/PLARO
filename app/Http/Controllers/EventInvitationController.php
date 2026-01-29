<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\EventUser;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EventInvitationController extends Controller
{
    public function StoreInvitation($uuid, Request $request)
    {
        try {
            $event = Event::where('uuid', $uuid)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $data = $request->validate([
                'email' => ['required', 'email'],
                'role' => ['required', 'in:editor,viewer'],
            ]);

            $alreadyJoined = EventUser::where('event_id', $event->id)
                ->whereHas('user', fn ($q) => $q->where('email', $data['email']))
                ->exists();

            if ($alreadyJoined) {
                return response()->json([
                    'success' => false,
                    'message' => '이미 이벤트에 참가한 사용자입니다.',
                    'type' => 'warning'
                ]);
            }

            $alreadyInvited = EventInvitation::where('event_id', $event->id)
                ->where('email', $data['email'])
                ->where('status', 'pending')
                ->exists();

            if ($alreadyInvited) {
                return response()->json([
                    'success' => false,
                    'message' => '이미 초대가 발송된 이메일입니다.',
                    'type' => 'warning'
                ]);
            }

            do {
                $token = Str::random(64);
            } while (EventInvitation::where('token', $token)->exists());

            $invitation = DB::transaction(function () use ($event, $data, $token) {
                return EventInvitation::create([
                    'event_id' => $event->id,
                    'inviter_id' => Auth::id(),
                    'email' => $data['email'],
                    'role' => $data['role'],
                    'token' => $token,
                    'status' => 'pending',
                    'expires_at' => now()->addDays(7),
                ]);
            });

            Mail::html(
                '<p>이벤트에 초대되었습니다.</p>
                    <p>
                       <a href="' . url("/invitations/{$invitation->token}") . '">
                           👉 초대 수락하기
                       </a>
                    </p>',
                function ($message) use ($data) {
                    $message->to($data['email'])
                        ->subject('이벤트 초대가 도착했습니다');
                }
            );


            return response()->json([
                'success' => true,
                'message' => '초대가 성공적으로 발송되었습니다.',
                'type' => 'success',
                'invitationId' => $invitation->id
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '초대를 보내는 중 문제가 발생하였습니다.',
                'type' => 'danger',
            ]);
        }
    }
}
