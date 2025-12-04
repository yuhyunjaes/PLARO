<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatRoom;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
//    새로운 봇 채팅방 생성
    public function StoreRooms(Request $request) {

        $room = ChatRoom::create([
            'user_id' => Auth::id(),
            'uuid' => Str::uuid()->toString(),
            'title' => $request->title,
            'model_name' => $request->model_name
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
                    ->whereColumn('chat_messages.room_id', 'chat_rooms.uuid')
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
        $room = ChatRoom::where('uuid', $roomId)->first()->delete();

        if(!$room) return response()->json(['success'=>false, 'message'=>'채팅방이 존재하지 않습니다.', 'type'=>'danger']);

        return response()->json(['success'=>true, 'message'=>'채팅방이 삭제되었습니다.', 'type'=>'success']);
    }

//    봇 채팅방 타이틀 수정
    public function UpdateRooms(Request $request, $roomId) {
        $room = ChatRoom::where('uuid', $roomId)->first()->update([
            'title'=>$request->title
        ]);

        if(!$room) return response()->json(['success'=>false, 'message'=>'체팅방 제목 수정중 오류가 발생했습니다.', 'type'=>'danger']);

        return response()->json(['success'=>true, 'message'=>'체팅방 제목이 수정되었습니다.', 'type'=>'success']);
    }

//    봇 채팅방 메시지 저장
    public function StoreMessages(Request $request) {
        $user_message = ChatMessage::create([
            'room_id' => $request->room_id,
            'role' => 'user',
            'text' => $request->user_message
        ]);

        $ai_message = ChatMessage::create([
            'room_id' => $request->room_id,
            'role' => 'model',
            'text' => $request->ai_message
        ]);

        return response()->json([
            'success'=>true,
            'user_id'=>$user_message->id,
            'ai_id'=>$ai_message->id
        ]);

    }

    //    봇 채팅방 메시지들 가져오기 uuid기반
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
}
