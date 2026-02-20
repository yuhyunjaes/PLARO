<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChallengeDailyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'log_date',
        'review_text',
        'difficulty_score',
    ];

    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'difficulty_score' => 'integer',
        ];
    }

    public function challenge()
    {
        return $this->belongsTo(Challenge::class, 'challenge_id', 'id');
    }
}
