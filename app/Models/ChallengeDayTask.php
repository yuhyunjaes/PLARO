<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChallengeDayTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'challenge_id',
        'day_number',
        'task_order',
        'title',
        'description',
        'is_required',
        'is_done',
        'done_at',
    ];

    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
            'task_order' => 'integer',
            'is_required' => 'boolean',
            'is_done' => 'boolean',
            'done_at' => 'datetime',
        ];
    }

    public function challenge()
    {
        return $this->belongsTo(Challenge::class, 'challenge_id', 'id');
    }
}
