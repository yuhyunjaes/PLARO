<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notepad;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use TypeError;

class NotepadController extends Controller
{
    public function StoreNotepads(Request $request)
    {
        $messageToNotepad = $request->only(['content', 'chat_id']);

        $messageToNotepadSwitch =
            !empty($messageToNotepad['content']) &&
            !empty($messageToNotepad['chat_id']);

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
                'created_at' => $notepad->created_at->format('Y-m-d H:i:s'),
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
            return response()->json(['success'=>false, 'message'=>'메모장을 생성하는 중 오류가 발생했습니다.', 'type'=>'danger']);
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

//    사용자 메모장 카테고리들 가져오기
    public function GetNotepadsByCategory()
    {
        try {
            $categories = DB::transaction(function () {
                return Notepad::where('user_id', Auth::id())
                    ->select('category', DB::raw('COUNT(*) as count'))
                    ->groupBy('category')
                    ->orderByDesc('count')
                    ->get();
            });

            return response()->json(['success' => true, 'categories' => $categories]);
        } catch (TypeError $e) {
            return response()->json(['success', false, 'message' => '카테고리를 가져오는 중 오류가 발생했습니다.']);
        }
    }

//    오늘의 사용자 메모장 생성 갯수
    public function GetNotepadsCount()
    {
        try {
            $totalCount = DB::transaction(function () {
                return Notepad::where('user_id', Auth::id())->count();
            });


            $todayCount = DB::transaction(function () {
                return Notepad::where('user_id', Auth::id())
                    ->whereDate('created_at', Carbon::today())
                    ->count();
            });

            return response()->json([
                'success' => true,
                'total_count' => $totalCount,
                'today_count' => $todayCount
            ]);
        } catch (TypeError $e) {
            return response()->json([
                'success' => false,
                'message' => '사용자 데이터를 가져오는 중 오류가 발생했습니다.',
                'type' => 'danger'
            ]);
        }
    }

//    메모장들 가져오기
    public function GetNotepads(Request $request)
    {
        try {
            $user = Auth::user();

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

            $notepads = $query
                ->orderByDesc('created_at')
                ->paginate(24)
                ->through(fn ($n) => [
                    'id' => $n->uuid,
                    'title' => $n->title,
                    'content' => $n->content,
                    'category' => $n->category,
                    'created_at' => $n->created_at->format('Y-m-d H:i:s'),
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
            $notepad = Notepad::where('uuid', $notepad)->first();
            if (!$notepad) {
                return response()->json(['success' => false]);
            }

            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => '로그인 후 이용 가능합니다.', 'type' => 'danger']);
            }

            $content = $notepad->content ?: "공유된 메모장의 내용이 없습니다.";

            Mail::html(
                '
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>📒 메모장이 공유되었습니다</h2>
                <hr>
                <div style="padding: 12px;background: #f3f4f6;">
                    ' . $content . '
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
