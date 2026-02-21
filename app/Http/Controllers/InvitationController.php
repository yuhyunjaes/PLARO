<?php

namespace App\Http\Controllers;

use App\Events\ParticipantUpdated;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\EventUser;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Carbon\Carbon;

class InvitationController extends Controller
{
    public function show($token) {
        try {
            $invitation = EventInvitation::where('token', $token)
                ->where('status', 'pending')
                ->firstOrFail();

            if ($invitation->expires_at && Carbon::parse($invitation->expires_at)->isPast()) {
                $event = Event::findOrFail($invitation->event_id);

                DB::transaction(function () use ($invitation) {
                    $invitation->status = 'expired';
                    $invitation->save();
                });

                // 초대 만료 - 해당 이벤트 참가자들에게 브로드캐스트
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_expired',
                        'participant' => [
                            'invitation_id' => $invitation->id,
                            'email' => $invitation->email,
                            'status' => 'expired',
                        ],
                        'user_id' => 0,  // 시스템 이벤트
                    ]
                ))->toOthers();

                return Inertia::render('Status/Status', ['status' => 410, 'message' => '초대가 만료되었습니다.']);
            }

            $event = Event::with('user')->findOrFail($invitation->event_id);

            if(Auth::check()) {
                if (Auth::user()->email !== $invitation->email) {
                    return Inertia::render('Status/Status', ['status' => 403, 'message' => '이 초대는 해당 이메일 계정만 수락할 수 있습니다.']);
                }

            }

            return Inertia::render('Invitation/Accept', [
                'mode' => Auth::check() ? 'auth' : 'guest',

                'invitation' => [
                    'token' => $invitation->token,
                    'email' => $invitation->email,
                ],

                'event' => [
                    'id' => $event->id,
                    'uuid' => $event->uuid,
                    'title' => $event->title,
                ],

                'inviter' => [
                    'name' => $event->user->name,
                    'email' => $event->user->email,
                ],
            ]);

        } catch (\Throwable $e) {
            return Inertia::render('Status/Status', ['status' => 404]);
        }
    }

    public function Accept($token) {
        try {
            $invitation = EventInvitation::where('token', $token)
                ->where('status', 'pending')
                ->firstOrFail();

            if ($invitation->expires_at && Carbon::parse($invitation->expires_at)->isPast()) {
                $event = Event::findOrFail($invitation->event_id);

                DB::transaction(function () use ($invitation) {
                    $invitation->status = 'expired';
                    $invitation->save();
                });

                // 초대 만료 - 해당 이벤트 참가자들에게 브로드캐스트
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_expired',
                        'participant' => [
                            'invitation_id' => $invitation->id,
                            'email' => $invitation->email,
                            'status' => 'expired',
                        ],
                        'user_id' => 0,  // 시스템 이벤트
                    ]
                ))->toOthers();

                return Inertia::render('Status/Status', ['status' => 410, 'message' => '초대가 만료되었습니다.']);
            }

            if(!Auth::check()) {
                return Inertia::render('Status/Status', ['status' => 403]);
            }

            if (Auth::user()?->needsSocialProfileCompletion()) {
                return response()->json([
                    'success' => false,
                    'redirect' => route('social.complete.form'),
                    'message' => '기본 정보 입력이 필요합니다.',
                ], 409);
            }

            $event = null;
            $user = Auth::user();

            DB::transaction(function () use ($invitation, &$event) {
                $event = Event::findOrFail($invitation->event_id);

                $invitation->status = 'accepted';
                $invitation->save();

                EventUser::create([
                    'event_id' => $invitation->event_id,
                    'user_id'  => Auth::id(),
                    'role'     => $invitation->role,
                ]);
            });

            // 초대 수락 - 해당 이벤트 참가자들에게만 브로드캐스트
            if ($event) {
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_accepted',
                        'participant' => [
                            'user_name' => $user->name,
                            'user_id' => $user->id,
                            'event_id' => $event->uuid,
                            'email' => $user->email,
                            'role' => $invitation->role,
                            'status' => null,
                        ],
                        'user_id' => Auth::id(),
                    ]
                ))->toOthers();
            }

            return response()->json(['success' => true, 'uuid' => $event->uuid]);

        } catch (\Throwable $e) {
            return Inertia::render('Status/Status', ['status' => 404]);
        }
    }

    public function AcceptSession($token) {
        try {
            $invitation = EventInvitation::where('token', $token)
                ->where('status', 'pending')
                ->firstOrFail();

            if ($invitation->expires_at && Carbon::parse($invitation->expires_at)->isPast()) {
                $event = Event::findOrFail($invitation->event_id);

                DB::transaction(function () use ($invitation) {
                    $invitation->status = 'expired';
                    $invitation->save();
                });

                // 초대 만료 - 해당 이벤트 참가자들에게 브로드캐스트
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_expired',
                        'participant' => [
                            'invitation_id' => $invitation->id,
                            'email' => $invitation->email,
                            'status' => 'expired',
                        ],
                        'user_id' => 0,  // 시스템 이벤트
                    ]
                ))->toOthers();

                return Inertia::render('Status/Status', ['status' => 410, 'message' => '초대가 만료되었습니다.']);
            }

            Session::put([
                'invitation_token' => $token,
                'invitation_active' => true,
                'invitation_session_started_at' => now()->timestamp,
            ]);

            return response()->json(['success' => true, 'redirect' => 'login']);

        } catch (\Throwable $e) {
            return response()->json(['success' => false]);
        }
    }


    public function Decline($token) {
        try {
            $invitation = EventInvitation::where('token', $token)
                ->where('status', 'pending')
                ->firstOrFail();

            if ($invitation->expires_at && Carbon::parse($invitation->expires_at)->isPast()) {
                $event = Event::findOrFail($invitation->event_id);

                DB::transaction(function () use ($invitation) {
                    $invitation->status = 'expired';
                    $invitation->save();
                });

                // 초대 만료 - 해당 이벤트 참가자들에게 브로드캐스트
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_expired',
                        'participant' => [
                            'invitation_id' => $invitation->id,
                            'email' => $invitation->email,
                            'status' => 'expired',
                        ],
                        'user_id' => 0,  // 시스템 이벤트
                    ]
                ))->toOthers();

                return Inertia::render('Status/Status', ['status' => 410, 'message' => '초대가 만료되었습니다.']);
            }

            $event = null;

            DB::transaction(function () use ($invitation, &$event) {
                $event = Event::findOrFail($invitation->event_id);

                $invitation->status = 'declined';
                $invitation->save();
            });

            // 초대 거절 - 해당 이벤트 참가자들에게만 브로드캐스트
            if ($event) {
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => 'invitation_declined',
                        'participant' => [
                            'invitation_id' => $invitation->id,
                            'email' => $invitation->email,
                            'status' => 'declined',
                        ],
                        'user_id' => Auth::id(),
                    ]
                ))->toOthers();
            }

            return Inertia::render('Status/Status', [
                'status' => 200,
                'message' => '초대를 거절했습니다.',
            ]);

        } catch (\Throwable $e) {
            return Inertia::render('Status/Status', ['status' => 404]);
        }
    }
}
