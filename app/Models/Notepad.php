<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\ChatMessage;

class Notepad extends Model
{
    use HasFactory;

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function message() {
        return $this->belongsTo(ChatMessage::class, 'chat_id', 'id');
    }

    public function likes() {
        return $this->hasMany(NotepadLike::class, 'notepad_id', 'uuid');
    }

    protected $fillable = [
        'uuid',
        'chat_id',
        'user_id',
        'title',
        'content',
        'category',
    ];
}
