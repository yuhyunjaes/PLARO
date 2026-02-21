import {ActiveDdayData} from "../../../CalenoteSectionsData";

interface DdayActivePanelProps {
    dday: ActiveDdayData;
    loading: boolean;
    checking: boolean;
    retrying: boolean;
    extending: boolean;
    deleting: boolean;
    onToggleTodayCheck: (nextDone: boolean) => Promise<void>;
    onRetryDday: () => Promise<void>;
    onExtendDday: () => Promise<void>;
    onDeleteDday: () => Promise<void>;
}

const getTodayLocalDate = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

export default function DdayActivePanel({
    dday,
    loading,
    checking,
    retrying,
    extending,
    deleting,
    onToggleTodayCheck,
    onRetryDday,
    onExtendDday,
    onDeleteDday,
}: DdayActivePanelProps) {
    const today = getTodayLocalDate();
    const todayCheck = dday.checks.find((check) => check.check_date === today);
    const todayDone = !!todayCheck?.is_done;
    const inRange = !!dday.start_date && !!dday.target_date && today >= dday.start_date && today <= dday.target_date;
    const todayCheckDisabled = !inRange || checking || loading || dday.status === "completed" || todayDone;

    return (
        <div className="space-y-5 px-5 pb-5">
            <div className="rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-sm font-semibold normal-text truncate">{dday.title || "D-day"}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${dday.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}>
                        {dday.status === "completed" ? "완료됨" : "진행 중"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        달성률 {dday.achievement_rate}%
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        연속 {dday.streak_count}일
                    </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    진행 {dday.checked_days}/{dday.total_days}일 · 목표일 {dday.target_date}
                </p>
            </div>

            <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200">오늘 체크</p>
                <button
                    type="button"
                    disabled={todayCheckDisabled}
                    onClick={() => onToggleTodayCheck(!todayDone)}
                    className={`btn text-xs w-full ${todayDone
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"} disabled:opacity-60`}
                >
                    {checking ? "체크 저장 중..." : (todayDone ? "오늘 완료됨" : "오늘 했어요")}
                </button>
                {todayDone ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">오늘 체크 완료. 당일 취소는 불가합니다.</p>
                ) : ""}
                {!inRange ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">오늘은 체크 가능한 기간이 아닙니다.</p>
                ) : ""}
            </div>

            {dday.can_retry ? (
                <div className="rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        진행 중 공백이 있어요. 다시 시작하려면 재도전을 눌러주세요.
                    </p>
                    <button
                        type="button"
                        onClick={onRetryDday}
                        disabled={retrying || loading}
                        className="btn text-xs bg-amber-500 hover:bg-amber-600 text-white w-full disabled:opacity-60"
                    >
                        {retrying ? "재도전 중..." : "재도전"}
                    </button>
                </div>
            ) : ""}

            {dday.can_extend ? (
                <div className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-2">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        목표일까지 빠짐없이 달성했습니다. 같은 기간으로 연장할 수 있어요.
                    </p>
                    <button
                        type="button"
                        onClick={onExtendDday}
                        disabled={extending || loading}
                        className="btn text-xs bg-blue-500 hover:bg-blue-600 text-white w-full disabled:opacity-60"
                    >
                        {extending ? "연장 중..." : "연장하기"}
                    </button>
                </div>
            ) : ""}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold tracking-wide text-gray-700 dark:text-gray-200">수행 기록</p>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{dday.checks.length}건</span>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto hidden-scroll">
                    {dday.checks.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
                            아직 체크 기록이 없습니다.
                        </p>
                    ) : (
                        dday.checks.map((check) => (
                            <div
                                key={`dday-check-${check.id}`}
                                className="rounded px-2 py-2 flex items-center justify-between gap-2 hover:bg-gray-100/70 dark:hover:bg-gray-900/70 transition-colors"
                            >
                                <p className="text-xs normal-text truncate">{check.check_date}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${check.is_done
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }`}>
                                    {check.is_done ? "완료" : "미완료"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button
                type="button"
                disabled={deleting || loading}
                onClick={onDeleteDday}
                className="btn text-xs bg-red-500 hover:bg-red-600 text-white w-full disabled:opacity-60"
            >
                {deleting ? "삭제 중..." : "D-day 삭제"}
            </button>
        </div>
    );
}
