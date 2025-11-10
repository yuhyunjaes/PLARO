<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notepad;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\ChatMessage;

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
            'category'=>null,
            'color'=>null,
        ]);

        return $messageToNotepadSwitch ?
            response()->json(['success'=>true, 'id'=>$notepad->uuid])
            : response()->json(['success'=>true, 'id'=>$notepad->uuid, 'created_at'=>$notepad->created_at->format('Y-m-d H:i:s'), 'message'=>'메모장이 생성되었습니다.']);
    }

    public function GetNotepads()
    {
        $notepads = Notepad::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->uuid,
                    'title' => $n->title,
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

}
