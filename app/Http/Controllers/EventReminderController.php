<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventReminderController extends Controller
{
    public function StoreEventReminder($uuid, Request $request) {
        $event = Event::where('uuid', $uuid)
            ->where('user_id', Auth::id())
            ->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트가 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        $event->reminders()->delete();

        if ($request->filled('seconds')) {
            $reminderData = collect($request->seconds)->map(fn($sec) => [
                'seconds' => $sec,
                'user_id' => Auth::id(),
            ])->toArray();

            $event->reminders()->createMany($reminderData);
        }

        return response()->json(['success' => true, 'reminders' => $event->reminders]);
    }


    public function getActiveEventReminder($uuid) {
        $event = Event::where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if (!$event) return response()->json(['success' => false, 'message' => '이벤트가 존재하지 않습니다.', 'type' => 'danger']);
        $reminders = $event->reminders()->pluck('seconds');
        return response()->json(['success' => true, 'reminders' => $reminders]);
    }

    public function getEventReminders() {
        $reminders = EventReminder::where('user_id', Auth::id())->get();

        return response()->json(['success' => true, 'reminders' => $reminders]);
    }
}
