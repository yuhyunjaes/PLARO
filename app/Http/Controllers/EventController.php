<?php

namespace App\Http\Controllers;

use App\Events\EventUpdated;
use App\Traits\EventPermission;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Events\EventDeleted;
use App\Models\EventUser;
use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    use EventPermission;

    public function StoreEvents(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required'],
            'end_at' => ['required'],
            'color' => ['nullable', 'string', 'max:255'],
        ], [
            'title.required' => '이벤트 제목을 입력해주세요.',
            'title.max' => '이벤트 제목은 최대 255자까지 가능합니다.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(), // 프론트에서 바로 사용
                'type' => 'danger',
            ]);
        }

        try {
            $eventSwitch = $request->eventSwitch === 'chat';

            $startAt = Carbon::parse($request->start_at)
                ->setTimezone(config('app.timezone'))
                ->format('Y-m-d H:i:s');

            $endAt = Carbon::parse($request->end_at)
                ->setTimezone(config('app.timezone'))
                ->format('Y-m-d H:i:s');

            $event = DB::transaction(function () use ($request, $startAt, $endAt, $eventSwitch) {
                $event = Event::create([
                    'uuid' => Str::uuid()->toString(),
                    'chat_id' => $eventSwitch ? $request->chat_id : null,
                    'creator_id' => Auth::id(),
                    'title' => $request->title,
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                    'description' => $request->description,
                    'color' => $eventSwitch ? "bg-blue-500" : $request->color,
                ]);

                EventUser::create([
                    'event_id' => $event->id,
                    'user_id' => Auth::id(),
                    'role' => 'owner',
                ]);

                return $event;
            });

            return response()->json([
                'success' => true,
                'message' => '이벤트가 생성되었습니다.',
                'type' => 'success',
                'event' => $event,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '이벤트 생성중 문제가 발생하였습니다.',
                'type' => 'danger',
            ]);
        }
    }

    public function UpdateEvents(Request $request, $uuid) {
        $event = Event::where('uuid', $uuid)->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        if (!$this->canEditEvent($event->id)) {
            return response()->json([
                'success' => false,
                'message' => '이벤트를 수정할 권한이 없습니다.',
                'type' => 'danger'
            ]);
        }

        $startAt = Carbon::parse($request->start_at)
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');

        $endAt = Carbon::parse($request->end_at)
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');

        $event->fill([
            'title' => $request->title,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'description' => $request->description,
            'color' => $request->color,
        ]);

        if (!$event->isDirty()) {
            return response()->json([
                'success' => true,
                'message' => '변경된 내용이 없습니다.',
                'event' => $event,
            ]);
        }

        $event->save();

        broadcast(new EventUpdated(
            $event->uuid,
            [
                'event' => $event->toArray(),
                'update_by' => auth()->id(),
                'participant_ids' => EventUser::where('event_id', $event->id)
                    ->pluck('user_id')
                    ->toArray(),
            ]
        ))->toOthers();

        return response()->json([
            'success' => true,
            'event' => $event,
        ]);
    }

    public function GetActiveEvents($uuid)
    {
        $event = Event::where('uuid', $uuid)->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        if (!$this->canViewEvent($event->id)) {
            return response()->json([
                'success' => false,
                'message' => '이벤트에 접근할 권한이 없습니다.',
                'type' => 'danger'
            ]);
        }

        return response()->json([
            'success' => true,
            'event' => $event
        ]);
    }

    public function GetEvents()
    {
        $events = Event::whereIn('id', function ($query) {
            $query->select('event_id')
                ->from('event_users')
                ->where('user_id', Auth::id());
        })->get();

        return response()->json([
            'success' => true,
            'events' => $events
        ]);
    }

    public function DeleteEvents($uuid)
    {
        try {
            $event = Event::where('uuid', $uuid)->firstOrFail();

            if (!$this->isOwner($event->id)) {
                return response()->json([
                    'success' => false,
                    'message' => '이벤트를 삭제할 권한이 없습니다.',
                    'type' => 'danger'
                ]);
            }

            $eventUuid = $event->uuid;
            $deletedBy = Auth::id();

            $participantIds = EventUser::where('event_id', $event->id)
                ->pluck('user_id')
                ->toArray();

            $event->delete();

            broadcast(new EventDeleted(
                eventUuid: $eventUuid,
                deletedBy: $deletedBy,
                participantIds: $participantIds,
            ))->toOthers();

            return response()->json([
                'success' => true
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }
    }

}
