<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DdayDailyCheck extends Model
{
    use HasFactory;

    protected $fillable = [
        'dday_id',
        'check_date',
        'is_done',
        'checked_at',
    ];

    protected function casts(): array
    {
        return [
            'check_date' => 'date',
            'is_done' => 'boolean',
            'checked_at' => 'datetime',
        ];
    }

    public function dday()
    {
        return $this->belongsTo(Dday::class, 'dday_id', 'id');
    }
}

