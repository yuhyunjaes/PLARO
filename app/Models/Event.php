<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory;

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function message() {
        return $this->belongsTo(ChatMessage::class, 'chat_id', 'id');
    }

    public function reminders() {
        return $this->hasMany(EventReminder::class, 'event_id', 'uuid');
    }

    protected $fillable = [
        'uuid',
        'chat_id',
        'user_id',
        'title',
        'start_at',
        'end_at',
        'description',
        'color'
    ];
}
