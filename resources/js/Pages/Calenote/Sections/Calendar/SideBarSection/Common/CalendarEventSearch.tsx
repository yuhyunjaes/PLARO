import {useMemo, useState} from "react";
import {EventsData} from "../../../CalenoteSectionsData";

interface CalendarEventSearchProps {
    mode: "normal" | "challenge" | "dday";
    events: EventsData[];
    eventId: string | null;
    loading?: boolean;
    onSelect: (event: EventsData) => Promise<void>;
    showResults?: boolean;
    keyword?: string;
    onKeywordChange?: (value: string) => void;
}

const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
};

export default function CalendarEventSearch({
    mode,
    events,
    eventId,
    loading = false,
    onSelect,
    showResults = true,
    keyword,
    onKeywordChange,
}: CalendarEventSearchProps) {
    const [localKeyword, setLocalKeyword] = useState<string>("");
    const currentKeyword = keyword ?? localKeyword;
    const normalizedKeyword = currentKeyword.trim().toLowerCase();

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
    }, [events]);

    const filteredEvents = useMemo(() => {
        if (!normalizedKeyword) return sortedEvents.slice(0, 6);
        return sortedEvents.filter((event) => (event.title ?? "").toLowerCase().includes(normalizedKeyword));
    }, [normalizedKeyword, sortedEvents]);

    const titleLabel = mode === "normal" ? "진행 중인 일반 이벤트 검색" : mode === "challenge" ? "진행 중인 챌린지 검색" : "진행 중인 D-day 검색";
    const placeholder = mode === "normal"
        ? "진행 중인 일반 이벤트 제목 검색"
        : mode === "challenge"
            ? "진행 중인 챌린지 제목 검색"
            : "진행 중인 D-day 제목 검색";
    const emptyLabel = normalizedKeyword
        ? "검색 결과가 없습니다."
        : "제목을 입력하면 원하는 이벤트를 빠르게 찾을 수 있어요.";

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{titleLabel}</p>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{normalizedKeyword ? `${filteredEvents.length}개` : `전체 ${events.length}개`}</span>
            </div>

            <input
                type="text"
                value={currentKeyword}
                onChange={(e) => {
                    const value = e.target.value;
                    if (onKeywordChange) {
                        onKeywordChange(value);
                        return;
                    }
                    setLocalKeyword(value);
                }}
                className="w-full rounded border border-gray-300 dark:border-gray-800 bg-transparent px-2 py-2 text-xs outline-none"
                placeholder={placeholder}
            />
            {showResults ? (
                <div className="max-h-[180px] overflow-y-auto hidden-scroll space-y-1 pr-1">
                    {loading ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">이벤트를 불러오는 중입니다...</p>
                    ) : filteredEvents.length <= 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">{emptyLabel}</p>
                    ) : (
                        filteredEvents.map((event) => {
                            const startAt = new Date(event.start_at);
                            const endAt = new Date(event.end_at);
                            const isActive = event.uuid === eventId;
                            return (
                                <button
                                    key={`event-search-${event.uuid}`}
                                    type="button"
                                    onClick={() => onSelect(event)}
                                    disabled={loading}
                                    className={`w-full rounded border text-left p-2 transition-colors ${isActive
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                        : "border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-900"}`}
                                >
                                    <p className="text-xs font-semibold normal-text truncate">{event.title || "제목 없음"}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDate(startAt)} ~ {formatDate(endAt)}
                                    </p>
                                </button>
                            );
                        })
                    )}
                </div>
            ) : null}
        </div>
    );
}
