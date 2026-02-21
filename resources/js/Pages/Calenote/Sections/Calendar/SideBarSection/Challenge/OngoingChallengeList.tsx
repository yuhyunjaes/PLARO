import {EventsData} from "../../../CalenoteSectionsData";

interface OngoingChallengeListProps {
    challengeEvents: EventsData[];
    eventId: string | null;
    loading: boolean;
    onSelect: (event: EventsData) => Promise<void>;
}

const toDateLabel = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
};

export default function OngoingChallengeList({
    challengeEvents,
    eventId,
    loading,
    onSelect,
}: OngoingChallengeListProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-300">진행중 챌린지</p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{challengeEvents.length}개</span>
            </div>

            <div className="max-h-[200px] overflow-y-auto hidden-scroll space-y-2 pr-1">
                {challengeEvents.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
                        진행중인 챌린지가 없습니다.
                    </p>
                ) : (
                    challengeEvents.map((event) => {
                        const isActive = event.uuid === eventId;
                        const endAt = new Date(event.end_at);
                        return (
                            <button
                                key={event.uuid}
                                type="button"
                                onClick={() => onSelect(event)}
                                disabled={loading}
                                className={`w-full rounded-lg border text-left p-3 transition-colors ${isActive
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                    : "border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-900"}`}
                            >
                                <p className="text-xs font-semibold normal-text truncate">{event.title || "챌린지 이벤트"}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    종료일 {toDateLabel(endAt)}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

