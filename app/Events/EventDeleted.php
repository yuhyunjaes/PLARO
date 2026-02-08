<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EventDeleted implements ShouldBroadcastNow {
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $eventUuid,
        public int $deletedBy,
        public array $participantIds,
    ) {}
    public function broadcastOn(): array
    {
        return collect($this->participantIds)
            ->map(fn ($userId) =>
            new PrivateChannel("user.{$userId}.events")
            )
            ->toArray();
    }

    public function broadcastAs(): string
    {
        return 'event.deleted';
    }

    public function broadcastWith(): array {
        return [
            'event_uuid' => $this->eventUuid,
            'delete_by' => $this->deletedBy,
        ];
    }
}
