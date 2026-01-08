<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EventReminder extends Model
{
    use HasFactory;

    public function event() {
        return $this->belongsTo(Event::class, 'event_id', 'uuid');
    }

    protected $fillable = [
        'user_id',
        'event_id',
        'seconds',
        'read'
    ];
}
