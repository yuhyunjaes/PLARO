<?php

namespace App\Http\Controllers;

use App\Events\EventDeleted;
use App\Events\ParticipantDelete;
use App\Events\ParticipantUpdated;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\EventReminder;
use App\Models\EventUser;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EventParticipantController extends Controller
{
    public function GetActiveParticipants($uuid)
    {
        try {
            $event = Event::where('uuid', $uuid)
                ->whereHas('eventUsers', fn ($q) =>
                $q->where('user_id', auth()->id())
                )
                ->with([
                    'eventUsers.user:id,name,email',
                    'invitations'
                ])
                ->firstOrFail();

            $users = $event->eventUsers->map(function ($eu) use ($uuid) {
                return [
                    'user_name' => $eu->user->name,
                    'user_id' => $eu->user->id,
                    'event_id' => $uuid,
                    'email' => $eu->user->email,
                    'role' => $eu->role,
                    'status' => null,
                ];
            });

            $invitations = $event->invitations
                ->whereIn('status', ['pending', 'declined', 'expired'])
                ->map(function ($inv) use ($uuid) {
                    return [
                        'user_name' => null,
                        'user_id' => null,
                        'invitation_id' => $inv->id,
                        'event_id' => $uuid,
                        'email' => $inv->email,
                        'role' => null,
                        'status' => $inv->status,
                    ];
                });

            $participants = $users->merge($invitations)->values();

            return response()->json([
                'success' => true,
                'participants' => $participants
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '참가자를 불러오는 중 오류가 발생했습니다.',
                'type' => 'danger'
            ]);
        }
    }

    public function DeleteParticipants($uuid, Request $request)
    {
        try {
            $query = Event::where('uuid', $uuid);

            if (!$request->self) {
                $query->where('user_id', Auth::id());
            }

            $event = $query->firstOrFail();

            $data = $request->validate([
                'status' => 'required|in:EventUser,EventInvitation',
                'id' => 'required|integer',
            ]);

            if($data['status'] === "EventUser" && $data['id'] === $event->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => '소유자를 제거할 수 없습니다.',
                    'type' => 'danger',
                ]);
            }

            $deletedParticipant = null;

            DB::transaction(function () use ($event, $data, &$deletedParticipant) {

                if ($data['status'] === 'EventUser') {
                    $eventUser = EventUser::with('user', 'event')
                        ->where('user_id', $data['id'])
                        ->where('event_id', $event->id)
                        ->firstOrFail();

                    // 삭제 전 정보 저장
                    $deletedParticipant = [
                        'type' => 'user_removed',
                        'user_id' => $eventUser->user->id,
                        'email' => $eventUser->user->email,
                    ];

                    EventInvitation::where('event_id', $eventUser->event_id)
                        ->where('email', $eventUser->user->email)
                        ->firstOrFail()
                        ->delete();

                    EventReminder::where('user_id', $data['id'])->where('event_id', $event->id)->delete();

                    $eventUser->delete();
                }

                if ($data['status'] === 'EventInvitation') {
                    $invitation = EventInvitation::where('id',$data['id'])->where('event_id', $event->id)->firstOrFail();

                    // 삭제 전 정보 저장
                    $deletedParticipant = [
                        'type' => 'invitation_removed',
                        'invitation_id' => $invitation->id,
                        'email' => $invitation->email,
                    ];

                    $invitation->delete();
                }
            });

            // 참가자 제거 - 해당 이벤트 참가자들에게만 브로드캐스트
            if ($deletedParticipant) {
                broadcast(new ParticipantUpdated(
                    $event->uuid,
                    [
                        'type' => $deletedParticipant['type'],
                        'participant' => $deletedParticipant,
                        'user_id' => auth()->id(),
                    ]
                ))->toOthers();
            }

            if(isset($deletedParticipant['user_id'])) {
                broadcast(new ParticipantDelete(
                    userId: $deletedParticipant['user_id'],
                    eventUuid: $event->uuid,
                ))->toOthers();
            }

            return response()->json(['success' => true]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '참가자를 제거하는 중 오류가 발생했습니다.',
                'type' => 'danger',
            ]);
        }
    }

    public function DeleteParticipantsAll($uuid) {
        try {
            $event = Event::where('user_id', auth()->id())
                ->where('uuid', $uuid)
                ->firstOrFail();

            $removedUserIds = [];

            DB::transaction(function () use ($event, &$removedUserIds) {
                $removedUserIds = EventUser::where('event_id', $event->id)
                    ->where('user_id', '!=', $event->user_id)
                    ->pluck('user_id')
                    ->toArray();

                EventInvitation::where('event_id', $event->id)->delete();

                EventReminder::where('event_id', $event->id)
                    ->where('user_id', '!=', $event->user_id)
                    ->delete();

                EventUser::where('event_id', $event->id)
                    ->where('user_id', '!=', $event->user_id)
                    ->delete();
            });

            broadcast(new ParticipantUpdated(
                $event->uuid,
                [
                    'type' => 'participants_cleared',
                    'participant_ids' => $removedUserIds,
                    'user_id' => auth()->id(),
                ]
            ))->toOthers();

            foreach ($removedUserIds as $removedUserId) {
                broadcast(new ParticipantDelete(
                    userId: (int)$removedUserId,
                    eventUuid: $event->uuid,
                ))->toOthers();
            }

            return response()->json([
                'success' => true,
                'message' => '방장을 제외한 참가자를 모두 제거했습니다.',
                'type' => 'success',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 없거나 권한이 없습니다.',
                'type' => 'danger',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '참가자 전체 제거 중 오류가 발생했습니다.',
                'type' => 'danger',
            ]);
        }
    }
}
