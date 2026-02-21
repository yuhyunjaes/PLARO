<?php

namespace App\Http\Controllers;

use App\Models\Dday;
use App\Models\DdayDailyCheck;
use App\Models\Event;
use App\Traits\EventPermission;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DdayController extends Controller
{
    use EventPermission;

    public function GetDdayByEvent(string $eventUuid): JsonResponse
    {
        try {
            $event = Event::query()
                ->where('uuid', $eventUuid)
                ->where('type', 'dday')
                ->firstOrFail();

            if (!$this->canViewEvent($event->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day에 접근할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if (!$event->dday_id) {
                return response()->json([
                    'success' => false,
                    'message' => '연결된 D-day가 없습니다.',
                    'type' => 'danger',
                ], 404);
            }

            $payload = $this->buildDdayPayload((int)$event->dday_id);
            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day 정보를 불러오지 못했습니다.',
                    'type' => 'danger',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'dday' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'D-day 정보를 불러오지 못했습니다.',
                'type' => 'danger',
            ], 404);
        }
    }

    public function ToggleTodayCheck(Request $request, string $ddayUuid): JsonResponse
    {
        $validated = $request->validate([
            'is_done' => ['required', 'boolean'],
        ]);

        try {
            $dday = Dday::query()
                ->where('uuid', $ddayUuid)
                ->firstOrFail();

            if ((int)$dday->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day를 수정할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            if ($dday->status === 'completed' || $dday->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => '종료된 D-day는 체크할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $today = Carbon::now(config('app.timezone'))->startOfDay();
            $startDate = Carbon::parse($dday->start_date)->startOfDay();
            $targetDate = Carbon::parse($dday->target_date)->startOfDay();

            if ($today->lt($startDate) || $today->gt($targetDate)) {
                return response()->json([
                    'success' => false,
                    'message' => '오늘은 체크 가능한 기간이 아닙니다.',
                    'type' => 'warning',
                ], 422);
            }

            $todayCheck = DdayDailyCheck::query()
                ->where('dday_id', $dday->id)
                ->where('check_date', $today->toDateString())
                ->first();

            if ($todayCheck && (bool)$todayCheck->is_done && !(bool)$validated['is_done']) {
                return response()->json([
                    'success' => false,
                    'message' => '오늘 수행 체크는 완료 후 취소할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            DdayDailyCheck::updateOrCreate(
                [
                    'dday_id' => $dday->id,
                    'check_date' => $today->toDateString(),
                ],
                [
                    'is_done' => (bool)$validated['is_done'],
                    'checked_at' => (bool)$validated['is_done'] ? Carbon::now(config('app.timezone')) : null,
                ]
            );

            $this->refreshDdaySummary($dday);
            $payload = $this->buildDdayPayload($dday->id);

            return response()->json([
                'success' => true,
                'message' => '오늘 체크 상태를 업데이트했습니다.',
                'type' => 'success',
                'dday' => $payload,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '오늘 체크 업데이트에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function RetryDday(string $ddayUuid): JsonResponse
    {
        try {
            $dday = Dday::query()
                ->where('uuid', $ddayUuid)
                ->firstOrFail();

            if ((int)$dday->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day를 재도전할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $metrics = $this->getDdayMetrics($dday);
            if (!$metrics['can_retry']) {
                return response()->json([
                    'success' => false,
                    'message' => '현재는 재도전할 수 없습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $today = Carbon::now(config('app.timezone'))->startOfDay();
            $newTargetDate = (clone $today)->addDays(max(1, (int)$dday->duration_days) - 1);
            $event = null;

            DB::transaction(function () use ($dday, $today, $newTargetDate, &$event) {
                DdayDailyCheck::query()
                    ->where('dday_id', $dday->id)
                    ->delete();

                $dday->fill([
                    'status' => 'active',
                    'start_date' => $today->toDateString(),
                    'target_date' => $newTargetDate->toDateString(),
                    'current_day' => 1,
                    'streak_count' => 0,
                    'achievement_rate' => 0,
                    'last_check_date' => null,
                    'restart_count' => ((int)$dday->restart_count) + 1,
                ]);
                $dday->save();

                $event = $dday->event;
                if ($event) {
                    $event->update([
                        'start_at' => $today->format('Y-m-d H:i:s'),
                        'end_at' => $newTargetDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
                        'status' => 'active',
                    ]);
                }
            });

            $payload = $this->buildDdayPayload($dday->id);

            return response()->json([
                'success' => true,
                'message' => 'D-day를 처음부터 다시 시작했습니다.',
                'type' => 'success',
                'dday' => $payload,
                'event' => $event,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'D-day 재도전에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function ExtendDday(string $ddayUuid): JsonResponse
    {
        try {
            $dday = Dday::query()
                ->where('uuid', $ddayUuid)
                ->firstOrFail();

            if ((int)$dday->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day를 연장할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $metrics = $this->getDdayMetrics($dday);
            if (!$metrics['can_extend']) {
                return response()->json([
                    'success' => false,
                    'message' => '완료된 D-day만 연장할 수 있습니다.',
                    'type' => 'warning',
                ], 422);
            }

            $targetDate = Carbon::parse($dday->target_date)->startOfDay();
            $newTargetDate = (clone $targetDate)->addDays(max(1, (int)$dday->duration_days));
            $event = null;

            DB::transaction(function () use ($dday, $newTargetDate, &$event) {
                $dday->status = 'active';
                $dday->target_date = $newTargetDate->toDateString();
                $dday->save();

                $event = $dday->event;
                if ($event) {
                    $event->update([
                        'end_at' => $newTargetDate->copy()->endOfDay()->format('Y-m-d H:i:s'),
                        'status' => 'active',
                    ]);
                }
            });

            $this->refreshDdaySummary($dday);
            $payload = $this->buildDdayPayload($dday->id);

            return response()->json([
                'success' => true,
                'message' => 'D-day를 같은 기간만큼 연장했습니다.',
                'type' => 'success',
                'dday' => $payload,
                'event' => $event,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'D-day 연장에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function DeleteDday(string $ddayUuid): JsonResponse
    {
        try {
            $dday = Dday::query()
                ->with('event:id,uuid,dday_id')
                ->where('uuid', $ddayUuid)
                ->firstOrFail();

            if ((int)$dday->user_id !== (int)Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'D-day를 삭제할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $eventUuid = $dday->event?->uuid;
            DB::transaction(fn () => $dday->delete());

            return response()->json([
                'success' => true,
                'message' => 'D-day가 삭제되었습니다.',
                'type' => 'success',
                'event_uuid' => $eventUuid,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'D-day 삭제에 실패했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    private function refreshDdaySummary(Dday $dday): void
    {
        $metrics = $this->getDdayMetrics($dday);

        $dday->fill([
            'current_day' => $metrics['unlocked_day'],
            'streak_count' => $metrics['streak_count'],
            'achievement_rate' => $metrics['achievement_rate'],
            'last_check_date' => $metrics['last_check_date'],
            'status' => $metrics['status'],
        ]);
        $dday->save();

        $dday->event()?->update([
            'status' => $metrics['status'] === 'completed' ? 'completed' : 'active',
        ]);
    }

    private function buildDdayPayload(int $ddayId): ?array
    {
        $dday = Dday::query()
            ->with([
                'dailyChecks' => fn ($q) => $q->orderBy('check_date'),
                'event:id,uuid,dday_id',
            ])
            ->find($ddayId);

        if (!$dday) {
            return null;
        }

        $metrics = $this->getDdayMetrics($dday);
        $checks = $dday->dailyChecks
            ->map(fn ($check) => [
                'id' => $check->id,
                'check_date' => Carbon::parse($check->check_date)->toDateString(),
                'is_done' => (bool)$check->is_done,
                'checked_at' => optional($check->checked_at)->toISOString(),
            ])
            ->values();

        return [
            'id' => $dday->id,
            'uuid' => $dday->uuid,
            'title' => $dday->title,
            'status' => $metrics['status'],
            'start_date' => optional($dday->start_date)->toDateString(),
            'target_date' => optional($dday->target_date)->toDateString(),
            'duration_days' => (int)$dday->duration_days,
            'current_day' => $metrics['unlocked_day'],
            'unlocked_day' => $metrics['unlocked_day'],
            'checked_days' => $metrics['checked_days'],
            'checked_until_today' => $metrics['checked_until_today'],
            'elapsed_days' => $metrics['elapsed_days'],
            'total_days' => $metrics['total_days'],
            'missed_days_count' => $metrics['missed_days_count'],
            'streak_count' => $metrics['streak_count'],
            'achievement_rate' => $metrics['achievement_rate'],
            'can_retry' => $metrics['can_retry'],
            'can_extend' => $metrics['can_extend'],
            'last_check_date' => $metrics['last_check_date'],
            'color' => $dday->color,
            'event_uuid' => $dday->event?->uuid,
            'checks' => $checks,
        ];
    }

    private function getDdayMetrics(Dday $dday): array
    {
        $startDate = Carbon::parse($dday->start_date)->startOfDay();
        $targetDate = Carbon::parse($dday->target_date)->startOfDay();
        $today = Carbon::now(config('app.timezone'))->startOfDay();

        $totalDays = $startDate->diffInDays($targetDate) + 1;
        $elapsedEnd = $today->lt($targetDate) ? $today : $targetDate;
        $elapsedDays = $elapsedEnd->lt($startDate) ? 0 : ($startDate->diffInDays($elapsedEnd) + 1);
        $unlockedDay = max(1, min($totalDays, $elapsedDays > 0 ? $elapsedDays : 1));

        $allChecks = DdayDailyCheck::query()
            ->where('dday_id', $dday->id)
            ->where('is_done', true)
            ->pluck('check_date')
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->flip();

        $checkedDays = 0;
        $checkedUntilToday = 0;
        $missedDaysCount = 0;
        $streakCount = 0;
        $lastCheckDate = null;

        for ($day = 0; $day < $totalDays; $day++) {
            $date = (clone $startDate)->addDays($day)->toDateString();
            $isDone = isset($allChecks[$date]);
            if ($isDone) {
                $checkedDays++;
                $lastCheckDate = $date;
            }

            if ($day < $elapsedDays) {
                if ($isDone) {
                    $checkedUntilToday++;
                } else {
                    $missedDaysCount++;
                }
            }
        }

        for ($day = 0; $day < $elapsedDays; $day++) {
            $date = (clone $startDate)->addDays($day)->toDateString();
            if (!isset($allChecks[$date])) {
                break;
            }
            $streakCount++;
        }

        $achievementRate = $totalDays > 0
            ? (int) round((($checkedDays) / $totalDays) * 100)
            : 0;

        $completed = $checkedDays >= $totalDays;
        $status = $completed ? 'completed' : 'active';
        $canRetry = !$completed && $missedDaysCount > 0;
        $canExtend = $completed;

        return [
            'total_days' => $totalDays,
            'elapsed_days' => $elapsedDays,
            'unlocked_day' => $unlockedDay,
            'checked_days' => $checkedDays,
            'checked_until_today' => $checkedUntilToday,
            'missed_days_count' => $missedDaysCount,
            'streak_count' => $streakCount,
            'achievement_rate' => $achievementRate,
            'status' => $status,
            'can_retry' => $canRetry,
            'can_extend' => $canExtend,
            'last_check_date' => $lastCheckDate,
        ];
    }
}
