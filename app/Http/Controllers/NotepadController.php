<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notepad;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use TypeError;

class NotepadController extends Controller
{
    private function normalizeColorToken(string $token): string
    {
        $value = trim($token);
        if (preg_match('/^#[0-9a-fA-F]{3,8}$/', $value)) return $value;
        if (preg_match('/^[a-zA-Z]+$/', $value)) return $value;
        return 'inherit';
    }

    private function renderInlineMarkdown(string $text): string
    {
        $escaped = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

        $escaped = preg_replace('/`([^`]+)`/', '<code style="background:#e5e7eb;padding:1px 4px;border-radius:4px;">$1</code>', $escaped);
        $escaped = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $escaped);
        $escaped = preg_replace('/(^|[^*])\*([^*\n]+)\*(?!\*)/', '$1<em>$2</em>', $escaped);
        $escaped = preg_replace('/(^|[^_])_([^_\n]+)_(?!_)/', '$1<em>$2</em>', $escaped);
        $escaped = preg_replace('/~~([^~]+)~~/', '<del>$1</del>', $escaped);
        $escaped = preg_replace('/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $escaped);
        $escaped = preg_replace('/(^|[\s(])(https?:\/\/[^\s<]+)/', '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>', $escaped);
        $escaped = preg_replace('/\{red\}([\s\S]*?)\{\/red\}/', '<span style="color:#dc2626;font-weight:600;">$1</span>', $escaped);
        $escaped = preg_replace('/\{bg-red\}([\s\S]*?)\{\/bg-red\}/', '<span style="background:#fecaca;padding:0 4px;border-radius:4px;">$1</span>', $escaped);

        $escaped = preg_replace_callback('/\{color:([^}]+)\}([\s\S]*?)\{\/color\}/', function ($m) {
            $safe = $this->normalizeColorToken((string)($m[1] ?? ''));
            $text = $m[2] ?? '';
            return '<span style="color:' . $safe . ';">' . $text . '</span>';
        }, $escaped);

        $escaped = preg_replace_callback('/\{bg:([^}]+)\}([\s\S]*?)\{\/bg\}/', function ($m) {
            $safe = $this->normalizeColorToken((string)($m[1] ?? ''));
            $text = $m[2] ?? '';
            return '<span style="background-color:' . $safe . ';padding:0 4px;border-radius:4px;">' . $text . '</span>';
        }, $escaped);

        return $escaped ?? '';
    }

