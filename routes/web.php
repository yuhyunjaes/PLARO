                                <?php
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\IndexController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\NotepadController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\NotepadLikeController;
use App\Models\Notepad;
use App\Http\Controllers\ChatCategoryController;

Route::post('api/lifebot/title', function (Request $request) {
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

Route::get('/', function () {
    return Inertia::render('Home/Home');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/check-id/{id}', [AuthController::class, 'checkId'])->name('checkId');

    Route::post('/send-email-code', [AuthController::class, 'sendEmail'])->name('sendEmail');
    Route::post('/check-email-code', [AuthController::class, 'checkEmail'])->name('checkEmail');

    Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');

    Route::get('/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');

    Route::get('/register', function () {
        return Inertia::render('Auth/Register');
    })->name('register');
});

Route::middleware('auth')->group(function () {
    Route::get('/lifebot', function () {
        return Inertia::render('LifeBot/LifeBot');
    })->name('lifebot');


    Route::get('/calenote', function () {
        return Inertia::render('Calenote/Dashboard');
    })->name('dashboard');

    Route::get('/calenote/calendar', function () {
        return Inertia::render('Calenote/Calendar');
    })->name('calendar');

    Route::get('/calenote/calendar/{mode}', function ($mode) {
        $modeTypes = ['month', 'week', 'day'];

        if (!in_array($mode, $modeTypes)) {
            return Inertia::render('Status/Status', ['status' => 404]);
        }

        return Inertia::render('Calenote/Calendar', ['mode' => $mode]);
    })->name('calendar');

    Route::get('/calenote/notepad', function () {
        return Inertia::render('Calenote/Notepad');
    })->name('notepad');

    Route::get('/calenote/notepad/{uuid}', function () {
        $notepad = Notepad::where('user_id', Auth::id())->where('uuid', request('uuid'))->first();
        if(!$notepad) return Inertia::render('Status/Status', [
            'status' => 404,
        ]);

        return Inertia::render('Calenote/Sections/Notepad/NotepadWriteSection',
        [
            'content' => $notepad->content,
            'uuid' => $notepad->uuid,
            'title' => $notepad->title,
            'status' => 200,
        ]
        );
    })->name('notepad.write');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/lifebot/{uuid}', function ($uuid) {
        return Inertia::render('LifeBot/LifeBot', [
            'roomId' => $uuid,
        ]);
    })->name('lifebot.room');


    Route::post('/api/notepads', [NotepadController::class, 'StoreNotepads'])->name('notepads.store');
    Route::get('/api/notepads', [NotepadController::class, 'GetNotepads'])->name('notepads.get');

    Route::post('/notepads/{uuid}/like', [NotepadLikeController::class, 'StoreNotepadsLike'])->name('notepads.like.store');
    Route::delete('/notepads/{uuid}/like', [NotepadLikeController::class, 'DeleteNotepadsLike'])->name('notepads.like.delete');
    Route::get('/notepads/likes', [NotepadLikeController::class, 'GetNotepadsLike'])->name('notepads.like.get');
    Route::put('/api/notepads/{uuid}/title', [NotepadController::class, 'UpdateNotepadTitle'])->name('notepads.title.update');
    Route::put('/api/notepads/{uuid}/category', [NotepadController::class, 'UpdateNotepadCategory'])->name('notepads.category.update');

    Route::get('/api/notepads/categories', [NotepadController::class, 'GetNotepadsByCategory'])->name('notepads.category.get');
    Route::get('/api/notepads/count', [NotepadController::class, 'GetNotepadsCount'])->name('notepads.count.get');

    Route::get('/api/notepads/contents/{id}', [NotepadController::class, 'GetContents'])->name('notepads.contents.get');

    Route::put('/api/notepads/{uuid}', [NotepadController::class, 'UpdateNotepads'])->name('notepads.update');
    Route::delete('/api/notepads/{uuid}', [NotepadController::class, 'DeleteNotepads'])->name('notepads.delete');

    Route::post('/api/rooms', [ChatController::class, 'StoreRooms'])->name('rooms.store');
    Route::get('/api/rooms', [ChatController::class, 'GetRooms'])->name('rooms.get');
    Route::delete('/api/rooms/{roomId}', [ChatController::class, 'DeleteRooms'])->name('rooms.delete');
    Route::put('/api/rooms/{roomId}', [ChatController::class, 'UpdateRooms'])->name('rooms.update');

    Route::get('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'GetRoomsCategories'])->name('rooms.categories.get');
    Route::post('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'StoreRoomsCategories'])->name('rooms.categories.store');
    Route::delete('/api/rooms/{roomId}/categories', [ChatCategoryController::class, 'DeleteRoomsCategories'])->name('rooms.categories.delete');

    Route::post('/api/messages', [ChatController::class, 'StoreMessages'])->name('messages.store');
    Route::get('/api/messages/{roomId}', [ChatController::class, 'getMessages'])->name('messages.get');

    Route::post("/api/notepads/{notepad}/share/email", [NotepadController::class, 'ShareEmail'])->name('notepads.share.email');

});

Route::get('/user', function () {
    if (Auth::check()) {
        return response()->json(['success' => true, 'user' => Auth::user()]);
    }
    return response()->json(['success' => false]);
});

require __DIR__.'/auth.php';
