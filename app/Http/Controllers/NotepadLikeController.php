<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notepad;
use App\Models\NotepadLike;
use Illuminate\Support\Facades\DB;

class NotepadLikeController extends Controller
{
//    메모장 찜 추가
    public function StoreNotepadsLike($uuid) {
        try {
            $user = auth()->user();

            $notepad = Notepad::where('uuid', $uuid)->firstOrFail();

            $exists = NotepadLike::where('user_id', $user->id)
                ->where('notepad_id', $notepad->id)
                ->exists();

            if ($exists) {
                return response()->json(['success' => false, 'message' => '이미 찜한 노트입니다.', 'type' => 'info']);
            }

            NotepadLike::create([
                'user_id' => $user->id,
                'notepad_id' => $notepad->id,
            ]);

            return response()->json(['success' => true, 'message' => '메모장을 찜했습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

//    메모장 찜 삭제
    public function DeleteNotepadsLike($uuid) {
        try {

            DB::transaction(function () use ($uuid) {
                $notepad = Notepad::where('uuid', $uuid)->firstOrFail();

                NotepadLike::where('user_id', auth()->id())
                    ->where('notepad_id', $notepad->id)
                    ->delete();
            });

            return response()->json(['success' => true, 'message' => '메모장 찜을 취소하였습니다.', 'type' => 'success']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => '메모장이 존재하지 않습니다.', 'type' => 'danger']);
        }
    }

//    찜된 메모장들 가져오기
    public function GetNotepadsLike()
    {
        $likes = NotepadLike::where('user_id', auth()->id())
            ->with('notepad:id,uuid')
            ->get();

        return response()->json([
            'success' => true,
            'likes' => $likes->map(fn ($like) => [
                'notepad_uuid' => $like->notepad?->uuid,
            ]),
        ]);
    }

}
