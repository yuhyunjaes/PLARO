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
        return $this->hasMany(Event::class, 'creator_id', 'id');
    }

    public function chatrooms() {
        return $this->hasMany(ChatRoom::class);
    }

    public function challengeTemplatesOwned() {
        return $this->hasMany(ChallengeTemplate::class, 'owner_id', 'id');
    }

    public function challenges() {
        return $this->hasMany(Challenge::class, 'user_id', 'id');
    }

    public function likedNotepads() {
        return $this->hasMany(NotepadLike::class);
    }

    protected $fillable = [
        'user_id',
        'password',
        'name',
        'email',
        'nationality',
        'timezone',
        'google_id',
        'facebook_id',
        'kakao_id',
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

    public function isSocialAccount(): bool
    {
        return !empty($this->google_id) || !empty($this->facebook_id) || !empty($this->kakao_id);
    }

    public function needsSocialProfileCompletion(): bool
    {
        if (!$this->isSocialAccount()) {
            return false;
        }

        $missingEmail = $this->hasPlaceholderEmail();
        $missingNationality = empty($this->nationality);

        return $missingEmail || $missingNationality;
    }

    public function hasPlaceholderEmail(): bool
    {
        return str_ends_with((string) $this->email, '@social.local');
    }

    public function socialProvider(): string
    {
        if (!empty($this->kakao_id)) {
            return 'kakao';
        }

        if (!empty($this->google_id)) {
            return 'google';
        }

        if (!empty($this->facebook_id)) {
            return 'facebook';
        }

        return 'social';
    }
}
