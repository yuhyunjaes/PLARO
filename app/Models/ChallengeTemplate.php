<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChallengeTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'owner_id',
        'title',
        'description',
        'category',
        'duration_days',
        'visibility',
        'is_system',
        'is_active',
        'usage_count',
    ];

    protected function casts(): array
    {
        return [
            'duration_days' => 'integer',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
            'usage_count' => 'integer',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id', 'id');
    }

    public function days()
    {
        return $this->hasMany(ChallengeTemplateDay::class, 'template_id', 'id');
    }

    public function challenges()
    {
        return $this->hasMany(Challenge::class, 'template_id', 'id');
    }
}
