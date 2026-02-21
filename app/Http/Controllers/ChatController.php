<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatRoom;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ChatController extends Controller
{
//    새로운 봇 채팅방 생성
    public function StoreRooms(Request $request) {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'model_name' => ['required', 'string', 'max:255'],
            'prompt_profile' => ['nullable', 'string', 'max:2000'],
            'use_history' => ['nullable', 'boolean'],
        ]);

        $room = ChatRoom::create([
            'user_id' => Auth::id(),
            'uuid' => Str::uuid()->toString(),
            'title' => $data['title'],
            'model_name' => $data['model_name'],
            'prompt_profile' => $data['prompt_profile'] ?? null,
            'use_history' => $data['use_history'] ?? true,
        ]);

        return response()->json(['success'=>true, 'room_id'=>$room->uuid, 'title'=>$room->title]);
    }

//    봇 채팅방 가져오기
    public function GetRooms() {
        $rooms = ChatRoom::where('user_id', Auth::id())
            ->select('uuid as room_id', 'title')
            ->addSelect([
                'latest_message_time' => DB::table('chat_messages')
                    ->select('created_at')
                    ->whereColumn('chat_messages.room_id', 'chat_rooms.id')
                    ->latest('created_at')
                    ->limit(1)
            ])
            ->orderByDesc('latest_message_time')
            ->get();

        return response()->json([
            'success' => true,
            'rooms' => $rooms
        ]);
    }

//    봇 채팅방 삭제
    public function DeleteRooms($roomId) {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => '채팅방이 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        $room->delete();

        return response()->json(['success'=>true, 'message'=>'채팅방이 삭제되었습니다.', 'type'=>'success']);
    }

//    봇 채팅방 타이틀 수정
    public function UpdateRooms(Request $request, $roomId) {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => '채팅방이 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        $room->update([
            'title' => $request->title
        ]);

        return response()->json([
            'success' => true,
            'message' => '채팅방 제목이 수정되었습니다.',
            'type' => 'success'
        ]);
    }

//    봇 채팅방 메시지 저장
    public function StoreMessages(Request $request) {
        $room = ChatRoom::where('uuid', $request->room_id)->where('user_id', Auth::id())->firstOrFail();

        $user_message = ChatMessage::create([
            'room_id' => $room->id,
            'role' => 'user',
            'text' => $request->user_message
        ]);

        $ai_message = ChatMessage::create([
            'room_id' => $room->id,
            'role' => 'model',
            'text' => $request->ai_message
        ]);

        return response()->json([
            'success'=>true,
            'user_id'=>$user_message->id,
            'ai_id'=>$ai_message->id
        ]);

    }

    public function getMessages($roomId) {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();
        if(!$room) return response()->json([
            'success'=>false,
            'message'=>'채팅방이 존재하지 않습니다.',
            'type'=>'danger'
        ]);

        $messages = $room->chatmessages()
            ->get(['id', 'role', 'text']);

        return response()->json(['success'=>true, 'messages'=>$messages, 'type'=>'success']);
    }

    // 채팅방 맞춤 설정 조회
    public function GetRoomSettings($roomId) {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if(!$room) return response()->json([
            'success'=>false,
            'message'=>'채팅방이 존재하지 않습니다.',
            'type'=>'danger'
        ]);

        return response()->json([
            'success' => true,
            'settings' => [
                'prompt_profile' => $room->prompt_profile ?? '',
                'use_history' => (bool)$room->use_history,
            ],
            'type' => 'success'
        ]);
    }

    // 채팅방 맞춤 설정 저장
    public function UpdateRoomSettings(Request $request, $roomId) {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if(!$room) return response()->json([
            'success'=>false,
            'message'=>'채팅방이 존재하지 않습니다.',
            'type'=>'danger'
        ]);

        $data = $request->validate([
            'prompt_profile' => ['nullable', 'string', 'max:2000'],
            'use_history' => ['required', 'boolean'],
        ]);

        $room->update([
            'prompt_profile' => $data['prompt_profile'] ?? null,
            'use_history' => $data['use_history'],
        ]);

        return response()->json([
            'success' => true,
            'message' => '대화 설정이 저장되었습니다.',
            'type' => 'success'
        ]);
    }

    // 채팅방 요약 조회
    public function GetRoomSummary($roomId)
    {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => '채팅방이 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        return response()->json([
            'success' => true,
            'summary' => $room->summary ?? '',
            'summary_updated_at' => $room->summary_updated_at?->toDateTimeString(),
            'type' => 'success'
        ]);
    }

    // 채팅방 요약 저장/수정
    public function UpsertRoomSummary(Request $request, $roomId)
    {
        $room = ChatRoom::where('uuid', $roomId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => '채팅방이 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        $data = $request->validate([
            'summary' => ['required', 'string', 'max:20000'],
        ]);

        $room->update([
            'summary' => trim($data['summary']),
            'summary_updated_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'summary' => $room->summary,
            'summary_updated_at' => $room->summary_updated_at?->toDateTimeString(),
            'message' => '대화 요약이 저장되었습니다.',
            'type' => 'success'
        ]);
    }
}