    private function markdownToEmailHtml(string $markdown): string
    {
        $lines = preg_split('/\r\n|\r|\n/', $markdown) ?: [];
        $html = [];
        $inUl = false;
        $inOl = false;
        $inCodeBlock = false;
        $codeLines = [];
        $tableLines = [];

        $closeLists = function () use (&$html, &$inUl, &$inOl) {
            if ($inUl) $html[] = '</ul>';
            if ($inOl) $html[] = '</ol>';
            $inUl = false;
            $inOl = false;
        };

        $closeCodeBlock = function () use (&$html, &$inCodeBlock, &$codeLines) {
            if (!$inCodeBlock) return;
            $safeCode = htmlspecialchars(implode("\n", $codeLines), ENT_QUOTES, 'UTF-8');
            $html[] = '<pre style="margin:8px 0;padding:10px;border:1px solid #d1d5db;background:#f9fafb;border-radius:8px;overflow:auto;"><code>' . $safeCode . '</code></pre>';
            $inCodeBlock = false;
            $codeLines = [];
        };

        $parseTableRow = function (string $line): array {
            $trimmed = trim($line);
            $trimmed = preg_replace('/^\|/', '', $trimmed);
            $trimmed = preg_replace('/\|$/', '', $trimmed);
            $cells = explode('|', (string)$trimmed);
            return array_map(fn ($cell) => trim((string)$cell), $cells);
        };

        $isSeparatorRow = function (array $cells): bool {
            if (count($cells) <= 0) return false;
            foreach ($cells as $cell) {
                if (!preg_match('/^:?-{3,}:?$/', (string)$cell)) return false;
            }
            return true;
        };

        $closeTable = function () use (&$html, &$tableLines, $parseTableRow, $isSeparatorRow) {
            if (count($tableLines) <= 0) return;
            $rows = array_map($parseTableRow, $tableLines);
            $hasHeadSeparator = count($rows) > 1 && $isSeparatorRow($rows[1] ?? []);

            if (!$hasHeadSeparator) {
                foreach ($tableLines as $line) {
                    $html[] = '<p style="margin:6px 0;">' . $this->renderInlineMarkdown((string)$line) . '</p>';
                }
                $tableLines = [];
                return;
            }

            $header = $rows[0] ?? [];
            $bodyRows = array_slice($rows, 2);

            $html[] = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px;">';
            $html[] = '<thead><tr>';
            foreach ($header as $cell) {
                $html[] = '<th style="border:1px solid #d1d5db;background:#f3f4f6;padding:6px;text-align:left;">' . $this->renderInlineMarkdown((string)$cell) . '</th>';
            }
            $html[] = '</tr></thead>';
            if (count($bodyRows) > 0) {
                $html[] = '<tbody>';
                foreach ($bodyRows as $row) {
                    $html[] = '<tr>';
                    foreach ($row as $cell) {
                        $html[] = '<td style="border:1px solid #d1d5db;padding:6px;vertical-align:top;">' . $this->renderInlineMarkdown((string)$cell) . '</td>';
                    }
                    $html[] = '</tr>';
                }
                $html[] = '</tbody>';
            }
            $html[] = '</table>';
            $tableLines = [];
        };

        foreach ($lines as $line) {
            $trimmed = trim((string)$line);

            if (str_starts_with($trimmed, '```')) {
                $closeTable();
                $closeLists();
                if ($inCodeBlock) {
                    $closeCodeBlock();
                } else {
                    $inCodeBlock = true;
                    $codeLines = [];
                }
                continue;
            }

            if ($inCodeBlock) {
                $codeLines[] = (string)$line;
                continue;
            }

            if (preg_match('/^\|.+\|$/', $trimmed)) {
                $tableLines[] = $trimmed;
                continue;
            } elseif (count($tableLines) > 0) {
                $closeTable();
            }

            if ($trimmed === '') {
                $closeLists();
                $closeTable();
                $html[] = '<br />';
                continue;
            }

            if ($trimmed === '---' || $trimmed === '***') {
                $closeLists();
                $html[] = '<hr style="border:0;border-top:1px solid #d1d5db;margin:10px 0;" />';
                continue;
            }

            if (preg_match('/^[-*]\s+\[([ xX])\]\s+(.+)$/', $trimmed, $m)) {
                if ($inOl) {
                    $html[] = '</ol>';
                    $inOl = false;
                }
                if (!$inUl) {
                    $html[] = '<ul style="margin:6px 0;padding-left:18px;list-style:none;">';
                    $inUl = true;
                }
                $checked = strtolower((string)($m[1] ?? '')) === 'x' ? '☑' : '☐';
                $html[] = '<li style="margin:4px 0;">' . $checked . ' ' . $this->renderInlineMarkdown((string)($m[2] ?? '')) . '</li>';
                continue;
            }

            if (preg_match('/^[-*]\s+(.+)$/', $trimmed, $m)) {
                if ($inOl) {
                    $html[] = '</ol>';
                    $inOl = false;
                }
                if (!$inUl) {
                    $html[] = '<ul style="margin:6px 0;padding-left:18px;">';
                    $inUl = true;
                }
                $html[] = '<li style="margin:4px 0;">' . $this->renderInlineMarkdown((string)($m[1] ?? '')) . '</li>';
                continue;
            }

            if (preg_match('/^\d+\.\s+(.+)$/', $trimmed, $m)) {
                if ($inUl) {
                    $html[] = '</ul>';
                    $inUl = false;
                }
                if (!$inOl) {
                    $html[] = '<ol style="margin:6px 0;padding-left:18px;">';
                    $inOl = true;
                }
                $html[] = '<li style="margin:4px 0;">' . $this->renderInlineMarkdown((string)($m[1] ?? '')) . '</li>';
                continue;
            }

            $closeLists();

            if (preg_match('/^(#{1,6})\s+(.+)$/', $trimmed, $m)) {
                $level = strlen((string)($m[1] ?? '#'));
                $size = match ($level) {
                    1 => '20px',
                    2 => '18px',
                    3 => '16px',
                    default => '14px',
                };
                $html[] = '<h' . $level . ' style="margin:8px 0 6px;font-size:' . $size . ';font-weight:600;">' . $this->renderInlineMarkdown((string)($m[2] ?? '')) . '</h' . $level . '>';
                continue;
            }

            if (preg_match('/^>\s+(.+)$/', $trimmed, $m)) {
                $html[] = '<blockquote style="margin:8px 0;padding-left:8px;border-left:2px solid #d1d5db;color:#4b5563;">' . $this->renderInlineMarkdown((string)($m[1] ?? '')) . '</blockquote>';
                continue;
            }

            $html[] = '<p style="margin:6px 0;">' . $this->renderInlineMarkdown($trimmed) . '</p>';
        }

        $closeCodeBlock();
        $closeTable();
        $closeLists();

        return implode('', $html);
    }

