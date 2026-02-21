<?php

namespace App\Http\Controllers;

use App\Models\ChallengeTemplate;
use App\Models\ChallengeTemplateLike;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChallengeTemplateController extends Controller
{
    private function validateTemplatePayload(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:32'],
            'category' => ['required', 'in:routine,study,workout,custom'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:31'],
            'visibility' => ['required', 'in:private,public,unlisted'],
            'days' => ['required', 'array', 'min:1'],
            'days.*.day_number' => ['required', 'integer', 'min:1'],
            'days.*.tasks' => ['required', 'array', 'min:1'],
            'days.*.tasks.*.title' => ['required', 'string', 'max:255'],
            'days.*.tasks.*.description' => ['nullable', 'string'],
            'days.*.tasks.*.is_required' => ['required', 'boolean'],
        ]);
    }

    private function buildTemplateResponse(ChallengeTemplate $template): array
    {
        return [
            'id' => $template->id,
            'uuid' => $template->uuid,
            'owner_id' => $template->owner_id,
            'owner_name' => $template->owner?->name,
            'title' => $template->title,
            'description' => $template->description,
            'icon' => $template->icon,
            'category' => $template->category,
            'duration_days' => (int) $template->duration_days,
            'visibility' => $template->visibility,
            'is_system' => (bool) $template->is_system,
            'is_active' => (bool) $template->is_active,
            'liked' => (bool) ($template->liked ?? false),
            'usage_count' => (int) $template->usage_count,
            'like_count' => (int) $template->like_count,
            'created_at' => optional($template->created_at)->toISOString(),
            'updated_at' => optional($template->updated_at)->toISOString(),
        ];
    }

    public function StoreChallengeTemplate(Request $request): JsonResponse
    {
        $userId = Auth::id();

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $validated = $this->validateTemplatePayload($request);

        $dayNumbers = collect($validated['days'])->pluck('day_number');
        if ($dayNumbers->duplicates()->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => '중복된 day_number가 있습니다.',
                'type' => 'danger',
            ], 422);
        }

        if ($dayNumbers->max() > (int) $validated['duration_days']) {
            return response()->json([
                'success' => false,
                'message' => 'day_number는 duration_days 범위를 넘을 수 없습니다.',
                'type' => 'danger',
            ], 422);
        }

        try {
            $createdTemplate = null;

            DB::transaction(function () use ($validated, $userId, &$createdTemplate) {
                $createdTemplate = ChallengeTemplate::create([
                    'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    'owner_id' => $userId,
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'icon' => $validated['icon'] ?? null,
                    'category' => $validated['category'],
                    'duration_days' => (int) $validated['duration_days'],
                    'visibility' => $validated['visibility'],
                    'is_system' => false,
                    'is_active' => true,
                    'usage_count' => 0,
                    'like_count' => 0,
                ]);

                foreach ($validated['days'] as $day) {
                    foreach ($day['tasks'] as $index => $task) {
                        $createdTemplate->days()->create([
                            'day_number' => (int) $day['day_number'],
                            'task_order' => $index + 1,
                            'title' => $task['title'],
                            'description' => $task['description'] ?? null,
                            'is_required' => (bool) $task['is_required'],
                        ]);
                    }
                }
            });

            $createdTemplate->load('owner:id,name');

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => '템플릿이 생성되었습니다.',
                'template' => $this->buildTemplateResponse($createdTemplate),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 생성 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function GetChallengeTemplates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_type' => ['required', 'in:mine,every'],
        ]);

        $templateType = $validated['template_type'];

        $query = ChallengeTemplate::query()
            ->with(['owner:id,name'])
            ->where('is_active', true)
            ->withExists([
                'likes as liked' => function ($q) {
                    $q->where('user_id', Auth::id());
                }
            ]);

        if ($templateType === 'mine') {
            $query->where('owner_id', Auth::id());
        } else {
            $query->where('visibility', 'public');
        }

        if ($templateType === 'mine') {
            $query->orderByDesc('liked')
                ->orderByDesc('updated_at');
        } else {
            $query->orderByDesc('liked')
                ->orderByDesc('is_system')
                ->orderByDesc('like_count')
                ->orderByDesc('usage_count')
                ->orderByDesc('id');
        }

        $templates = $query->limit(60)->get()->map(function (ChallengeTemplate $template) {
            return $this->buildTemplateResponse($template);
        })->values();

        return response()->json([
            'success' => true,
            'templates' => $templates,
        ]);
    }

    public function StoreChallengeTemplateLike(string $uuid): JsonResponse
    {
        try {
            $template = ChallengeTemplate::where('uuid', $uuid)->firstOrFail();
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => '로그인이 필요합니다.',
                    'type' => 'danger',
                ], 401);
            }

            $created = false;

            DB::transaction(function () use ($template, $userId, &$created) {
                $like = ChallengeTemplateLike::firstOrCreate([
                    'template_id' => $template->id,
                    'user_id' => $userId,
                ]);

                $created = $like->wasRecentlyCreated;

                if ($created) {
                    $template->increment('like_count');
                }
            });

            if (!$created) {
                return response()->json([
                    'success' => false,
                    'message' => '이미 좋아요한 템플릿입니다.',
                    'type' => 'info',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => '템플릿 좋아요를 추가했습니다.',
                'type' => 'success',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 좋아요 처리 중 오류가 발생했습니다.',
                'type' => 'danger',
            ]);
        }
    }

    public function DeleteChallengeTemplateLike(string $uuid): JsonResponse
    {
        try {
            $template = ChallengeTemplate::where('uuid', $uuid)->firstOrFail();
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => '로그인이 필요합니다.',
                    'type' => 'danger',
                ], 401);
            }

            $deleted = 0;

            DB::transaction(function () use ($template, $userId, &$deleted) {
                $deleted = ChallengeTemplateLike::where('template_id', $template->id)
                    ->where('user_id', $userId)
                    ->delete();

                if ($deleted > 0) {
                    $template->decrement('like_count');
                    if ((int) $template->fresh()->like_count < 0) {
                        $template->update(['like_count' => 0]);
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => '템플릿 좋아요를 취소했습니다.',
                'type' => 'success',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 좋아요 취소 중 오류가 발생했습니다.',
                'type' => 'danger',
            ]);
        }
    }

    public function GetChallengeTemplateDays(string $uuid): JsonResponse
    {
        try {
            $template = ChallengeTemplate::query()
                ->with([
                    'days' => function ($q) {
                        $q->orderBy('day_number')
                            ->orderBy('task_order');
                    }
                ])
                ->where('uuid', $uuid)
                ->where('is_active', true)
                ->firstOrFail();

            $userId = Auth::id();
            $canView = $template->visibility === 'public' || ($userId && (int) $template->owner_id === (int) $userId);

            if (!$canView) {
                return response()->json([
                    'success' => false,
                    'message' => '해당 템플릿을 조회할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $days = $template->days
                ->groupBy('day_number')
                ->map(function ($tasks, $dayNumber) {
                    return [
                        'day_number' => (int) $dayNumber,
                        'tasks' => $tasks->map(function ($task) {
                            return [
                                'id' => $task->id,
                                'task_order' => (int) $task->task_order,
                                'title' => $task->title,
                                'description' => $task->description,
                                'is_required' => (bool) $task->is_required,
                            ];
                        })->values(),
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'template_uuid' => $template->uuid,
                'days' => $days,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 일차 정보를 불러오지 못했습니다.',
                'type' => 'danger',
            ], 404);
        }
    }

    public function UpdateChallengeTemplate(Request $request, string $uuid): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $validated = $this->validateTemplatePayload($request);
        $dayNumbers = collect($validated['days'])->pluck('day_number');
        if ($dayNumbers->duplicates()->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => '중복된 day_number가 있습니다.',
                'type' => 'danger',
            ], 422);
        }

        if ($dayNumbers->max() > (int) $validated['duration_days']) {
            return response()->json([
                'success' => false,
                'message' => 'day_number는 duration_days 범위를 넘을 수 없습니다.',
                'type' => 'danger',
            ], 422);
        }

        try {
            $template = ChallengeTemplate::query()
                ->with(['owner:id,name'])
                ->where('uuid', $uuid)
                ->firstOrFail();

            if ((int)$template->owner_id !== (int)$userId || (bool)$template->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => '템플릿을 수정할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            DB::transaction(function () use ($template, $validated) {
                $template->update([
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'icon' => $validated['icon'] ?? null,
                    'category' => $validated['category'],
                    'duration_days' => (int)$validated['duration_days'],
                    'visibility' => $validated['visibility'],
                ]);

                $template->days()->delete();
                foreach ($validated['days'] as $day) {
                    foreach ($day['tasks'] as $index => $task) {
                        $template->days()->create([
                            'day_number' => (int) $day['day_number'],
                            'task_order' => $index + 1,
                            'title' => $task['title'],
                            'description' => $task['description'] ?? null,
                            'is_required' => (bool) $task['is_required'],
                        ]);
                    }
                }
            });

            $template->refresh()->load(['owner:id,name']);

            return response()->json([
                'success' => true,
                'message' => '템플릿이 수정되었습니다.',
                'type' => 'success',
                'template' => $this->buildTemplateResponse($template),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 수정 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function DeleteChallengeTemplate(string $uuid): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        try {
            $template = ChallengeTemplate::query()
                ->where('uuid', $uuid)
                ->firstOrFail();

            if ((int)$template->owner_id !== (int)$userId || (bool)$template->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => '템플릿을 삭제할 권한이 없습니다.',
                    'type' => 'danger',
                ], 403);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => '템플릿이 삭제되었습니다.',
                'type' => 'success',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 삭제 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }
}
