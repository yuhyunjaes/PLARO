<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarkdownTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'owner_id',
        'title',
        'description',
        'template_text',
        'visibility',
        'is_active',
        'usage_count',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id', 'id');
    }

    public function likes()
    {
        return $this->hasMany(MarkdownTemplateLike::class, 'template_id', 'id');
    }
}