    public function StoreNotepads(Request $request)
    {
        $messageToNotepad = $request->only(['content', 'chat_id']);

        $messageToNotepadSwitch =
            !empty($messageToNotepad['content']) &&
            !empty($messageToNotepad['chat_id']);

        $timezone = Auth::user()?->timezone ?? config('app.timezone');

        if (!$messageToNotepadSwitch) {
            $validator = Validator::make($request->all(), [
                'note_title' => ['required', 'string', 'max:255'],
                'category'   => ['required', 'string', 'max:255'],
            ], [
                'note_title.required' => '메모장 제목을 입력해주세요.',
                'note_title.max'      => '메모장 제목은 최대 255자까지 가능합니다.',
                'category.required' => '메모장 카테고리를 입력해주세요.',
                'category.max'      => '메모장 카테고리는 최대 255자까지 가능합니다.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'type'    => 'danger',
                    'errors'  => $validator->errors(),
                ]);
            }
        }

        $title = null;

        if ($messageToNotepadSwitch) {
            $chatMessage = ChatMessage::findOrFail($messageToNotepad['chat_id']);

            $title = $chatMessage->chatroom->title;

            if (mb_strlen($title) > 255) {
                return response()->json([
                    'success' => false,
                    'message' => '채팅방 제목이 너무 길어 메모장을 생성할 수 없습니다.',
                    'type'    => 'danger',
                ]);
            }
        }

        $notepad = Notepad::create([
            'uuid'     => Str::uuid()->toString(),
            'chat_id'  => $messageToNotepadSwitch ? $messageToNotepad['chat_id'] : null,
            'user_id'  => Auth::id(),
            'title'    => $messageToNotepadSwitch ? $title : $request->note_title,
            'content'  => $messageToNotepadSwitch ? $messageToNotepad['content'] : null,
            'category' => $request->category,
        ]);

        return $messageToNotepadSwitch
            ? response()->json([
                'success' => true,
                'id'      => $notepad->uuid,
            ])
            : response()->json([
                'success'     => true,
                'id'          => $notepad->uuid,
                'created_at' => $notepad->created_at->copy()->setTimezone($timezone)->format('Y-m-d H:i:s'),
                'message'    => '메모장이 생성되었습니다.',
            ]);
    }

