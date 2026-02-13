<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventReminderController extends Controller
{
    private function canViewEvent(string $uuid)
    {
        return Event::where('uuid', $uuid)
            ->whereHas('users', fn ($q) =>
            $q->where('users.id', Auth::id())
            )
            ->first();
    }

    public function StoreEventReminder($uuid, Request $request)
    {
        $event = $this->canViewEvent($uuid);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트 접근 권한이 없습니다.',
                'type' => 'danger'
            ]);
        }

        $data = $request->validate([
            'seconds' => ['required', 'integer', 'min:0', 'max:2419200'],
        ]);

        $reminder = $event->reminders()
            ->where('user_id', Auth::id())
            ->where('seconds', $data['seconds'])
            ->first();

        if (!$reminder) {
            $reminder = $event->reminders()->create([
                'seconds' => $data['seconds'],
                'user_id' => Auth::id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'reminder' => [
                ...$reminder->toArray(),
                'event_uuid' => $event->uuid
            ],
        ]);
    }

    public function getActiveEventReminder($uuid)
    {
        $event = $this->canViewEvent($uuid);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트 접근 권한이 없습니다.',
                'type' => 'danger'
            ]);
        }

        $reminders = $event->reminders()
            ->where('user_id', Auth::id())
            ->get(['id', 'seconds']);

        return response()->json([
            'success' => true,
            'reminders' => $reminders->map(fn ($r) => [
                'id' => $r->id,
                'seconds' => $r->seconds,
            ]),
        ]);
    }

    public function getEventReminders()
    {
        $reminders = EventReminder::where('user_id', Auth::id())
            ->with('event:id,uuid')
            ->get();

        return response()->json([
            'success' => true,
            'reminders' => $reminders->map(fn ($r) => [
                ...$r->toArray(),
                'event_uuid' => $r->event?->uuid
            ])
        ]);
    }

    public function updateEventReminderRead($id)
    {
        $reminder = EventReminder::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$reminder) {
            return response()->json(['success' => false]);
        }

        $reminder->update(['read' => true]);

        return response()->json(['success' => true]);
    }

    public function deleteEventReminder($id)
    {
        $reminder = EventReminder::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$reminder) {
            return response()->json([
                'success' => false,
                'message' => '리마인더가 존재하지 않습니다.',
                'type' => 'danger'
            ]);
        }

        $reminder->delete();

        return response()->json(['success' => true]);
    }

    public function updateEventRemindersRead($uuid)
    {
        $event = $this->canViewEvent($uuid);

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => '이벤트 접근 권한이 없습니다.',
                'type' => 'danger'
            ]);
        }

        $event->reminders()
            ->where('user_id', Auth::id())
            ->update(['read' => false]);

        return response()->json(['success' => true]);
    }
}
