<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
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
use App\Http\Controllers\PlaroAiController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\ChallengeTemplateController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\DdayController;
use App\Models\Notepad;
use App\Models\Event;
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
            return Inertia::render('Auth/Login', [
                'socialError' => Session::pull('social_error', null),
            ]);
        })->name('login');

        Route::get('/forgot-password', function () {
            return Inertia::render('Auth/ForgotPassword');
        })->name('password.forgot');

        Route::get('/register', function () {
            return Inertia::render('Auth/Register');
        })->name('register');

        Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
        Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
        Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
        Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');

        Route::get('/check-id/{id}', [AuthController::class, 'checkId'])->name('checkId');
        Route::post('/send-email-code', [AuthController::class, 'sendEmail'])->name('sendEmail');
        Route::post('/check-email-code', [AuthController::class, 'checkEmail'])->name('checkEmail');
        Route::post('/password/send-reset-code', [AuthController::class, 'sendPasswordResetCode'])->name('password.send-reset-code');
        Route::post('/password/verify-reset-code', [AuthController::class, 'verifyPasswordResetCode'])->name('password.verify-reset-code');
        Route::post('/password/reset', [AuthController::class, 'resetPassword'])->name('password.reset');

        Route::get('/logout', function () {
            return redirect()->route('login');
        });
    });

    // --------------------
    // Authenticated routes
    // --------------------
    Route::middleware('auth')->group(function () {
        Route::get('/auth/social/complete-profile', [SocialAuthController::class, 'showCompleteProfile'])->name('social.complete.form');
        Route::post('/auth/social/complete-profile', [SocialAuthController::class, 'completeProfile'])->name('social.complete.submit');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        Route::middleware('social.profile.complete')->group(function () {
        Route::get('/plaroai', function () {
            return Inertia::render('PlaroAi/PlaroAi');
        })->name('plaroai');

        Route::get('/plaroai/{uuid}', function ($uuid) {
            return Inertia::render('PlaroAi/PlaroAi', ['roomId' => $uuid]);
        })->name('plaroai.room');

        Route::get('/calenote', function () {
            return Inertia::render('Calenote/Dashboard');
        })->name('dashboard');

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
        })->name('calendar.mode');

        Route::get('/calenote/calendar/{type?}', function ($type = null) {
            $modeTypes = [
                'n' => 'normal',
                'c' => 'challenge',
                'd' => 'dday',
            ];

            if ($type === null) {
                $type = 'normal';
            } elseif (!array_key_exists($type, $modeTypes)) {
                return Inertia::render('Status/Status', ['status' => 404]);
            } else {
                $type = $modeTypes[$type];
            }

            return Inertia::render('Calenote/Calendar', [
                'type' => $type,
            ]);
        })->name('calendar.index');

        Route::get('/calenote/calendar/{type}/{uuid}', function ($type, $uuid) {

            $modeTypes = [
                'n' => 'normal',
                'c' => 'challenge',
                'd' => 'dday',
            ];

            if (!array_key_exists($type, $modeTypes)) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            $canViewEvent = Event::where('uuid', $uuid)
                ->whereHas('users', fn ($q) =>
                $q->where('users.id', Auth::id())
                )
                ->first();

            if(!$canViewEvent) {
                return Inertia::render('Status/Status', ['status' => 403]);
            }

            $allType = $modeTypes[$type];

            $event = Event::where('uuid', $uuid)
                ->where('type', $allType)
                ->with([
                    'eventUsers.user:id,name,email',
                    'invitations',
                    'reminders' => fn ($q) => $q
                        ->where('user_id', Auth::id())
                        ->select('id', 'event_id', 'seconds'),
                ])
                ->first();

            if(!$event) {
                return Inertia::render('Status/Status', ['status' => 404]);
            }

            $activeEventParticipants = $event->eventUsers->map(function ($eu) use ($uuid) {
                return [
                    'user_name' => $eu->user->name,
                    'user_id' => $eu->user->id,
                    'event_id' => $uuid,
                    'email' => $eu->user->email,
                    'role' => $eu->role,
                    'status' => null,
                ];
            })->merge(
                $event->invitations
                    ->whereIn('status', ['pending', 'declined', 'expired'])
                    ->map(function ($inv) use ($uuid) {
                        return [
                            'user_name' => null,
                            'user_id' => null,
                            'invitation_id' => $inv->id,
                            'event_id' => $uuid,
                            'email' => $inv->email,
                            'role' => null,
                            'status' => $inv->status,
                        ];
                    })
            )->values();

            $activeEventReminder = $event->reminders->map(fn ($reminder) => [
                'id' => $reminder->id,
                'seconds' => $reminder->seconds,
            ])->values();

            return Inertia::render('Calenote/Calendar', [
                'event' => $uuid,
                'type' => $allType,
                'activeEvent' => $event,
                'activeEventParticipants' => $activeEventParticipants,
                'activeEventReminder' => $activeEventReminder,
            ]);

        })->name('calendar.event');

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
                'category' => $notepad->category,
                'status' => 200,
            ]);
        })->name('notepad.write');

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
        Route::get('/api/rooms/{roomId}/settings', [ChatController::class, 'GetRoomSettings'])->name('rooms.settings.get');
        Route::put('/api/rooms/{roomId}/settings', [ChatController::class, 'UpdateRoomSettings'])->name('rooms.settings.update');
        Route::get('/api/rooms/{roomId}/summary', [ChatController::class, 'GetRoomSummary'])->name('rooms.summary.get');
        Route::post('/api/rooms/{roomId}/summary', [ChatController::class, 'UpsertRoomSummary'])->name('rooms.summary.upsert');

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
        Route::post('/api/challenge-templates', [ChallengeTemplateController::class, 'StoreChallengeTemplate'])->name('challenge.templates.store');
        Route::get('/api/challenge-templates', [ChallengeTemplateController::class, 'GetChallengeTemplates'])->name('challenge.templates.get');
        Route::put('/api/challenge-templates/{uuid}', [ChallengeTemplateController::class, 'UpdateChallengeTemplate'])->name('challenge.templates.update');
        Route::delete('/api/challenge-templates/{uuid}', [ChallengeTemplateController::class, 'DeleteChallengeTemplate'])->name('challenge.templates.delete');
        Route::get('/api/challenge-templates/{uuid}/days', [ChallengeTemplateController::class, 'GetChallengeTemplateDays'])->name('challenge.templates.days.get');
        Route::post('/api/challenge-templates/{uuid}/like', [ChallengeTemplateController::class, 'StoreChallengeTemplateLike'])->name('challenge.templates.like.store');
        Route::delete('/api/challenge-templates/{uuid}/like', [ChallengeTemplateController::class, 'DeleteChallengeTemplateLike'])->name('challenge.templates.like.delete');
        Route::post('/api/challenges/start', [ChallengeController::class, 'StartChallenge'])->name('challenges.start');
        Route::get('/api/challenges/event/{uuid}', [ChallengeController::class, 'GetChallengeByEvent'])->name('challenges.event.get');
        Route::patch('/api/challenges/{challengeUuid}/tasks/{taskId}', [ChallengeController::class, 'UpdateChallengeDayTask'])->name('challenges.tasks.update');
        Route::put('/api/challenges/{challengeUuid}/daily-logs', [ChallengeController::class, 'UpsertChallengeDailyLog'])->name('challenges.daily-logs.upsert');
        Route::post('/api/challenges/{challengeUuid}/retry', [ChallengeController::class, 'RetryChallenge'])->name('challenges.retry');
        Route::post('/api/challenges/{challengeUuid}/extend', [ChallengeController::class, 'ExtendChallenge'])->name('challenges.extend');
        Route::patch('/api/challenges/{challengeUuid}/color', [ChallengeController::class, 'UpdateChallengeColor'])->name('challenges.color.update');
        Route::post('/api/challenges/{challengeUuid}/summary', [ChallengeController::class, 'SummarizeChallengeWithAi'])->name('challenges.summary.ai');
        Route::delete('/api/challenges/{challengeUuid}', [ChallengeController::class, 'DeleteChallenge'])->name('challenges.delete');
        Route::get('/api/ddays/event/{uuid}', [DdayController::class, 'GetDdayByEvent'])->name('ddays.event.get');
        Route::patch('/api/ddays/{ddayUuid}/today-check', [DdayController::class, 'ToggleTodayCheck'])->name('ddays.today-check.update');
        Route::post('/api/ddays/{ddayUuid}/retry', [DdayController::class, 'RetryDday'])->name('ddays.retry');
        Route::post('/api/ddays/{ddayUuid}/extend', [DdayController::class, 'ExtendDday'])->name('ddays.extend');
        Route::delete('/api/ddays/{ddayUuid}', [DdayController::class, 'DeleteDday'])->name('ddays.delete');
        Route::post('/api/event/{uuid}/reminders', [EventReminderController::class, 'StoreEventReminder'])->name('event.reminder.store');
        Route::get('/api/event/{uuid}/reminders', [EventReminderController::class, 'getActiveEventReminder'])->name('event.active.reminder.get');
        Route::put('/api/event/{uuid}/reminders', [EventReminderController::class, 'updateEventRemindersRead'])->name('event.reminders.read.update');
        Route::get('/api/event/reminders', [EventReminderController::class, 'getEventReminders'])->name('event.reminder.get');
        Route::put('/api/event/reminders/{id}', [EventReminderController::class, 'updateEventReminderRead'])->name('event.reminder.read.update');
        Route::delete('/api/event/reminders/{id}', [EventReminderController::class, 'deleteEventReminder'])->name('event.reminder.delete');

        // --------------------
        // Participant Api
        // --------------------
        Route::get('/api/event/{uuid}/participants', [EventParticipantController::class, 'GetActiveParticipants'])->name('event.active.participant.get');
        Route::delete('/api/event/{uuid}/participants', [EventParticipantController::class, 'DeleteParticipants'])->name('event.participant.delete');
        Route::post('/api/event/{uuid}/invitations', [EventInvitationController::class, 'StoreInvitation'])->name('event.invitation.store');
        Route::put('/api/event/event-user/role', [EventUserController::class, 'UpdateEventUserRole'])->name('event.event-user.role.update');
        Route::delete('/api/event/{uuid}/participants/all', [EventParticipantController::class, 'DeleteParticipantsAll'])->name('event.participant.delete.all');

        // --------------------
        // Gemini API
        // --------------------
        Route::post('/api/plaroai/title', [PlaroAiController::class, 'title'])->name('plaroai.title');
        Route::post('/api/plaroai/chat', [PlaroAiController::class, 'chat'])->name('plaroai.chat');

    });
});
});

// --------------------
// 별도 auth.php
// --------------------
require __DIR__.'/auth.php';
