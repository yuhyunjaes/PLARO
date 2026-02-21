<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dday extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'title',
        'status',
        'start_date',
        'target_date',
        'duration_days',
        'current_day',
        'streak_count',
        'achievement_rate',
        'last_check_date',
        'restart_count',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'target_date' => 'date',
            'duration_days' => 'integer',
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

    public function dailyChecks()
    {
        return $this->hasMany(DdayDailyCheck::class, 'dday_id', 'id');
    }

    public function event()
    {
        return $this->hasOne(Event::class, 'dday_id', 'id');
    }
}

