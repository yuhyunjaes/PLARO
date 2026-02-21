<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\ChallengeDailyLog;
use App\Models\ChallengeDayTask;
use App\Models\ChallengeTemplate;
use App\Models\Event;
use App\Models\EventUser;
use App\Traits\EventPermission;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChallengeController extends Controller
{
    use EventPermission;

    public function StartChallenge(Request $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $validated = $request->validate([
            'template_uuid' => ['required', 'string'],
            'start_date' => ['nullable', 'date'],
            'color' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $template = ChallengeTemplate::query()
                ->with([
                    'days' => function ($q) {
                        $q->orderBy('day_number')->orderBy('task_order');
                    }
                ])
                ->where('uuid', $validated['template_uuid'])
                ->where('is_active', true)
                ->firstOrFail();

            $canUse = $template->visibility === 'public' || (int)$template->owner_id === (int)$userId || (bool)$template->is_system;
            if (!$canUse) {
                return response()->json([
                    'success' => false,
                    'message' => '해당 템플릿을 사용할 수 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if ($template->days->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => '일차별 할 일이 없는 템플릿입니다.',
                    'type' => 'danger',
                ], 422);
            }

            $startDate = isset($validated['start_date'])
                ? Carbon::parse($validated['start_date'])->startOfDay()
                : Carbon::now(config('app.timezone'))->startOfDay();
            $endDate = (clone $startDate)->addDays(((int)$template->duration_days) - 1);

            $createdChallenge = null;
            $createdEvent = null;

            DB::transaction(function () use (
                $template,
                $userId,
                $startDate,
                $endDate,
                $validated,
                &$createdChallenge,
                &$createdEvent
            ) {
                $createdChallenge = Challenge::create([
                    'uuid' => (string)Str::uuid(),
                    'user_id' => $userId,
                    'template_id' => $template->id,
                    'title' => $template->title,
                    'mode' => 'template',
                    'status' => 'active',
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'current_day' => 1,
                    'streak_count' => 0,
                    'achievement_rate' => 0,
                    'last_check_date' => null,
                    'restart_count' => 0,
                    'review' => null,
                    'ai_summary' => null,
                    'color' => $validated['color'] ?? 'bg-blue-500',
                ]);

                foreach ($template->days as $templateDay) {
                    ChallengeDayTask::create([
                        'challenge_id' => $createdChallenge->id,
                        'day_number' => (int)$templateDay->day_number,
                        'task_order' => (int)$templateDay->task_order,
                        'title' => $templateDay->title,
                        'description' => $templateDay->description,
                        'is_required' => (bool)$templateDay->is_required,
                        'is_done' => false,
                        'done_at' => null,
                    ]);
                }

                $createdEvent = Event::create([
                    'uuid' => (string)Str::uuid(),
                    'chat_id' => null,
                    'creator_id' => $userId,
                    'challenge_id' => $createdChallenge->id,
                    'title' => $template->title . ' 챌린지',
                    'start_at' => $startDate->format('Y-m-d H:i:s'),
                    'end_at' => $endDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
                    'type' => 'challenge',
                    'status' => 'active',
                    'description' => $template->description,
                    'color' => $validated['color'] ?? 'bg-blue-500',
                ]);

                EventUser::create([
                    'event_id' => $createdEvent->id,
                    'user_id' => $userId,
                    'role' => 'owner',
                ]);

                $template->increment('usage_count');
            });

            $payload = $this->buildChallengePayload($createdChallenge->id);

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => '챌린지가 시작되었습니다.',
                'event' => $createdEvent,
                'challenge' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 시작 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function GetChallengeByEvent(string $eventUuid): JsonResponse
    {
        try {
            $event = Event::query()
                ->where('uuid', $eventUuid)
                ->where('type', 'challenge')
                ->firstOrFail();

            if (!$this->canViewEvent($event->id)) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지에 접근할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if (!$event->challenge_id) {
                return response()->json([
                    'success' => false,
                    'message' => '연결된 챌린지가 없습니다.',
                    'type' => 'danger',
                ], 404);
            }

            $payload = $this->buildChallengePayload((int)$event->challenge_id);
            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지 정보를 불러오지 못했습니다.',
                    'type' => 'danger',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'challenge' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 정보를 불러오지 못했습니다.',
                'type' => 'danger',
            ], 404);
        }
    }

    public function UpdateChallengeDayTask(Request $request, string $challengeUuid, int $taskId): JsonResponse
    {
        $validated = $request->validate([
            'is_done' => ['required', 'boolean'],
        ]);

        try {
            $challenge = Challenge::query()
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지를 수정할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if ($challenge->status === 'completed' || $challenge->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => '종료된 챌린지는 할 일을 수정할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $task = ChallengeDayTask::query()
                ->where('id', $taskId)
                ->where('challenge_id', $challenge->id)
                ->firstOrFail();

            $unlockedDay = $this->getUnlockedDay($challenge);
            if ((int)$task->day_number !== $unlockedDay) {
                return response()->json([
                    'success' => false,
                    'message' => '오늘 일차의 미션만 수정할 수 있습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $nextDone = (bool)$validated['is_done'];
            $task->is_done = $nextDone;
            $task->done_at = $nextDone ? Carbon::now(config('app.timezone')) : null;
            $task->save();

            $this->refreshChallengeSummary($challenge);

            $payload = $this->buildChallengePayload($challenge->id);

            return response()->json([
                'success' => true,
                'message' => '할 일 상태가 업데이트되었습니다.',
                'type' => 'success',
                'challenge' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '할 일 상태 업데이트에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function UpsertChallengeDailyLog(Request $request, string $challengeUuid): JsonResponse
    {
        $validated = $request->validate([
            'log_date' => ['required', 'date'],
            'review_text' => ['nullable', 'string'],
            'difficulty_score' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        try {
            $challenge = Challenge::query()
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지 일지를 수정할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $logDate = Carbon::parse($validated['log_date'])->toDateString();
            $startDate = Carbon::parse($challenge->start_date)->startOfDay();
            $today = Carbon::now(config('app.timezone'))->startOfDay();
            $targetDate = Carbon::parse($logDate)->startOfDay();

            if ($targetDate->lt($startDate) || $targetDate->gt($today)) {
                return response()->json([
                    'success' => false,
                    'message' => '저장할 수 없는 일차의 일지입니다.',
                    'type' => 'warning',
                ], 422);
            }

            $targetDay = $startDate->diffInDays($targetDate) + 1;
            if ($targetDay > $this->getUnlockedDay($challenge)) {
                return response()->json([
                    'success' => false,
                    'message' => '아직 해당 일차는 기록할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $log = ChallengeDailyLog::updateOrCreate(
                [
                    'challenge_id' => $challenge->id,
                    'log_date' => $logDate,
                ],
                [
                    'review_text' => $validated['review_text'] ?? null,
                    'difficulty_score' => $validated['difficulty_score'] ?? null,
                ]
            );

            $challenge->review = $validated['review_text'] ?? null;
            $challenge->save();

            $payload = $this->buildChallengePayload($challenge->id);

            return response()->json([
                'success' => true,
                'message' => '일지가 저장되었습니다.',
                'type' => 'success',
                'log' => [
                    'id' => $log->id,
                    'log_date' => Carbon::parse($log->log_date)->toDateString(),
                    'review_text' => $log->review_text,
                    'difficulty_score' => $log->difficulty_score,
                    'updated_at' => optional($log->updated_at)->toISOString(),
                ],
                'challenge' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '일지 저장에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function RetryChallenge(string $challengeUuid): JsonResponse
    {
        try {
            $challenge = Challenge::query()
                ->with([
                    'template' => function ($q) {
                        $q->with(['days' => fn ($dayQ) => $dayQ->orderBy('day_number')->orderBy('task_order')]);
                    }
                ])
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지를 재도전할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $metrics = $this->getChallengeMetrics($challenge);
            if (!$metrics['can_retry']) {
                return response()->json([
                    'success' => false,
                    'message' => '현재는 재도전할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            if (!$challenge->template || $challenge->template->days->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => '재시작할 템플릿 정보가 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $today = Carbon::now(config('app.timezone'))->startOfDay();
            $durationDays = max(1, (int)($challenge->template?->duration_days ?? 1));
            $newEndDate = (clone $today)->addDays($durationDays - 1);

            $event = null;

            DB::transaction(function () use ($challenge, $today, $newEndDate, &$event) {
                ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->delete();

                foreach ($challenge->template->days as $templateDay) {
                    ChallengeDayTask::create([
                        'challenge_id' => $challenge->id,
                        'day_number' => (int)$templateDay->day_number,
                        'task_order' => (int)$templateDay->task_order,
                        'title' => $templateDay->title,
                        'description' => $templateDay->description,
                        'is_required' => (bool)$templateDay->is_required,
                        'is_done' => false,
                        'done_at' => null,
                    ]);
                }

                ChallengeDailyLog::query()
                    ->where('challenge_id', $challenge->id)
                    ->delete();

                $challenge->fill([
                    'status' => 'active',
                    'start_date' => $today->toDateString(),
                    'end_date' => $newEndDate->toDateString(),
                    'current_day' => 1,
                    'streak_count' => 0,
                    'achievement_rate' => 0,
                    'last_check_date' => null,
                    'restart_count' => ((int)$challenge->restart_count) + 1,
                    'review' => null,
                    'ai_summary' => null,
                ]);
                $challenge->save();

                $event = $challenge->event;
                if ($event) {
                    $event->update([
                        'start_at' => $today->format('Y-m-d H:i:s'),
                        'end_at' => $newEndDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
                        'status' => 'active',
                    ]);
                }
            });

            $payload = $this->buildChallengePayload($challenge->id);

            return response()->json([
                'success' => true,
                'message' => '챌린지를 재도전으로 다시 시작했습니다.',
                'type' => 'success',
                'challenge' => $payload,
                'event' => $event,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 재도전에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function ExtendChallenge(string $challengeUuid): JsonResponse
    {
        try {
            $challenge = Challenge::query()
                ->with([
                    'template' => function ($q) {
                        $q->with(['days' => fn ($dayQ) => $dayQ->orderBy('day_number')->orderBy('task_order')]);
                    }
                ])
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지를 연장할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if (!$challenge->template || $challenge->template->days->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => '연장할 템플릿 정보가 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $currentDurationDays = $this->getChallengeDurationDays($challenge);
            $templateDurationDays = max(1, (int)$challenge->template->duration_days);
            $baseEndDate = $challenge->end_date
                ? Carbon::parse($challenge->end_date)->startOfDay()
                : Carbon::parse($challenge->start_date)->startOfDay()->addDays($currentDurationDays - 1);
            $newEndDate = (clone $baseEndDate)->addDays($templateDurationDays);
            $event = null;

            DB::transaction(function () use (
                $challenge,
                $currentDurationDays,
                $newEndDate,
                &$event
            ) {
                foreach ($challenge->template->days as $templateDay) {
                    ChallengeDayTask::create([
                        'challenge_id' => $challenge->id,
                        'day_number' => $currentDurationDays + (int)$templateDay->day_number,
                        'task_order' => (int)$templateDay->task_order,
                        'title' => $templateDay->title,
                        'description' => $templateDay->description,
                        'is_required' => (bool)$templateDay->is_required,
                        'is_done' => false,
                        'done_at' => null,
                    ]);
                }

                $challenge->end_date = $newEndDate->toDateString();
                $challenge->status = 'active';
                $challenge->ai_summary = null;
                $challenge->save();

                $event = $challenge->event;
                if ($event) {
                    $event->update([
                        'end_at' => $newEndDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
                        'status' => 'active',
                    ]);
                }
            });

            $this->refreshChallengeSummary($challenge);
            $payload = $this->buildChallengePayload($challenge->id);

            return response()->json([
                'success' => true,
                'message' => '챌린지를 템플릿 1회분 연장했습니다.',
                'type' => 'success',
                'challenge' => $payload,
                'event' => $event,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 연장에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function DeleteChallenge(string $challengeUuid): JsonResponse
    {
        try {
            $challenge = Challenge::query()
                ->with('event:id,uuid,challenge_id')
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지를 삭제할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $eventUuid = $challenge->event?->uuid;

            DB::transaction(function () use ($challenge) {
                $challenge->delete();
            });

            return response()->json([
                'success' => true,
                'message' => '챌린지가 삭제되었습니다.',
                'type' => 'success',
                'event_uuid' => $eventUuid,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 삭제에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function UpdateChallengeColor(Request $request, string $challengeUuid): JsonResponse
    {
        $validated = $request->validate([
            'color' => ['required', 'in:bg-red-500,bg-orange-500,bg-yellow-500,bg-green-500,bg-blue-500,bg-purple-500,bg-gray-500'],
        ]);

        try {
            $challenge = Challenge::query()
                ->with('event:id,uuid,challenge_id,color')
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지 색상을 수정할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $color = $validated['color'];

            DB::transaction(function () use ($challenge, $color) {
                $challenge->update(['color' => $color]);
                $challenge->event()?->update(['color' => $color]);
            });

            return response()->json([
                'success' => true,
                'message' => '챌린지 색상이 업데이트되었습니다.',
                'type' => 'success',
                'color' => $color,
                'event_uuid' => $challenge->event?->uuid,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 색상 업데이트에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function SummarizeChallengeWithAi(Request $request, string $challengeUuid): JsonResponse
    {
        $data = $request->validate([
            'model_name' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $challenge = Challenge::query()
                ->with([
                    'template:id,title,duration_days',
                    'dayTasks' => fn ($q) => $q->orderBy('day_number')->orderBy('task_order'),
                    'dailyLogs' => fn ($q) => $q->orderBy('log_date'),
                ])
                ->where('uuid', $challengeUuid)
                ->firstOrFail();

            if ((int)$challenge->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => '챌린지 요약을 볼 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'GEMINI_API_KEY is not configured.',
                    'type' => 'danger',
                ], 500);
            }

            $requiredTasks = $challenge->dayTasks->where('is_required', true);
            $optionalTasks = $challenge->dayTasks->where('is_required', false);
            $startDate = $challenge->start_date ? Carbon::parse($challenge->start_date)->startOfDay() : null;
            $logsByDayNumber = [];
            foreach ($challenge->dailyLogs as $log) {
                if (!$startDate) {
                    continue;
                }

                $logDate = Carbon::parse($log->log_date)->startOfDay();
                $dayNumber = $startDate->diffInDays($logDate) + 1;
                if ($dayNumber < 1) {
                    continue;
                }

                $logsByDayNumber[$dayNumber] = [
                    'log_date' => $logDate->toDateString(),
                    'difficulty_score' => $log->difficulty_score,
                    'review_text' => $log->review_text,
                ];
            }

            $tasksByDay = $challenge->dayTasks
                ->groupBy('day_number')
                ->map(function ($tasks, $dayNumber) {
                    return [
                        'day_number' => (int)$dayNumber,
                        'tasks' => $tasks->map(fn ($task) => [
                            'task_order' => (int)$task->task_order,
                            'title' => $task->title,
                            'description' => $task->description,
                            'is_required' => (bool)$task->is_required,
                            'is_done' => (bool)$task->is_done,
                            'done_at' => $task->done_at ? Carbon::parse($task->done_at)->toISOString() : null,
                        ])->values(),
                    ];
                })
                ->sortBy('day_number')
                ->values();

            $dayOverview = $tasksByDay
                ->map(function ($day) use ($logsByDayNumber) {
                    $dayNumber = (int)$day['day_number'];
                    $tasks = collect($day['tasks']);
                    $requiredTasks = $tasks->where('is_required', true);
                    $optionalTasks = $tasks->where('is_required', false);

                    $completedMissionTitles = $tasks
                        ->where('is_done', true)
                        ->map(function ($task) {
                            $type = (bool)$task['is_required'] ? '필수' : '선택';
                            return "{$task['task_order']}. {$task['title']} ({$type})";
                        })
                        ->values();

                    return [
                        'day_number' => $dayNumber,
                        'required_done' => $requiredTasks->where('is_done', true)->count(),
                        'required_total' => $requiredTasks->count(),
                        'optional_done' => $optionalTasks->where('is_done', true)->count(),
                        'optional_total' => $optionalTasks->count(),
                        'completed_missions' => $completedMissionTitles,
                        'difficulty_score' => $logsByDayNumber[$dayNumber]['difficulty_score'] ?? null,
                        'review_text' => $logsByDayNumber[$dayNumber]['review_text'] ?? null,
                        'log_date' => $logsByDayNumber[$dayNumber]['log_date'] ?? null,
                    ];
                })
                ->values();

            $payload = [
                'title' => $challenge->title,
                'status' => $challenge->status,
                'start_date' => optional($challenge->start_date)->toDateString(),
                'end_date' => optional($challenge->end_date)->toDateString(),
                'achievement_rate' => (int)$challenge->achievement_rate,
                'streak_count' => (int)$challenge->streak_count,
                'required' => [
                    'done' => $requiredTasks->where('is_done', true)->count(),
                    'total' => $requiredTasks->count(),
                ],
                'optional' => [
                    'done' => $optionalTasks->where('is_done', true)->count(),
                    'total' => $optionalTasks->count(),
                ],
                'challenge_day_tasks' => $challenge->dayTasks->map(fn ($task) => [
                    'day_number' => (int)$task->day_number,
                    'task_order' => (int)$task->task_order,
                    'title' => $task->title,
                    'description' => $task->description,
                    'is_required' => (bool)$task->is_required,
                    'is_done' => (bool)$task->is_done,
                    'done_at' => $task->done_at ? Carbon::parse($task->done_at)->toISOString() : null,
                ])->values(),
                'mission_details_by_day' => $tasksByDay,
                'day_overview' => $dayOverview,
                'daily_logs' => $challenge->dailyLogs->map(fn ($log) => [
                    'log_date' => Carbon::parse($log->log_date)->toDateString(),
                    'difficulty_score' => $log->difficulty_score,
                    'review_text' => $log->review_text,
                ])->values(),
            ];

            $model = $data['model_name'] ?? 'models/gemini-2.5-flash';
            $url = "https://generativelanguage.googleapis.com/v1beta/{$model}:generateContent?key={$apiKey}";
            $prompt = "너는 챌린지 리포트 작성자다. 아래 JSON 데이터만 근거로 한국어 요약을 작성해.\n"
                . "출력 규칙(반드시 준수):\n"
                . "1) 아래 라벨 7개를 정확히 포함한다.\n"
                . "총평:\n일차별 한눈에:\n수행 미션:\n난이도 흐름:\n잘한 점:\n아쉬운 점:\n다음 도전 제안:\n"
                . "2) 전체는 12~20줄.\n"
                . "3) '일차별 한눈에'는 일차별 진행 데이터 기준으로 Day별로 무엇을 했는지와 난이도 점수를 요약한다.\n"
                . "4) '수행 미션'에는 완료된 실제 미션명을 최소 3개 이상 쓰고, 필수/선택을 구분한다.\n"
                . "5) '난이도 흐름'은 일지와 난이도 점수를 기반으로 어느 날이 어려웠는지 설명한다.\n"
                . "6) 데이터가 부족하면 반드시 '추정'이라고 표시한다.\n"
                . "7) JSON에 없는 사실은 작성하지 않는다.\n"
                . "8) 내부 시스템 키/컬럼명(JSON 키 이름)은 출력에 절대 쓰지 않는다.\n\n"
                . "데이터(JSON):\n" . json_encode($payload, JSON_UNESCAPED_UNICODE);

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
                Log::warning('Gemini challenge summary failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Gemini request failed.',
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

            $challenge->ai_summary = trim($summary);
            $challenge->save();

            return response()->json([
                'success' => true,
                'type' => 'success',
                'summary' => $challenge->ai_summary,
                'challenge' => $this->buildChallengePayload($challenge->id),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '챌린지 AI 요약 생성 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    private function refreshChallengeSummary(Challenge $challenge): void
    {
        $challenge->loadMissing('template');

        $durationDays = $this->getChallengeDurationDays($challenge);

        $unlockedDay = $this->getUnlockedDay($challenge);
        $currentDay = $unlockedDay;

        $totalTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->count();

        $doneTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->where('is_done', true)
            ->count();

        $totalRequiredTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->where('is_required', true)
            ->count();

        $doneRequiredTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->where('is_required', true)
            ->where('is_done', true)
            ->count();

        // 달성률은 "전체 필수 미션" 기준으로 계산
        $achievementRate = 0;
        if ($totalRequiredTaskCount > 0) {
            $achievementRate = (int) round((((float) $doneRequiredTaskCount) / ((float) $totalRequiredTaskCount)) * 100);
        }

        $streakCount = 0;
        for ($day = 1; $day <= $unlockedDay; $day++) {
            $dayTotal = ChallengeDayTask::query()
                ->where('challenge_id', $challenge->id)
                ->where('day_number', $day)
                ->where('is_required', true)
                ->count();
            if ($dayTotal <= 0) {
                break;
            }

            $dayDone = ChallengeDayTask::query()
                ->where('challenge_id', $challenge->id)
                ->where('day_number', $day)
                ->where('is_required', true)
                ->where('is_done', true)
                ->count();

            $allDone = $dayTotal === $dayDone;
            if (!$allDone) {
                break;
            }
            $streakCount++;
        }

        $lastDoneAt = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->whereNotNull('done_at')
            ->max('done_at');

        $allCompleted = $totalRequiredTaskCount > 0
            && $doneRequiredTaskCount === $totalRequiredTaskCount;
        $status = $allCompleted ? 'completed' : 'active';

        $challenge->fill([
            'current_day' => $currentDay,
            'streak_count' => $streakCount,
            'achievement_rate' => $achievementRate,
            'last_check_date' => $lastDoneAt ? Carbon::parse($lastDoneAt)->toDateString() : null,
            'status' => $status,
        ]);

        if ($allCompleted && !$challenge->end_date) {
            $challenge->end_date = Carbon::now(config('app.timezone'))->toDateString();
        }

        $challenge->save();

        $challenge->event()?->update([
            'status' => $status === 'completed' ? 'completed' : 'active',
        ]);
    }

    private function buildChallengePayload(int $challengeId): ?array
    {
        $challenge = Challenge::query()
            ->with([
                'template:id,uuid,title,icon,duration_days',
                'dayTasks' => function ($q) {
                    $q->orderBy('day_number')->orderBy('task_order');
                },
                'dailyLogs' => function ($q) {
                    $q->orderByDesc('log_date')->orderByDesc('id');
                },
                'event:id,uuid,challenge_id',
            ])
            ->find($challengeId);

        if (!$challenge) {
            return null;
        }

        $metrics = $this->getChallengeMetrics($challenge);
        $durationDays = $this->getChallengeDurationDays($challenge);
        $templateDurationDays = max(1, (int)($challenge->template?->duration_days ?? 1));
        $extensionCount = max(0, intdiv(max(0, $durationDays - $templateDurationDays), $templateDurationDays));

        $days = $challenge->dayTasks
            ->groupBy('day_number')
            ->map(function ($tasks, $dayNumber) {
                return [
                    'day_number' => (int)$dayNumber,
                    'tasks' => $tasks->map(function ($task) {
                        return [
                            'id' => $task->id,
                            'day_number' => (int)$task->day_number,
                            'task_order' => (int)$task->task_order,
                            'title' => $task->title,
                            'description' => $task->description,
                            'is_required' => (bool)$task->is_required,
                            'is_done' => (bool)$task->is_done,
                            'done_at' => optional($task->done_at)->toISOString(),
                        ];
                    })->values(),
                ];
            })
            ->sortBy('day_number')
            ->values();

        $logs = $challenge->dailyLogs
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'log_date' => Carbon::parse($log->log_date)->toDateString(),
                    'review_text' => $log->review_text,
                    'difficulty_score' => $log->difficulty_score,
                    'updated_at' => optional($log->updated_at)->toISOString(),
                ];
            })
            ->values();

        return [
            'id' => $challenge->id,
            'uuid' => $challenge->uuid,
            'title' => $challenge->title,
            'status' => $challenge->status,
            'mode' => $challenge->mode,
            'current_day' => (int)$challenge->current_day,
            'unlocked_day' => $this->getUnlockedDay($challenge),
            'can_retry' => $metrics['can_retry'],
            'extension_count' => $extensionCount,
            'total_required_count' => $metrics['total_required_count'],
            'done_required_count' => $metrics['done_required_count'],
            'remaining_required_count' => $metrics['remaining_required_count'],
            'streak_count' => (int)$challenge->streak_count,
            'achievement_rate' => (int)$challenge->achievement_rate,
            'start_date' => optional($challenge->start_date)->toDateString(),
            'end_date' => optional($challenge->end_date)->toDateString(),
            'last_check_date' => optional($challenge->last_check_date)->toDateString(),
            'review' => $challenge->review,
            'ai_summary' => $challenge->ai_summary,
            'color' => $challenge->color,
            'event_uuid' => $challenge->event?->uuid,
            'template' => $challenge->template ? [
                'uuid' => $challenge->template->uuid,
                'title' => $challenge->template->title,
                'icon' => $challenge->template->icon,
                'duration_days' => (int)$challenge->template->duration_days,
            ] : null,
            'days' => $days,
            'daily_logs' => $logs,
        ];
    }

    private function getUnlockedDay(Challenge $challenge): int
    {
        $durationDays = $this->getChallengeDurationDays($challenge);

        $startDate = Carbon::parse($challenge->start_date)->startOfDay();
        $today = Carbon::now(config('app.timezone'))->startOfDay();
        $dayDiff = $startDate->diffInDays($today, false);

        if ($dayDiff < 0) {
            return 1;
        }

        return min($durationDays, $dayDiff + 1);
    }

    private function getChallengeMetrics(Challenge $challenge): array
    {
        $durationDays = $this->getChallengeDurationDays($challenge);
        $unlockedDay = $this->getUnlockedDay($challenge);

        $totalRequiredTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->where('is_required', true)
            ->count();

        $doneRequiredTaskCount = ChallengeDayTask::query()
            ->where('challenge_id', $challenge->id)
            ->where('is_required', true)
            ->where('is_done', true)
            ->count();

        $remainingRequiredTaskCount = max(0, $totalRequiredTaskCount - $doneRequiredTaskCount);
        $canRetry = $remainingRequiredTaskCount > 0
            && $challenge->status !== 'completed';

        return [
            'total_required_count' => $totalRequiredTaskCount,
            'done_required_count' => $doneRequiredTaskCount,
            'remaining_required_count' => $remainingRequiredTaskCount,
            'can_retry' => $canRetry,
        ];
    }

    private function getChallengeDurationDays(Challenge $challenge): int
    {
        $challenge->loadMissing('template');

        $maxDayNumber = (int)(
            ChallengeDayTask::query()
                ->where('challenge_id', $challenge->id)
                ->max('day_number') ?? 0
        );

        if ($maxDayNumber > 0) {
            return $maxDayNumber;
        }

        $templateDuration = (int)($challenge->template?->duration_days ?? 1);
        return max(1, $templateDuration);
    }
}
