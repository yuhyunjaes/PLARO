<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ChatCategory;
use App\Models\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatCategoryController extends Controller
{
    public function DeleteRoomsCategories($roomId) {
        ChatCategory::where('room_id', $roomId)->delete();
        return response()->json(['success' => true]);
    }

    public function StoreRoomsCategories($roomId, Request $request) {
        try {
            $ChatCategories = $request->arr;
            if(!$ChatCategories) {
                return response()->json(['success' => false]);
            }
            $Room = ChatRoom::where('uuid', $roomId)->where('user_id', Auth::id())->first();

            ChatCategory::where('room_id', $Room->uuid)->delete();

            if(!$Room) {
                return response()->json(['success' => false]);
            }

            foreach ($ChatCategories as $ChatCategory) {
                ChatCategory::create([
                    'room_id' => $roomId,
                    'category' => $ChatCategory
                ]);
            }

            return response()->json(['success' => true, "categories" => $Room->chatcategories]);
        } catch (\Exception $e) {
            dd($e->getMessage());
        }
    }

    public function GetRoomsCategories($roomId) {
        try {
            $Room = ChatRoom::where('uuid', $roomId)->where('user_id', Auth::id())->first();
            if(!$Room) {
                return response()->json(['success' => false]);
            }
            return response()->json(['success' => true, "categories" => $Room->chatcategories]);
        } catch (\Exception $e) {
            dd($e->getMessage());
        }
    }
}
