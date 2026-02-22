<?php

namespace App\Http\Controllers;

use App\Models\MarkdownTemplate;
use App\Models\MarkdownTemplateLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MarkdownTemplateController extends Controller
{
    private function serializeTemplate(MarkdownTemplate $template): array
    {
        return [
            'id' => $template->id,
            'uuid' => $template->uuid,
            'owner_id' => $template->owner_id,
            'owner_name' => $template->owner?->name,
            'title' => $template->title,
            'description' => $template->description,
            'template_text' => $template->template_text,
            'visibility' => $template->visibility,
            'is_active' => (bool) $template->is_active,
            'usage_count' => (int) $template->usage_count,
            'like_count' => (int) ($template->likes_count ?? 0),
            'liked' => (bool) ($template->liked ?? false),
            'created_at' => optional($template->created_at)->toISOString(),
            'updated_at' => optional($template->updated_at)->toISOString(),
        ];
    }

    public function StoreMarkdownTemplate(Request $request): JsonResponse
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'template_text' => ['required', 'string', 'max:50000'],
            'visibility' => ['required', 'in:private,public,unlisted'],
        ]);

        try {
            $template = MarkdownTemplate::create([
                'uuid' => (string) Str::uuid(),
                'owner_id' => $userId,
                'title' => trim((string) $validated['title']),
                'description' => isset($validated['description']) && trim((string) $validated['description']) !== ''
                    ? trim((string) $validated['description'])
                    : null,
                'template_text' => trim((string) $validated['template_text']),
                'visibility' => $validated['visibility'],
                'is_active' => true,
                'usage_count' => 0,
            ]);

            $template->load('owner:id,name');

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => '마크다운 템플릿이 생성되었습니다.',
                'template' => $this->serializeTemplate($template),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 생성 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function UpdateMarkdownTemplate(Request $request, string $uuid): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $template = MarkdownTemplate::query()->where('uuid', $uuid)->first();
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => '템플릿을 찾을 수 없습니다.',
                'type' => 'danger',
            ], 404);
        }

        if ((int)$template->owner_id !== (int)$userId) {
            return response()->json([
                'success' => false,
                'message' => '내 템플릿만 수정할 수 있습니다.',
                'type' => 'danger',
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'template_text' => ['required', 'string', 'max:50000'],
            'visibility' => ['required', 'in:private,public,unlisted'],
        ]);

        try {
            $template->title = trim((string)$validated['title']);
            $template->description = isset($validated['description']) && trim((string)$validated['description']) !== ''
                ? trim((string)$validated['description'])
                : null;
            $template->template_text = trim((string)$validated['template_text']);
            $template->visibility = $validated['visibility'];
            $template->save();
            $template->loadCount('likes');
            $template->loadExists(['likes as liked' => fn ($q) => $q->where('user_id', $userId)]);

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => '템플릿을 수정했습니다.',
                'template' => $this->serializeTemplate($template),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 수정 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

    public function GetMarkdownTemplates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_type' => ['required', 'in:mine,every'],
            'page' => ['nullable', 'integer', 'min:1'],
            'keyword' => ['nullable', 'string', 'max:120'],
        ]);

        $templateType = $validated['template_type'];
        $keyword = trim((string) ($validated['keyword'] ?? ''));

        $query = MarkdownTemplate::query()
            ->with(['owner:id,name'])
            ->where('is_active', true)
            ->withCount('likes')
            ->withExists([
                'likes as liked' => function ($q) {
                    $q->where('user_id', Auth::id());
                }
            ]);

        if ($templateType === 'mine') {
            $query->where('owner_id', Auth::id())
                ->orderByDesc('likes_count')
                ->orderByDesc('usage_count')
                ->orderByDesc('updated_at');
        } else {
            $query->where('visibility', 'public')
                ->orderByDesc('likes_count')
                ->orderByDesc('usage_count')
                ->orderByDesc('updated_at');
        }

        if ($keyword !== '') {
            $query->where('title', 'like', '%' . $keyword . '%');
        }

        $perPage = max(1, (int) config('app_content.pagination.markdown_templates_per_page', 20));
        $paginator = $query->paginate($perPage);
        $templates = collect($paginator->items())->map(fn (MarkdownTemplate $template) => $this->serializeTemplate($template))->values();

        return response()->json([
            'success' => true,
            'templates' => $templates,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function IncreaseUsage(string $uuid): JsonResponse
    {
        $template = MarkdownTemplate::query()->where('uuid', $uuid)->first();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => '템플릿을 찾을 수 없습니다.',
                'type' => 'danger',
            ], 404);
        }

        $canUse = $template->visibility === 'public' || $template->owner_id === Auth::id();

        if (!$canUse) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 접근 권한이 없습니다.',
                'type' => 'danger',
            ], 403);
        }

        $template->increment('usage_count');

        return response()->json([
            'success' => true,
        ]);
    }

    public function StoreMarkdownTemplateLike(string $uuid): JsonResponse
    {
        $template = MarkdownTemplate::query()->where('uuid', $uuid)->first();
        $userId = Auth::id();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => '템플릿을 찾을 수 없습니다.',
                'type' => 'danger',
            ], 404);
        }

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $canUse = $template->visibility === 'public' || $template->owner_id === $userId;
        if (!$canUse) {
            return response()->json([
                'success' => false,
                'message' => '템플릿 접근 권한이 없습니다.',
                'type' => 'danger',
            ], 403);
        }

        $like = MarkdownTemplateLike::query()->firstOrCreate([
            'template_id' => $template->id,
            'user_id' => $userId,
        ]);

        if (!$like->wasRecentlyCreated) {
            return response()->json([
                'success' => false,
                'message' => '이미 좋아요한 템플릿입니다.',
                'type' => 'info',
            ]);
        }

        return response()->json([
            'success' => true,
            'type' => 'success',
            'message' => '좋아요를 추가했습니다.',
        ]);
    }

    public function DeleteMarkdownTemplateLike(string $uuid): JsonResponse
    {
        $template = MarkdownTemplate::query()->where('uuid', $uuid)->first();
        $userId = Auth::id();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => '템플릿을 찾을 수 없습니다.',
                'type' => 'danger',
            ], 404);
        }

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        MarkdownTemplateLike::query()
            ->where('template_id', $template->id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'type' => 'success',
            'message' => '좋아요를 취소했습니다.',
        ]);
    }

    public function DeleteMarkdownTemplate(string $uuid): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => '로그인이 필요합니다.',
                'type' => 'danger',
            ], 401);
        }

        $template = MarkdownTemplate::query()->where('uuid', $uuid)->first();
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => '템플릿을 찾을 수 없습니다.',
                'type' => 'danger',
            ], 404);
        }

        if ((int)$template->owner_id !== (int)$userId) {
            return response()->json([
                'success' => false,
                'message' => '내 템플릿만 삭제할 수 있습니다.',
                'type' => 'danger',
            ], 403);
        }

        try {
            $template->update([
                'is_active' => false,
            ]);

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => '템플릿을 삭제했습니다.',
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
