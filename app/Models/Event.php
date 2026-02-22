<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory;

    public function user()
    {
        return $this->belongsTo(User::class, 'creator_id', 'id');
    }

    public function challenge()
    {
        return $this->belongsTo(Challenge::class, 'challenge_id', 'id');
    }

    public function dday()
    {
        return $this->belongsTo(Dday::class, 'dday_id', 'id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'event_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function reminders()
    {
        return $this->hasMany(EventReminder::class, 'event_id', 'id');
    }

    public function eventUsers()
    {
        return $this->hasMany(EventUser::class, 'event_id', 'id');
    }

    public function invitations()
    {
        return $this->hasMany(EventInvitation::class, 'event_id', 'id');
    }

    protected $fillable = [
        'uuid',
        'chat_id',
        'creator_id',
        'challenge_id',
        'dday_id',
        'title',
        'start_at',
        'end_at',
        'type',
        'status',
        'description',
        'ai_source_text',
        'ai_summary',
        'color',
        'lock_version',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
        ];
    }
}
