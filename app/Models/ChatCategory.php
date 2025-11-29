<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatCategory extends Model
{
    use HasFactory;

    protected $table = 'chat_room_categories';

    protected $fillable = [
        'room_id',
        'category'
    ];

    public function chatroom() {
        return $this->belongsTo(ChatRoom::class, 'room_id', 'uuid');
    }
}
