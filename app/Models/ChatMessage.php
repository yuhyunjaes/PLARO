<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ChatRoom;
use App\Models\Notepad;

class ChatMessage extends Model
{
    use HasFactory;

    public function chatroom() {
        return $this->belongsTo(ChatRoom::class, 'room_id', 'uuid');
    }

    public function notepads() {
        return $this->hasMany(Notepad::class, 'chat_id', 'id');
    }

    protected $fillable = [
        'room_id',
        'role',
        'text'
    ];
}
