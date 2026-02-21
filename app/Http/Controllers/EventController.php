<?php

namespace App\Http\Controllers;

use App\Events\EventUpdated;
use App\Traits\EventPermission;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Events\EventDeleted;
use App\Models\EventUser;
use App\Models\Dday;
use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    use EventPermission;

    private function normalizeDdayRange(Carbon $startAtInput, Carbon $endAtInput): array
    {
        $startDate = $startAtInput->copy()->startOfDay();
        $today = Carbon::now(config('app.timezone'))->startOfDay();

        if ($startDate->lt($today)) {
            throw new \RuntimeException('D-day 시작일은 오늘보다 이전일 수 없습니다.');
        }

        $targetDate = $endAtInput->copy();

        // Month view stores day selections as [start, end) at 00:00.
        // For D-day, treat that as inclusive end-date selection.
        if (
            $targetDate->hour === 0
            && $targetDate->minute === 0
            && $targetDate->second === 0
            && $targetDate->greaterThan($startDate)
        ) {
            $targetDate->subDay();
        }

        $targetDate = $targetDate->startOfDay();

        if ($targetDate->lt($startDate)) {
            throw new \RuntimeException('D-day 목표일은 시작일보다 빠를 수 없습니다.');
        }

        return [
            'start_date' => $startDate,
            'target_date' => $targetDate,
            'event_start_at' => $startDate->copy()->startOfDay()->format('Y-m-d H:i:s'),
            'event_end_at' => $targetDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
            'duration_days' => $startDate->diffInDays($targetDate) + 1,
        ];
    }

    public function StoreEvents(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required'],
            'end_at' => ['required'],
            'color' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'in:normal,challenge,dday'],
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
            $eventType = $request->type ?? 'normal';
            $startAtInput = Carbon::parse($request->start_at)->setTimezone(config('app.timezone'));
            $endAtInput = Carbon::parse($request->end_at)->setTimezone(config('app.timezone'));

            $startAt = $startAtInput->format('Y-m-d H:i:s');
            $endAt = $endAtInput->format('Y-m-d H:i:s');
            $ddayRange = null;
            if ($eventType === 'dday') {
                $ddayRange = $this->normalizeDdayRange($startAtInput, $endAtInput);
                $startAt = $ddayRange['event_start_at'];
                $endAt = $ddayRange['event_end_at'];
            }

            $event = DB::transaction(function () use ($request, $startAt, $endAt, $eventSwitch, $eventType, $ddayRange) {
                $dday = null;

                if ($eventType === 'dday') {
                    $dday = Dday::create([
                        'uuid' => Str::uuid()->toString(),
                        'user_id' => Auth::id(),
                        'title' => $request->title,
                        'status' => 'active',
                        'start_date' => $ddayRange['start_date']->toDateString(),
                        'target_date' => $ddayRange['target_date']->toDateString(),
                        'duration_days' => max(1, (int)$ddayRange['duration_days']),
                        'current_day' => 1,
                        'streak_count' => 0,
                        'achievement_rate' => 0,
                        'last_check_date' => null,
                        'restart_count' => 0,
                        'color' => $eventSwitch ? "bg-blue-500" : $request->color,
                    ]);
                }

                $event = Event::create([
                    'uuid' => Str::uuid()->toString(),
                    'chat_id' => $eventSwitch ? $request->chat_id : null,
                    'creator_id' => Auth::id(),
                    'dday_id' => $dday?->id,
                    'title' => $request->title,
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                    'type' => $eventType,
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
                'message' => $e->getMessage() ?: '이벤트 생성중 문제가 발생하였습니다.',
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

        $startAtInput = Carbon::parse($request->start_at)->setTimezone(config('app.timezone'));
        $endAtInput = Carbon::parse($request->end_at)->setTimezone(config('app.timezone'));

        $startAt = $startAtInput->format('Y-m-d H:i:s');
        $endAt = $endAtInput->format('Y-m-d H:i:s');
        $ddayRange = null;
        if ($event->type === 'dday') {
            $ddayRange = $this->normalizeDdayRange($startAtInput, $endAtInput);
            $startAt = $ddayRange['event_start_at'];
            $endAt = $ddayRange['event_end_at'];
        }

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

        if ($event->type === 'dday' && $event->dday_id && $ddayRange) {
            $dday = Dday::query()->find($event->dday_id);
            if ($dday) {
                $dday->fill([
                    'title' => $request->title,
                    'start_date' => $ddayRange['start_date']->toDateString(),
                    'target_date' => $ddayRange['target_date']->toDateString(),
                    'duration_days' => max(1, (int)$ddayRange['duration_days']),
                    'color' => $request->color,
                ]);
                $dday->save();
            }
        }

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
        $query = Event::whereIn('id', function ($query) {
            $query->select('event_id')
                ->from('event_users')
                ->where('user_id', Auth::id());
        });

        $type = request('type');
        if (in_array($type, ['normal', 'challenge', 'dday'], true)) {
            $query->where('type', $type);
        }

        $events = $query->get();

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

            DB::transaction(function () use ($event) {
                if ($event->dday_id) {
                    $event->dday()?->delete();
                    return;
                }
                $event->delete();
            });

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
