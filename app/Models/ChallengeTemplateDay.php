<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChallengeTemplateDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'day_number',
        'task_order',
        'title',
        'description',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
            'task_order' => 'integer',
            'is_required' => 'boolean',
        ];
    }

    public function template()
    {
        return $this->belongsTo(ChallengeTemplate::class, 'template_id', 'id');
    }
}
