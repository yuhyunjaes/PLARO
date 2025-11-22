<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notepad;
use App\Models\NotepadLikes;

class NotepadLikeController extends Controller
{
//    메모장 찜 추가
    public function StoreNotepadsLike($uuid) {
        $user = auth()->user();

        $notepad = Notepad::where('uuid', $uuid)->firstOrFail();

        $exists = NotepadLikes::where('user_id', $user->id)
            ->where('notepad_id', $notepad->uuid)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => '이미 찜한 노트입니다.']);
        }

        NotepadLikes::create([
            'user_id' => $user->id,
            'notepad_id' => $notepad->uuid,
        ]);

        return response()->json(['success' => true, 'message' => '노트 찜']);
    }

//    메모장 찜 삭제
    public function DeleteNotepadsLike($uuid) {
        $user = auth()->user();

        $notepad = Notepad::where('uuid', $uuid)->firstOrFail();

        NotepadLikes::where('user_id', $user->id)
            ->where('notepad_id', $notepad->uuid)
            ->delete();

        return response()->json(['success' => true, 'message' => '노트 찜 취소']);
    }

//    찜된 메모장들 가져오기
    public function GetNotepadsLike() {
        $user = auth()->user();

        $likes = NotepadLikes::where('user_id', $user->id)->get('notepad_id');

        return response()->json(['success' => true, 'likes' => $likes]);
    }
}
