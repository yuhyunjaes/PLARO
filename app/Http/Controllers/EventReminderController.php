<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventReminder;
use Carbon\Carbon;
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

        $newSeconds = $request->seconds;

        $existingReminders = $event->reminders()
            ->where('user_id', Auth::id())
            ->get();

        $existingSeconds = $existingReminders->pluck('seconds')->toArray();

        $toDelete = array_diff($existingSeconds, $newSeconds);
        if (!empty($toDelete)) {
            $event->reminders()
                ->whereIn('seconds', $toDelete)
                ->where('user_id', Auth::id())
                ->delete();
        }

        $toAdd = array_diff($newSeconds, $existingSeconds);
        if (!empty($toAdd)) {
            $reminderData = collect($toAdd)->map(fn($sec) => [
                'seconds' => $sec,
                'user_id' => Auth::id(),
            ])->toArray();

            $event->reminders()->createMany($reminderData);
        }

        return response()->json([
            'success' => true,
            'reminders' => $event->reminders
        ]);
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

    public function updateEventReminderRead($uuid, $id) {
        $reminder = EventReminder::where('event_id', $uuid)->where('id', $id)->where('user_id', Auth::id())->first();
        if(!$reminder) return response()->json(['success' => false]);
        $reminder->read = true;
        $reminder->save();
        return response()->json(['success' => true]);
    }

    public function updateEventRemindersRead($uuid) {
        $event = Event::where('uuid', $uuid)->where('user_id', Auth::id())->first();
        if (!$event) return response()->json(['success' => false, 'message' => '이벤트가 존재하지 않습니다.', 'type' => 'danger']);

        $event->reminders()->update(['read' => false]);

        return response()->json(['success' => true]);
    }
}
