<?php

namespace App\Models;

use App\Models\ChatMessage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ChatCategory;
use App\Models\User;

class ChatRoom extends Model
{
    use HasFactory;

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function chatmessages() {
        return $this->hasMany(ChatMessage::class, 'room_id', 'uuid');
    }

    public function chatcategories() {
        return $this->hasMany(ChatCategory::class, 'room_id', 'uuid');
    }

    protected $fillable = [
        'user_id',
        'uuid',
        'title',
        'model_name'
    ];
}
