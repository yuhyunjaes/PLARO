<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotepadController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotepadLikeController;
use App\Http\Controllers\ChatCategoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventReminderController;
use App\Http\Controllers\EventParticipantController;
use App\Http\Controllers\EventInvitationController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\EventUserController;
use App\Models\Notepad;
use Illuminate\Support\Facades\Session;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| 모든 라우트를 web 미들웨어 그룹 안에 넣어 Inertia 요청 처리 보장
|
*/

Route::middleware('web')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Home/Home');
    })->name('home');

    Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'Accept'])->name('invitations.accept');
    Route::post('/invitations/{token}/accept/session', [InvitationController::class, 'AcceptSession'])->name('invitations.accept.session.store');

    Route::post('/invitations/{token}/decline', [InvitationController::class, 'Decline'])->name('invitations.decline');


    // --------------------
    // Guest routes
    // --------------------
    Route::middleware('guest')->group(function () {

        Route::get('/login', function () {
            $email = Session::get('invitation_email', null);
            return Inertia::render('Auth/Login', [
                'sessionEmail' => $email,
            ]);
        })->name('login');

        Route::get('/register', function () {
            $email = Session::get('invitation_email', null);

            return Inertia::render('Auth/Register', [
                'sessionEmail' => $email,
            ]);
        })->name('register');

        Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
        Route::post('/login', [AuthController::class, 'login'])->name('login.submit');

        Route::get('/check-id/{id}', [AuthController::class, 'checkId'])->name('checkId');
        Route::post('/send-email-code', [AuthController::class, 'sendEmail'])->name('sendEmail');
        Route::post('/check-email-code', [AuthController::class, 'checkEmail'])->name('checkEmail');
    });

    // --------------------
    // Authenticated routes
    // --------------------
    Route::middleware('auth')->group(function () {
        Route::get('/lifebot', function () {
            return Inertia::render('LifeBot/LifeBot');
        })->name('lifebot');

        Route::get('/lifebot/{uuid}', function ($uuid) {
            return Inertia::render('LifeBot/LifeBot', ['roomId' => $uuid]);
        })->name('lifebot.room');

        Route::get('/calenote', function () {
            return Inertia::render('Calenote/Dashboard');
        })->name('dashboard');

        Route::get('/calenote/calendar', function () {
            return Inertia::render('Calenote/Calendar');
        })->name('calendar');

        Route::get('/calenote/calendar/{mode}/{year}/{month}/{day?}', function ($mode, $year = 0, $month = 0, $day = 0) {
            // mode 체크
            $modeTypes = ['month', 'week', 'day'];
            if (!in_array($mode, $modeTypes)) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            if ($year === null || !preg_match('/^[0-9]{4}$/', $year) || $year < 2015 || $year > 5000) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            if ($month === null) {
                $month = 1;
            } elseif ($month < 1 || $month > 12) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            if (in_array($mode, ['week', 'day'])) {
                if ($day === null) {
                    $day = 1;
                } else {
                    $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
                    if ($day < 1 || $day > $daysInMonth) {
                        $day = 1;
                    }
                }
            }

            return Inertia::render('Calenote/Calendar', [
                'mode' => $mode,
                'year' => (int)$year,
                'month' => (int)$month,
                'day' => $day !== null ? (int)$day : null,
            ]);
        })->name('calendar');

        Route::get('/calenote/calendar/{uuid}', function ($uuid) {
            return Inertia::render('Calenote/Calendar', ['event' => $uuid]);
        })->name('calendar');

        Route::get('/calenote/notepad', function () {
            return Inertia::render('Calenote/Notepad');
        })->name('notepad');

        Route::get('/calenote/notepad/{uuid}', function () {
            $user = Auth::user();

            $notepad = Notepad::where('user_id', $user->id)
                ->where('uuid', request('uuid'))
                ->withExists([
                    'likes as liked' => function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    }
                ])
                ->first();

            if (!$notepad) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            return Inertia::render('Calenote/Sections/Notepad/NotepadWriteSection', [
                'content' => $notepad->content,
                'uuid' => $notepad->uuid,
                'title' => $notepad->title,
                'liked' => (bool) $notepad->liked,
                'status' => 200,
            ]);
        })->name('notepad.write');

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // --------------------
        // Notepad API
        // --------------------
        Route::post('/api/notepads', [NotepadController::class, 'StoreNotepads'])->name('notepads.store');
        Route::get('/api/notepads', [NotepadController::class, 'GetNotepads'])->name('notepads.get');
        Route::put('/api/notepads/{uuid}', [NotepadController::class, 'UpdateNotepads'])->name('notepads.update');
        Route::delete('/api/notepads/{uuid}', [NotepadController::class, 'DeleteNotepads'])->name('notepads.delete');

        Route::put('/api/notepads/{uuid}/title', [NotepadController::class, 'UpdateNotepadTitle'])->name('notepads.title.update');
        Route::put('/api/notepads/{uuid}/category', [NotepadController::class, 'UpdateNotepadCategory'])->name('notepads.category.update');
        Route::get('/api/notepads/categories', [NotepadController::class, 'GetNotepadsByCategory'])->name('notepads.category.get');
        Route::get('/api/notepads/count', [NotepadController::class, 'GetNotepadsCount'])->name('notepads.count.get');
        Route::get('/api/notepads/contents/{id}', [NotepadController::class, 'GetContents'])->name('notepads.contents.get');
        Route::post("/api/notepads/{notepad}/share/email", [NotepadController::class, 'ShareEmail'])->name('notepads.share.email');

        Route::post('/notepads/{uuid}/like', [NotepadLikeController::class, 'StoreNotepadsLike'])->name('notepads.like.store');
        Route::delete('/notepads/{uuid}/like', [NotepadLikeController::class, 'DeleteNotepadsLike'])->name('notepads.like.delete');

        // --------------------
        // Chat API
        // --------------------
        Route::post('/api/rooms', [ChatController::class, 'StoreRooms'])->name('rooms.store');
        Route::get('/api/rooms', [ChatController::class, 'GetRooms'])->name('rooms.get');
        Route::put('/api/rooms/{roomId}', [ChatController::class, 'UpdateRooms'])->name('rooms.update');
        Route::delete('/api/rooms/{roomId}', [ChatController::class, 'DeleteRooms'])->name('rooms.delete');

        Route::get('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'GetRoomsCategories'])->name('rooms.categories.get');
        Route::post('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'StoreRoomsCategories'])->name('rooms.categories.store');
        Route::delete('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'DeleteRoomsCategories'])->name('rooms.categories.delete');

        Route::post('/api/messages', [ChatController::class, 'StoreMessages'])->name('messages.store');
        Route::get('/api/messages/{roomId}', [ChatController::class, 'getMessages'])->name('messages.get');

        // --------------------
        // Event Api
        // --------------------
        Route::post('/api/events', [EventController::class, 'StoreEvents'])->name('event.store');
        Route::put('/api/events/{uuid}', [EventController::class, 'UpdateEvents'])->name('event.update');
        Route::get('/api/events/{uuid}', [EventController::class, 'GetActiveEvents'])->name('event.active.get');
        Route::delete('/api/events/{uuid}', [EventController::class, 'DeleteEvents'])->name('event.delete');
        Route::get('/api/events', [EventController::class, 'GetEvents'])->name('event.get');
        Route::post('/api/event/{uuid}/reminders', [EventReminderController::class, 'StoreEventReminder'])->name('event.reminder.store');
        Route::get('/api/event/{uuid}/reminders', [EventReminderController::class, 'getActiveEventReminder'])->name('event.active.reminder.get');
        Route::put('/api/event/{uuid}/reminders', [EventReminderController::class, 'updateEventRemindersRead'])->name('event.reminders.read.update');
        Route::get('/api/event/reminders', [EventReminderController::class, 'getEventReminders'])->name('event.reminder.get');
        Route::put('/api/event/reminders/{id}', [EventReminderController::class, 'updateEventReminderRead'])->name('event.reminder.read.update');

        // --------------------
        // Participant Api
        // --------------------
        Route::get('/api/event/{uuid}/participants', [EventParticipantController::class, 'GetActiveParticipants'])->name('event.active.participant.get');
        Route::delete('/api/event/participants', [EventParticipantController::class, 'DeleteParticipants'])->name('event.participant.delete');
        Route::post('/api/event/{uuid}/invitations', [EventInvitationController::class, 'StoreInvitation'])->name('event.invitation.store');
        Route::put('/api/event/event-user/role', [EventUserController::class, 'UpdateEventUserRole'])->name('event.event-user.role.update');

        // --------------------
        // Gemini API
        // --------------------
        Route::post('/api/lifebot/title', function (Request $request) {
            $apiKey = env('GEMINI_API_KEY');
            $model = $request->input('model_name', 'models/gemini-2.5-flash');
            $prompt = $request->input('prompt', '테스트');

            Log::info('Gemini 요청 시작', compact('model', 'prompt'));

            $url = "https://generativelanguage.googleapis.com/v1beta/{$model}:generateContent?key={$apiKey}";

            try {
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(30)
                    ->post($url, [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => [
                            'temperature' => 0.7,
                            'maxOutputTokens' => 2048,
                        ],
                    ]);

                Log::info('Gemini 응답', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $response->json();
            } catch (\Throwable $e) {
                Log::error('Gemini 내부 오류', ['msg' => $e->getMessage()]);
                return response()->json(['error' => $e->getMessage()], 500);
            }
        });

    });
});

// --------------------
// 별도 auth.php
// --------------------
require __DIR__.'/auth.php';
