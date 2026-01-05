<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class NotepadLike extends Model
{
    use HasFactory;

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function notepad() {
        return $this->belongsTo(Notepad::class, 'notepad_id', 'uuid');
    }


    protected $fillable = [
        'user_id',
        'notepad_id',
    ];
}
