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

class NotepadController extends Controller
{
//    새로운 메모장 생성
    public function StoreNotepads(Request $request) {
        $title = null;

        $messageToNotepad = $request->only(['content', 'chat_id']);
        if(!empty($messageToNotepad['content']) && !empty($messageToNotepad['chat_id'])) {
            $messageToNotepadSwitch = true;

            $title = ChatMessage::findOrFail($messageToNotepad['chat_id'])
                ->chatroom
                ->title;
        } else {
            $messageToNotepadSwitch = false;
        }

        $notepad = Notepad::create([
            'uuid' => Str::uuid()->toString(),
            'chat_id' => $messageToNotepadSwitch ? $messageToNotepad['chat_id'] : null,
            'user_id'=>Auth::id(),
            'title'=>$messageToNotepadSwitch ? $title : $request->note_title,
            'content'=>$messageToNotepadSwitch ? $messageToNotepad['content'] : null,
            'category'=>$request->category,
        ]);

        return $messageToNotepadSwitch ?
            response()->json(['success'=>true, 'id'=>$notepad->uuid])
            : response()->json(['success'=>true, 'id'=>$notepad->uuid, 'created_at'=>$notepad->created_at->format('Y-m-d H:i:s'), 'message'=>'메모장이 생성되었습니다.']);
    }

//    메모장 타이틀 수정
    public function UpdateNotepadTitle($uuid, Request $request)
    {
        $notepad = Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if(!$notepad) return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);

        $notepad->update([
            'title' => $request->title
        ]);

        return response()->json(['success' => true, 'message' => '메모장 이름이 변경되었습니다.', 'type' => 'success']);
    }

    //    메모장 카테고리 수정
    public function UpdateNotepadCategory($uuid, Request $request)
    {
        $notepad = Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if(!$notepad) return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);

        $notepad->update([
            'category' => $request->category
        ]);

        return response()->json(['success' => true, 'message' => '메모장 카테고리가 변경되었습니다.', 'type' => 'success']);
    }

//    사용자 메모장 카테고리들 가져오기
    public function GetNotepadsByCategory()
    {
        $categories = Notepad::where('user_id', Auth::id())
            ->select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        if($categories) return response()->json(['success' => true, 'categories' => $categories]);
        return response()->json(['success', false]);
    }

//    오늘의 사용자 메모장 생성 갯수
    public function GetNotepadsCount()
    {
        $totalCount = Notepad::where('user_id', Auth::id())->count();

        $todayCount = Notepad::where('user_id', Auth::id())
            ->whereDate('created_at', Carbon::today())
            ->count();

        return response()->json([
            'success' => true,
            'total_count' => $totalCount,
            'today_count' => $todayCount
        ]);
    }

//    메모장들 가져오기
    public function GetNotepads(Request $request)
    {
        $user = Auth::user();

        $query = Notepad::where('user_id', $user->id);

        if ($request->filled('title')) {
            $query->where('title', 'like', '%'.$request->query('title').'%');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        // liked 필터
        if ($request->boolean('liked')) {
            $query->whereHas('likes', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $notepads = $query->orderByDesc('created_at')
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->uuid,
                    'title' => $n->title,
                    'content' => $n->content,
                    'category' => $n->category,
                    'created_at' => $n->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json(['success' => true, 'notepads' => $notepads]);
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
        $notepad = Notepad::where('uuid', $uuid)->first();
        if(!$notepad) return response()->json(['success' => false]);

        $notepad->update([
            'content' => $request->text
        ]);

        return response()->json(['success' => true, 'message'=>'메모장이 수정되었습니다.']);
    }

//    메모장 삭제
    public function DeleteNotepads($uuid) {
        $notepad = Notepad::where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if(!$notepad) return response()->json(['success' => false]);
        $notepad->delete();
        return response()->json(['success' => true, 'message'=>'메모장이 삭제되었습니다.']);
    }

//    메모장 내용 이메일 전송
    public function shareEmail($notepad) {
        $notepad = Notepad::where('uuid', $notepad)->first();
        if (!$notepad) {
            return response()->json(['success' => false]);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => '로그인 후 이용 가능합니다.', 'type' => 'danger']);
        }

        $content = $notepad->content ?: "공유된 메모장의 내용이 없습니다.";

        Mail::raw($content, function ($message) use ($user, $notepad) {
            $message->to($user->email)
                ->subject($notepad->title ?: "메모장 공유");
        });

        return response()->json(['success' => true, 'message' => '메모장 내용이 이메일로 전송되었습니다', 'type' => 'success']);
    }

}
