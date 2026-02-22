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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    use EventPermission;

    public function SummarizeEventWithAi(Request $request, string $uuid)
    {
        $event = Event::where('uuid', $uuid)->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 존재하지 않습니다.',
                'type' => 'danger'
            ], 404);
        }

        if (!$this->canEditEvent($event->id)) {
            return response()->json([
                'success' => false,
                'message' => '이벤트를 수정할 권한이 없습니다.',
                'type' => 'danger'
            ], 403);
        }

        if (!in_array($event->type, ['normal', 'dday'], true)) {
            return response()->json([
                'success' => false,
                'message' => '해당 타입에서는 이 기능을 사용할 수 없습니다.',
                'type' => 'danger'
            ], 422);
        }

        $data = $request->validate([
            'source_text' => ['required', 'string', 'max:20000'],
            'model_name' => ['nullable', 'string', 'max:120'],
            'last_known_version' => ['nullable', 'integer', 'min:1'],
        ]);

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'AI API 키가 설정되어 있지 않습니다.',
                'type' => 'danger',
            ], 500);
        }

        try {
            $sourceText = trim((string)($data['source_text'] ?? ''));
            if ($sourceText === '') {
                return response()->json([
                    'success' => false,
                    'message' => '정리할 내용을 입력해주세요.',
                    'type' => 'danger',
                ], 422);
            }
            $expectedVersion = (int)($data['last_known_version'] ?? $event->lock_version ?? 1);

            $model = $data['model_name'] ?? 'models/gemini-2.5-flash';
            $url = "https://generativelanguage.googleapis.com/v1beta/{$model}:generateContent?key={$apiKey}";
            $prompt = "너는 사용자 메모 정리 도우미다. 아래 텍스트를 한국어 Markdown으로 정리해.\n"
                . "규칙:\n"
                . "1) Markdown 형식으로만 답변한다.\n"
                . "2) 핵심 요약, 실행 항목(체크리스트), 참고 링크/메모 섹션을 포함한다.\n"
                . "3) 원문에 없는 사실을 만들지 않는다.\n"
                . "4) 너무 장황하지 않게, 읽기 쉽게 구조화한다.\n\n"
                . "원문:\n" . $sourceText;

            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(45)
                ->post($url, [
                    'contents' => [[
                        'parts' => [['text' => $prompt]],
                    ]],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'maxOutputTokens' => 3072,
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('Gemini event summary failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'event_uuid' => $event->uuid,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'AI 요약 생성 요청에 실패했습니다.',
                    'type' => 'danger',
                ], $response->status());
            }

            $json = $response->json();
            $summary = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if (!$summary) {
                return response()->json([
                    'success' => false,
                    'message' => '요약 결과를 생성하지 못했습니다.',
                    'type' => 'danger',
                ], 500);
            }

            $updated = Event::query()
                ->where('id', $event->id)
                ->where('lock_version', $expectedVersion)
                ->update([
                    'ai_source_text' => $sourceText,
                    'ai_summary' => trim((string)$summary),
                    'lock_version' => $expectedVersion + 1,
                    'updated_at' => now(),
                ]);

            if ($updated === 0) {
                $latest = Event::query()->find($event->id);
                return response()->json([
                    'success' => false,
                    'message' => '다른 사용자가 먼저 수정했습니다. 최신 내용으로 동기화 후 다시 시도해주세요.',
                    'type' => 'warning',
                    'event' => $latest,
                ], 409);
            }

            $event = Event::query()->find($event->id);

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
                'type' => 'success',
                'message' => 'AI 정리가 완료되었습니다.',
                'source_text' => $event->ai_source_text,
                'summary' => $event->ai_summary,
                'event' => $event,
            ]);
        } catch (\Throwable $e) {
            Log::error('Event AI summary error', [
                'event_uuid' => $event->uuid,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI 정리 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

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

        $lastKnownVersion = $request->input('last_known_version');
        if ($lastKnownVersion !== null && !filter_var($lastKnownVersion, FILTER_VALIDATE_INT)) {
            return response()->json([
                'success' => false,
                'message' => '수정 버전 정보가 올바르지 않습니다.',
                'type' => 'danger',
            ], 422);
        }

        $expectedVersion = $lastKnownVersion !== null
            ? (int)$lastKnownVersion
            : (int)($event->lock_version ?? 1);

        if ($expectedVersion < 1) {
            return response()->json([
                'success' => false,
                'message' => '수정 버전 정보가 올바르지 않습니다.',
                'type' => 'danger',
            ], 422);
        }

        if ((int)$event->lock_version !== $expectedVersion) {
            return response()->json([
                'success' => false,
                'message' => '다른 사용자가 먼저 수정했습니다. 최신 내용으로 동기화 후 다시 시도해주세요.',
                'type' => 'warning',
                'event' => $event,
            ], 409);
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

        $nextPayload = [
            'title' => $request->title,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'description' => $request->description,
            'color' => $request->color,
        ];
        $event->fill($nextPayload);

        if (!$event->isDirty()) {
            return response()->json([
                'success' => true,
                'message' => '변경된 내용이 없습니다.',
                'event' => $event,
            ]);
        }

        $updated = Event::query()
            ->where('id', $event->id)
            ->where('lock_version', $expectedVersion)
            ->update([
                ...$nextPayload,
                'lock_version' => $expectedVersion + 1,
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            $latest = Event::query()->find($event->id);
            return response()->json([
                'success' => false,
                'message' => '다른 사용자가 먼저 수정했습니다. 최신 내용으로 동기화 후 다시 시도해주세요.',
                'type' => 'warning',
                'event' => $latest,
            ], 409);
        }

        $event = Event::query()->find($event->id);

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
