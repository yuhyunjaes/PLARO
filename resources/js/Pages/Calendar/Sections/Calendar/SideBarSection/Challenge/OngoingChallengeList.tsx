import {useMemo} from "react";
import {EventsData} from "../../CalendarData";

interface OngoingChallengeListProps {
    challengeEvents: EventsData[];
    eventId: string | null;
    loading: boolean;
    onSelect: (event: EventsData) => Promise<void>;
    sectionTitle?: string;
    emptyMessage?: string;
    fallbackTitle?: string;
    dateLabel?: string;
}

const toDateLabel = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
};
const koreanDate: string[] = ["일", "월", "화", "수", "목", "금", "토"];

export default function OngoingChallengeList({
    challengeEvents,
    eventId,
    loading,
    onSelect,
    sectionTitle = "진행중 챌린지",
    emptyMessage = "진행중인 챌린지가 없습니다.",
    fallbackTitle = "챌린지 이벤트",
    dateLabel = "종료일",
}: OngoingChallengeListProps) {
    const groupedByStartDate = useMemo(() => {
        const map = new Map<string, EventsData[]>();
        for (const event of challengeEvents) {
            const startAt = new Date(event.start_at);
            const key = toDateLabel(startAt);
            const bucket = map.get(key) ?? [];
            bucket.push(event);
            map.set(key, bucket);
        }

        return Array.from(map.entries())
            .sort((a, b) => {
                const aDate = a[1][0] ? new Date(a[1][0].start_at).getTime() : 0;
                const bDate = b[1][0] ? new Date(b[1][0].start_at).getTime() : 0;
                return aDate - bDate;
            })
            .map(([key, list]) => ({ key, list }));
    }, [challengeEvents]);

    const getDurationLabel = (event: EventsData): string => {
        const startAt = new Date(event.start_at);
        const endAt = new Date(event.end_at);
        const startDate = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()).getTime();
        const endDate = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate()).getTime();
        const diff = Math.max(1, Math.floor((endDate - startDate) / 86400000) + 1);
        return event.type === "dday" ? `${diff}일 D-day` : `${diff}일 챌린지`;
    };

    return (
        <div className="space-y-2">
            <div className="max-h-[240px] overflow-y-auto hidden-scroll space-y-3 pr-1">
                {challengeEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
                        {emptyMessage}
                    </p>
                ) : (
                    groupedByStartDate.map((group) => (
                        <div key={`ongoing-group-${group.key}`} className="space-y-1.5">
                            <p className="text-xs font-semibold normal-text">
                                {(() => {
                                    const firstEvent = group.list[0];
                                    if (!firstEvent) {
                                        return group.key;
                                    }

                                    const startAt = new Date(firstEvent.start_at);
                                    return `${group.key}(${koreanDate[startAt.getDay()]})`;
                                })()}
                            </p>

                            {group.list.map((event) => {
                                const isActive = event.uuid === eventId;
                                return (
                                    <div
                                        key={event.uuid}
                                        onClick={async () => {
                                            if (loading) return;
                                            await onSelect(event);
                                        }}
                                        className={`flex flex-row py-2 cursor-pointer rounded transition-colors ${isActive
                                            ? "bg-blue-100/60 dark:bg-blue-950/30"
                                            : "hover:bg-gray-200/40 dark:hover:bg-gray-800/40"}`}
                                    >
                                        <div className={`w-[4px] ${event.color} rounded shrink-0`}></div>
                                        <div className="flex-1 pl-2">
                                            <p className={`text-sm font-semibold ${(event.title || "").trim().length > 0 ? "normal-text" : "text-gray-500"} truncate`}>
                                                {event.title || fallbackTitle}
                                            </p>
                                            <p className="text-gray-500 text-xs font-semibold">
                                                {getDurationLabel(event)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
