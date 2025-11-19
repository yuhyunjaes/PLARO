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

    public function GetNotepads(Request $request)
    {
        $user = Auth::user();
        $query = Notepad::query();

        // 유저 노트만
        $query->where('user_id', $user->id);

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

    public function GetContents($id) {
        $content = Notepad::where('uuid', $id)
            ->where('user_id', auth('web')->id())
            ->select('content')
            ->first();
        if(!$content) return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.']);

        return response()->json(['success' => true, 'content' => $content]);
    }

    public function UpdateNotepads(Request $request)
    {
        $notepad = Notepad::where('uuid', $request->noteId)->first();
        if(!$notepad) return response()->json(['success' => false]);

        $onlyTitle = $request->onlyTitle;

        if ($onlyTitle) {
            $notepad->update([
                'title' => $request->title
            ]);
        } else {
            $notepad->update([
                'content' => $request->text
            ]);
        }

        return response()->json(['success' => true, 'message'=>'메모장이 수정되었습니다.']);
    }


    public function DeleteNotepads($noteId) {
        $notepad = Notepad::where('uuid', $noteId)->first();
        if(!$notepad) return response()->json(['success' => false]);
        $notepad->delete();
        return response()->json(['success' => true, 'message'=>'메모장이 삭제되었습니다.']);
    }

    public function shareEmail($notepad) {
        $notepad = Notepad::where('uuid', $notepad)->first();
        if (!$notepad) {
            return response()->json(['success' => false]);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false]);
        }

        Mail::raw($notepad->content, function ($message) use ($user, $notepad) {
            $message->to($user->email)
                ->subject($notepad->title);
        });

        return response()->json(['success' => true]);
    }

}
