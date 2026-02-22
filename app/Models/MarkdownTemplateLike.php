<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarkdownTemplateLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'user_id',
    ];

    public function template()
    {
        return $this->belongsTo(MarkdownTemplate::class, 'template_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
