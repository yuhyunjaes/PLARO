<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\ChallengeDayTask;
use App\Models\ChallengeTemplate;
use App\Models\Dday;
use App\Models\DdayDailyCheck;
use App\Models\Event;
use App\Models\MarkdownTemplate;
use App\Models\Notepad;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function GetOverview(): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $eventQuery = Event::query()->where(function ($q) use ($userId) {
            $q->where('creator_id', $userId)
                ->orWhereHas('eventUsers', fn ($subQ) => $subQ->where('user_id', $userId));
        });
        $challengeQuery = Challenge::query()->where('user_id', $userId);
        $ddayQuery = Dday::query()->where('user_id', $userId);
        $notepadQuery = Notepad::query()->where('user_id', $userId);

        $summary = [
            'events_total' => (clone $eventQuery)->count(),
            'challenges_total' => (clone $challengeQuery)->count(),
            'ddays_total' => (clone $ddayQuery)->count(),
            'notepads_total' => (clone $notepadQuery)->count(),
            'active_challenges' => (clone $challengeQuery)->where('status', 'active')->count(),
            'active_ddays' => (clone $ddayQuery)->where('status', 'active')->count(),
        ];

        $now = Carbon::now();
        $startMonth = $now->copy()->subMonths(5)->startOfMonth();
        $endMonth = $now->copy()->endOfMonth();
        $labels = [];
        for ($i = 0; $i < 6; $i++) {
            $labels[] = $startMonth->copy()->addMonths($i)->format('Y-m');
        }

        $aggregateMonthly = function ($query) use ($startMonth, $endMonth) {
            return $query
                ->whereBetween('created_at', [$startMonth, $endMonth])
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as total")
                ->groupBy('ym')
                ->pluck('total', 'ym')
                ->all();
        };

        $eventMonthly = $aggregateMonthly(
            Event::query()->where(function ($q) use ($userId) {
                $q->where('creator_id', $userId)
                    ->orWhereHas('eventUsers', fn ($subQ) => $subQ->where('user_id', $userId));
            })
        );
        $challengeMonthly = $aggregateMonthly(Challenge::query()->where('user_id', $userId));
        $ddayMonthly = $aggregateMonthly(Dday::query()->where('user_id', $userId));
        $notepadMonthly = $aggregateMonthly(Notepad::query()->where('user_id', $userId));

        $seriesByLabel = function (array $source) use ($labels) {
            return collect($labels)->map(fn ($label) => (int) ($source[$label] ?? 0))->values();
        };

        $activeChallengeProgress = (clone $challengeQuery)
            ->with(['event:id,uuid,challenge_id'])
            ->where('status', 'active')
            ->orderByDesc('current_day')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get(['id', 'uuid', 'title', 'current_day'])
            ->map(function (Challenge $challenge) {
                $dayNumber = max(1, (int) $challenge->current_day);

                $todayTotal = ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->where('day_number', $dayNumber)
                    ->count();

                $todayDone = ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->where('day_number', $dayNumber)
                    ->where('is_done', true)
                    ->count();

                $todayRequiredTotal = ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->where('day_number', $dayNumber)
                    ->where('is_required', true)
                    ->count();

                $todayRequiredDone = ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->where('day_number', $dayNumber)
                    ->where('is_required', true)
                    ->where('is_done', true)
                    ->count();

                $pendingTasks = ChallengeDayTask::query()
                    ->where('challenge_id', $challenge->id)
                    ->where('day_number', $dayNumber)
                    ->where('is_required', true)
                    ->where('is_done', false)
                    ->orderBy('task_order')
                    ->limit(6)
                    ->get(['id', 'title', 'is_required'])
                    ->map(fn (ChallengeDayTask $task) => [
                        'id' => $task->id,
                        'title' => $task->title,
                        'is_required' => (bool) $task->is_required,
                    ])
                    ->values();

                return [
                    'uuid' => $challenge->uuid,
                    'title' => $challenge->title,
                    'current_day' => $dayNumber,
                    'event_uuid' => $challenge->event?->uuid,
                    'today_total' => $todayTotal,
                    'today_done' => $todayDone,
                    'today_required_total' => $todayRequiredTotal,
                    'today_required_done' => $todayRequiredDone,
                    'today_mission_completed' => $todayRequiredTotal > 0 && $todayRequiredDone >= $todayRequiredTotal,
                    'today_pending_tasks' => $pendingTasks,
                ];
            })
            ->values();

        $activeDdayProgress = (clone $ddayQuery)
            ->with(['event:id,uuid,dday_id'])
            ->where('status', 'active')
            ->orderByDesc('current_day')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get(['id', 'uuid', 'title', 'current_day'])
            ->map(function (Dday $dday) {
                $todayDone = DdayDailyCheck::query()
                    ->where('dday_id', $dday->id)
                    ->where('check_date', Carbon::today(config('app.timezone'))->toDateString())
                    ->where('is_done', true)
                    ->exists();

                return [
                    'uuid' => $dday->uuid,
                    'title' => $dday->title,
                    'current_day' => (int) $dday->current_day,
                    'event_uuid' => $dday->event?->uuid,
                    'today_checked' => $todayDone,
                ];
            })
            ->values();

        $notepadCategoryLatest10 = (clone $notepadQuery)
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->selectRaw('MAX(updated_at) as latest_at')
            ->orderByDesc('latest_at')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => (string) $row->category,
                'value' => (int) $row->total,
                'latest_at' => (string) $row->latest_at,
            ])
            ->values();

        $challengeTemplateTop10 = ChallengeTemplate::query()
            ->with(['owner:id,name'])
            ->where('is_active', true)
            ->where('visibility', 'public')
            ->orderByDesc('usage_count')
            ->orderByDesc('like_count')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (ChallengeTemplate $template) => [
                'uuid' => $template->uuid,
                'title' => $template->title,
                'usage_count' => (int) $template->usage_count,
                'like_count' => (int) $template->like_count,
                'owner_name' => $template->owner?->name,
                'is_system' => (bool) $template->is_system,
            ])
            ->values();

        $markdownTemplateTop10 = MarkdownTemplate::query()
            ->with(['owner:id,name'])
            ->withCount('likes')
            ->where('is_active', true)
            ->where('visibility', 'public')
            ->orderByDesc('usage_count')
            ->orderByDesc('likes_count')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (MarkdownTemplate $template) => [
                'uuid' => $template->uuid,
                'title' => $template->title,
                'usage_count' => (int) $template->usage_count,
                'like_count' => (int) ($template->likes_count ?? 0),
                'owner_name' => $template->owner?->name,
            ])
            ->values();

        $myChallengeTemplateTop10 = ChallengeTemplate::query()
            ->with(['owner:id,name'])
            ->where('is_active', true)
            ->where('owner_id', $userId)
            ->orderByDesc('usage_count')
            ->orderByDesc('like_count')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (ChallengeTemplate $template) => [
                'uuid' => $template->uuid,
                'title' => $template->title,
                'usage_count' => (int) $template->usage_count,
                'like_count' => (int) $template->like_count,
                'owner_name' => $template->owner?->name,
                'is_system' => (bool) $template->is_system,
            ])
            ->values();

        $myMarkdownTemplateTop10 = MarkdownTemplate::query()
            ->with(['owner:id,name'])
            ->withCount('likes')
            ->where('is_active', true)
            ->where('owner_id', $userId)
            ->orderByDesc('usage_count')
            ->orderByDesc('likes_count')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (MarkdownTemplate $template) => [
                'uuid' => $template->uuid,
                'title' => $template->title,
                'usage_count' => (int) $template->usage_count,
                'like_count' => (int) ($template->likes_count ?? 0),
                'owner_name' => $template->owner?->name,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'monthly_series' => [
                'labels' => $labels,
                'events' => $seriesByLabel($eventMonthly),
                'challenges' => $seriesByLabel($challengeMonthly),
                'ddays' => $seriesByLabel($ddayMonthly),
                'notepads' => $seriesByLabel($notepadMonthly),
            ],
            'notepad_category_latest10' => $notepadCategoryLatest10,
            'active_challenge_progress' => $activeChallengeProgress,
            'active_dday_progress' => $activeDdayProgress,
            'challenge_template_top10' => $challengeTemplateTop10,
            'markdown_template_top10' => $markdownTemplateTop10,
            'my_challenge_template_top10' => $myChallengeTemplateTop10,
            'my_markdown_template_top10' => $myMarkdownTemplateTop10,
        ]);
    }
}
