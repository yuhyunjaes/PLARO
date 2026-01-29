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

class EventParticipantController extends Controller
{
    public function GetActiveParticipants($uuid)
    {
        try {
            $event = Event::with([
                'eventUsers.user:id,name,email',
                'invitations'
            ])->where('uuid', $uuid)->firstOrFail();

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
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '참가자를 불러오는 중 오류가 발생했습니다.',
                'type' => 'danger'
            ], 500);
        }
    }

    public function DeleteParticipants(Request $request)
    {
        try {
            $event = Event::where('user_id', Auth::id())->where('uuid', $request->event_id)->firstOrFail();

            $data = $request->validate([
                'status' => 'required|in:EventUser,EventInvitation',
                'id' => 'required|integer',
            ]);

            DB::transaction(function () use ($event, $data) {

                if ($data['status'] === 'EventUser') {
                    $eventUser = EventUser::with('user', 'event')
                        ->where('user_id', $data['id'])
                        ->where('event_id', $event->id)
                        ->firstOrFail();

                    EventInvitation::where('event_id', $eventUser->event_id)
                        ->where('email', $eventUser->user->email)
                        ->firstOrFail()
                        ->delete();

                    $eventUser->delete();
                }

                if ($data['status'] === 'EventInvitation') {
                    EventInvitation::where('id',$data['id'])->where('event_id', $event->id)->firstOrFail()->delete();
                }
            });

            return response()->json(['success' => true], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '참가자를 제거하는 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }
}
