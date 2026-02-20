<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Challenge extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'template_id',
        'title',
        'mode',
        'status',
        'start_date',
        'end_date',
        'current_day',
        'streak_count',
        'achievement_rate',
        'last_check_date',
        'restart_count',
        'review',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'current_day' => 'integer',
            'streak_count' => 'integer',
            'achievement_rate' => 'integer',
            'last_check_date' => 'date',
            'restart_count' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function template()
    {
        return $this->belongsTo(ChallengeTemplate::class, 'template_id', 'id');
    }

    public function dayTasks()
    {
        return $this->hasMany(ChallengeDayTask::class, 'challenge_id', 'id');
    }

    public function dailyLogs()
    {
        return $this->hasMany(ChallengeDailyLog::class, 'challenge_id', 'id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'challenge_id', 'id');
    }
}