//    메모장 타이틀 수정
    public function UpdateNotepadTitle($uuid, Request $request)
    {
        try {
            $data = $request->validate([
                'title' => ['required', 'string'],
            ]);

            DB::transaction(function () use ($uuid, $data) {
                Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->firstOrFail()->update([
                    'title' => $data['title'],
                ]);;
            });

            return response()->json(['success' => true, 'message' => '메모장 이름이 변경되었습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

    //    메모장 카테고리 수정
    public function UpdateNotepadCategory($uuid, Request $request)
    {
        try {
            $data = $request->validate([
                'category' => ['required', 'string'],
            ]);

            DB::transaction(function () use ($uuid, $data) {
                Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->firstOrFail()->update([
                    'category' => $data['category'],
                ]);
            });

            return response()->json(['success' => true, 'message' => '메모장 카테고리가 변경되었습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

//    메모장들 가져오기
    public function GetNotepads(Request $request)
    {
        try {
            $user = Auth::user();
            $timezone = $user?->timezone ?? config('app.timezone');

            $query = Notepad::where('user_id', $user->id)
                ->withExists([
                    'likes as liked' => function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    }
                ]);

            if ($request->filled('title')) {
                $query->where('title', 'like', '%' . $request->query('title') . '%');
            }

            if ($request->filled('category')) {
                $query->where('category', $request->query('category'));
            }

            if ($request->boolean('liked')) {
                $query->whereHas('likes', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }

            $perPage = max(1, (int) config('app_content.pagination.notepads_per_page', 24));

            $notepads = $query
                ->orderByDesc('created_at')
                ->paginate($perPage)
                ->through(fn ($n) => [
                    'id' => $n->uuid,
                    'title' => $n->title,
                    'content' => Str::limit(trim((string) $n->content), 220),
                    'category' => $n->category,
                    'created_at' => $n->created_at->copy()->setTimezone($timezone)->format('Y-m-d H:i:s'),
                    'liked' => (bool) $n->liked,
                ]);

            return response()->json([
                'success' => true,
                'notepads' => $notepads->items(),
                'pagination' => [
                    'current_page' => $notepads->currentPage(),
                    'last_page' => $notepads->lastPage(),
                    'per_page' => $notepads->perPage(),
                    'total' => $notepads->total(),
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '메모장을 가져오는 중 오류가 발생하였습니다.',
                'type' => 'danger'
            ]);
        }
    }



//    메모장 내용 가져오기
    public function GetContents($id) {
        $content = Notepad::where('uuid', $id)
            ->where('user_id', auth('web')->id())
            ->select('content')
            ->first();
        if(!$content) return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.']);

        return response()->json(['success' => true, 'content' => $content]);
    }

//    메모장 내용 수정
    public function UpdateNotepads($uuid, Request $request)
    {
        try {
            $data = $request->validate([
                'text' => ['nullable', 'string'],
            ]);

            DB::transaction(function () use ($uuid, $data) {
                Notepad::where('uuid', $uuid)
                    ->where('user_id', Auth::id())
                    ->firstOrFail()
                    ->update([
                        'content' => $data['text'] ?? null
                    ]);
            });

            return response()->json(['success' => true, 'message'=>'메모장이 수정되었습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message'=>'메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

    public function SummarizeNotepadWithAi(Request $request, string $uuid)
    {
        $notepad = Notepad::where('uuid', $uuid)
            ->where('user_id', Auth::id())
            ->first();

        if (!$notepad) {
            return response()->json([
                'success' => false,
                'message' => '메모장이 존재하지 않습니다.',
                'type' => 'danger',
            ], 404);
        }

        $data = $request->validate([
            'source_text' => ['required', 'string', 'max:20000'],
            'model_name' => ['nullable', 'string', 'max:120'],
        ]);

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'AI API 키가 설정되어 있지 않습니다.',
                'type' => 'danger',
            ], 500);
        }

        $sourceText = trim((string)($data['source_text'] ?? ''));
        if ($sourceText === '') {
            return response()->json([
                'success' => false,
                'message' => '정리할 내용을 입력해주세요.',
                'type' => 'danger',
            ], 422);
        }

        try {
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
                Log::warning('Gemini notepad summary failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'notepad_uuid' => $notepad->uuid,
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

            $notepad->update([
                'ai_source_text' => $sourceText,
                'ai_summary' => trim((string)$summary),
            ]);

            return response()->json([
                'success' => true,
                'type' => 'success',
                'message' => 'AI 정리가 완료되었습니다.',
                'source_text' => $notepad->ai_source_text,
                'summary' => $notepad->ai_summary,
                'notepad' => $notepad,
            ]);
        } catch (\Throwable $e) {
            Log::error('Notepad AI summary error', [
                'notepad_uuid' => $notepad->uuid,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI 정리 중 오류가 발생했습니다.',
                'type' => 'danger',
            ], 500);
        }
    }

//    메모장 삭제
    public function DeleteNotepads($uuid) {
        try {
            DB::transaction(function () use ($uuid) {
                Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->firstOrFail()->delete();
            });
            return response()->json(['success' => true, 'message'=>'메모장이 삭제되었습니다.', 'type' => 'success']);
        } catch (TypeError $e) {
            return response()->json(['success' => false, 'message'=>'메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

//    메모장 내용 이메일 전송
    public function shareEmail($notepad) {
        try {
            $notepad = Notepad::where('uuid', $notepad)
                ->where('user_id', Auth::id())
                ->first();
            if (!$notepad) {
                return response()->json(['success' => false]);
            }

            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => '로그인 후 이용 가능합니다.', 'type' => 'danger']);
            }

            $content = $notepad->content ?: "공유된 메모장의 내용이 없습니다.";
            $rendered = $this->markdownToEmailHtml($content);

            Mail::html(
                '
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color:#111827;">
                <h2 style="margin:0 0 8px;">📒 메모장이 공유되었습니다</h2>
                <hr style="border:0;border-top:1px solid #e5e7eb;margin:10px 0 14px;" />
                <div style="padding: 14px; border:1px solid #e5e7eb; border-radius:8px;">
                    ' . $rendered . '
                </div>
            </div>
    ',
                function ($message) use ($user, $notepad) {
                    $message->to($user->email)
                        ->subject($notepad->title ?: "메모장 공유");
                }
            );

            return response()->json(['success' => true, 'message' => '메모장 내용이 이메일로 전송되었습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '이메일이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

}
