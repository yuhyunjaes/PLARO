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
        'icon',
        'category',
        'duration_days',
        'visibility',
        'is_system',
        'is_active',
        'usage_count',
        'like_count',
    ];

    protected function casts(): array
    {
        return [
            'duration_days' => 'integer',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
            'usage_count' => 'integer',
            'like_count' => 'integer',
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

    public function likes()
    {
        return $this->hasMany(ChallengeTemplateLike::class, 'template_id', 'id');
    }

    public function likedUsers()
    {
        return $this->belongsToMany(User::class, 'challenge_template_likes', 'template_id', 'user_id')
            ->withTimestamps();
    }
}
