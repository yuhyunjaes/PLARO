<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Notepad;
use App\Models\ChatRoom;
use App\Models\Event;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */

    public function notepads() {
        return $this->hasMany(Notepad::class);
    }

    public function events() {
        return $this->hasMany(Event::class);
    }

    public function chatrooms() {
        return $this->hasMany(ChatRoom::class);
    }

    public function likedNotepads() {
        return $this->hasMany(NotepadLike::class);
    }

    protected $fillable = [
        'user_id',
        'password',
        'name',
        'email',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
