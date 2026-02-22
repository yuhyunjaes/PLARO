import {ActiveChallengeData} from "../../CalendarData";
import {Dispatch, SetStateAction, useEffect, useMemo, useState} from "react";
import EventColorControl from "../Normal/EventColorControl";

interface ChallengeActivePanelProps {
    challenge: ActiveChallengeData;
    loading: boolean;
    taskUpdating: boolean;
    logSaving: boolean;
    retrying: boolean;
    extending: boolean;
    deleting: boolean;
    challengeColorUpdating: boolean;
    aiSummarizing: boolean;
    aiSummary: string;
    eventColor: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
    onToggleTask: (taskId: number, isDone: boolean) => Promise<void>;
    onSaveDailyLog: (logDate: string, reviewText: string, difficultyScore: number | null) => Promise<void>;
    onRetryChallenge: () => Promise<void>;
    onExtendChallenge: () => Promise<void>;
    onSummarizeWithAi: () => Promise<void>;
    onDeleteChallenge: () => Promise<void>;
}

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const fromLocalDateString = (value: string): Date | null => {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export default function ChallengeActivePanel({
    challenge,
    loading,
    taskUpdating,
    logSaving,
    retrying,
    extending,
    deleting,
    challengeColorUpdating,
    aiSummarizing,
    aiSummary,
    eventColor,
    setEventColor,
    onToggleTask,
    onSaveDailyLog,
    onRetryChallenge,
    onExtendChallenge,
    onSummarizeWithAi,
    onDeleteChallenge,
}: ChallengeActivePanelProps) {
    const maxDay = Math.max(
        challenge.template?.duration_days ?? 1,
        challenge.days.reduce((acc, cur) => Math.max(acc, cur.day_number), 1)
    );
    const unlockedDay = Math.max(1, Math.min(maxDay, challenge.unlocked_day || 1));

    const [selectedDay, setSelectedDay] = useState<number>(Math.min(challenge.current_day || 1, unlockedDay));
    const [reviewText, setReviewText] = useState<string>("");
    const [difficultyScore, setDifficultyScore] = useState<number | null>(null);

    useEffect(() => {
        setSelectedDay(Math.min(challenge.current_day || 1, unlockedDay));
    }, [challenge.uuid, challenge.current_day, unlockedDay]);

    useEffect(() => {
        if (selectedDay > unlockedDay) {
            setSelectedDay(unlockedDay);
        }
    }, [selectedDay, unlockedDay]);

    const selectedDayTasks = useMemo(() => {
        const found = challenge.days.find((day) => day.day_number === selectedDay);
        return found?.tasks ?? [];
    }, [challenge.days, selectedDay]);

    const logDate = useMemo(() => {
        if (!challenge.start_date) return toLocalDateString(new Date());
        const base = fromLocalDateString(challenge.start_date);
        if (!base || isNaN(base.getTime())) return toLocalDateString(new Date());
        base.setDate(base.getDate() + (selectedDay - 1));
        return toLocalDateString(base);
    }, [challenge.start_date, selectedDay]);

    const selectedLog = useMemo(() => {
        return challenge.daily_logs.find((log) => log.log_date === logDate) ?? null;
    }, [challenge.daily_logs, logDate]);

    const canEditTasks = selectedDay === unlockedDay;
    const canEditLog = selectedDay <= unlockedDay;
    const isCompleted = challenge.status === "completed";
    const progressSummary = useMemo(() => {
        const tasks = challenge.days.flatMap((day) => day.tasks);
        const requiredTasks = tasks.filter((task) => task.is_required);
        const optionalTasks = tasks.filter((task) => !task.is_required);
        const requiredDone = requiredTasks.filter((task) => task.is_done).length;
        const optionalDone = optionalTasks.filter((task) => task.is_done).length;

        const daySet = new Set<number>();
        for (const day of challenge.days) {
            if (day.tasks.some((task) => task.is_done)) {
                daySet.add(day.day_number);
            }
        }

        if (challenge.start_date) {
            const startDate = fromLocalDateString(challenge.start_date);
            if (startDate && !isNaN(startDate.getTime())) {
                for (const log of challenge.daily_logs) {
                    const logDateObj = fromLocalDateString(log.log_date);
                    if (!logDateObj || isNaN(logDateObj.getTime())) continue;
                    const dayNumber = Math.floor((logDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (dayNumber > 0) {
                        daySet.add(dayNumber);
                    }
                }
            }
        }

        return {
            activeDays: daySet.size,
            requiredDone,
            requiredTotal: requiredTasks.length,
            optionalDone,
            optionalTotal: optionalTasks.length,
        };
    }, [challenge.days, challenge.daily_logs, challenge.start_date]);

    const logHistory = useMemo(() => {
        const startDate = challenge.start_date ? fromLocalDateString(challenge.start_date) : null;

        return [...challenge.daily_logs]
            .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
            .map((log) => {
                const logDate = fromLocalDateString(log.log_date);
                const dayNumber = startDate && logDate
                    ? Math.floor((logDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : null;
                const dayTasks = dayNumber
                    ? challenge.days.find((day) => day.day_number === dayNumber)?.tasks ?? []
                    : [];
                const requiredTotal = dayTasks.filter((task) => task.is_required).length;
                const requiredDone = dayTasks.filter((task) => task.is_required && task.is_done).length;
                const optionalTotal = dayTasks.filter((task) => !task.is_required).length;
                const optionalDone = dayTasks.filter((task) => !task.is_required && task.is_done).length;

                return {
                    ...log,
                    dayNumber,
                    requiredTotal,
                    requiredDone,
                    optionalTotal,
                    optionalDone,
                };
            });
    }, [challenge.daily_logs, challenge.days, challenge.start_date]);

    useEffect(() => {
        setReviewText(selectedLog?.review_text ?? "");
        setDifficultyScore(selectedLog?.difficulty_score ?? null);
    }, [selectedLog?.id, selectedLog?.review_text, selectedLog?.difficulty_score]);

    const doneCount = selectedDayTasks.filter((task) => task.is_done).length;

    return (
        <div className="space-y-5 px-5 pb-5">
            <div className="rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 flex items-center justify-center text-sm shrink-0 normal-text">
                        {challenge.template?.icon || "C"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold normal-text truncate">{challenge.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${challenge.status === "completed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            }`}>
                                {challenge.status === "completed" ? "완료됨" : "진행 중"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                달성률 {challenge.achievement_rate}%
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                연속 {challenge.streak_count}일
                            </span>
                            {challenge.extension_count > 0 ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                    연장 {challenge.extension_count}회
                                </span>
                            ) : ""}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            필수 미션 {challenge.done_required_count}/{challenge.total_required_count}
                        </p>
                    </div>
                </div>
            </div>

            {challenge.status === "completed" ? (
                <div className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-2">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        필수 미션을 모두 완료해 챌린지가 종료되었습니다.
                    </p>
                    <button
                        type="button"
                        disabled
                        className="btn text-xs bg-emerald-600 text-white w-full opacity-80 cursor-not-allowed"
                    >
                        챌린지 완료
                    </button>
                    {challenge.template ? (
                        <button
                            type="button"
                            onClick={onExtendChallenge}
                            disabled={extending || loading}
                            className="btn text-xs bg-blue-500 hover:bg-blue-600 text-white w-full disabled:opacity-60"
                        >
                            {extending ? "연장 중..." : "연장하기"}
                        </button>
                    ) : ""}
                    <div className="mt-1 rounded border border-emerald-300/70 dark:border-emerald-800/70 bg-white/70 dark:bg-gray-950/40 p-2 space-y-1">
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">챌린지 기록 요약</p>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300">
                            진행 일수: {progressSummary.activeDays}일
                        </p>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300">
                            필수 미션: {progressSummary.requiredDone}/{progressSummary.requiredTotal}
                        </p>
                        {progressSummary.optionalTotal > 0 ? (
                            <p className="text-[11px] text-gray-700 dark:text-gray-300">
                                선택 미션: {progressSummary.optionalDone}/{progressSummary.optionalTotal}
                            </p>
                        ) : ""}
                    </div>

                    <div className="rounded border border-emerald-300/70 dark:border-emerald-800/70 bg-white/80 dark:bg-gray-950/50 p-2 space-y-2">
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">일차별 기록</p>
                        {logHistory.length === 0 ? (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">작성된 일지가 없습니다.</p>
                        ) : (
                            <div className="space-y-2 max-h-[260px] overflow-y-auto hidden-scroll pr-1">
                                {logHistory.map((log) => (
                                    <div
                                        key={`challenge-log-history-${log.id}`}
                                        className="rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-2 space-y-1"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-semibold normal-text truncate">
                                                {log.dayNumber ? `Day ${log.dayNumber}` : "일차 미확인"} · {log.log_date}
                                            </p>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 shrink-0">
                                                난이도 {log.difficulty_score ?? "-"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                            {log.review_text?.trim() ? log.review_text : "작성된 일지 내용이 없습니다."}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            필수 {log.requiredDone}/{log.requiredTotal}
                                        </p>
                                        {log.optionalTotal > 0 ? (
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                선택 {log.optionalDone}/{log.optionalTotal}
                                            </p>
                                        ) : ""}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : ""}

            {challenge.can_retry ? (
                <div className="rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        필수 미션이 남아 있어요. 챌린지를 처음부터 다시 시작할 수 있습니다.
                    </p>
                    <button
                        type="button"
                        onClick={onRetryChallenge}
                        disabled={retrying || loading}
                        className="btn text-xs bg-amber-500 hover:bg-amber-600 text-white w-full disabled:opacity-60"
                    >
                        {retrying ? "다시 시작하는 중..." : "처음부터 다시 시작"}
                    </button>
                </div>
            ) : ""}

            <div className="space-y-2">
                <EventColorControl
                    disabled={challengeColorUpdating}
                    eventColor={eventColor}
                    setEventColor={setEventColor}
                />
            </div>

            {!isCompleted ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-300">일차 선택</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">오늘 진행 가능: Day {unlockedDay}</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto hidden-scroll pb-1">
                        {Array.from({ length: maxDay }).map((_, index) => {
                            const day = index + 1;
                            const active = day === selectedDay;
                            const locked = day > unlockedDay;
                            return (
                                <button
                                    key={`challenge-day-${challenge.uuid}-${day}`}
                                    type="button"
                                    onClick={() => setSelectedDay(day)}
                                    disabled={locked}
                                    className={`min-w-[64px] h-9 rounded border text-[11px] px-3 transition-colors ${active
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : locked
                                            ? "border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800 normal-text"
                                    }`}
                                >
                                    Day {day}{locked ? " 잠김" : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : ""}

            {!isCompleted ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-300">Day {selectedDay} 할 일</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{doneCount}/{selectedDayTasks.length}</p>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto hidden-scroll">
                        {selectedDayTasks.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
                                등록된 할 일이 없습니다.
                            </p>
                        ) : (
                            selectedDayTasks.map((task) => (
                                <button
                                    type="button"
                                    key={`challenge-task-${task.id}`}
                                    onClick={() => onToggleTask(task.id, true)}
                                    disabled={taskUpdating || loading || !canEditTasks || isCompleted || task.is_done}
                                    className={`w-full rounded border text-left p-3 transition-colors ${task.is_done
                                        ? "border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                                        : "border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-900"}`}
                                >
                                    <div className="flex flex-row items-start gap-2">
                                        <div className={`size-4 mt-[2px] rounded-sm border ${task.is_done ? "bg-blue-500 border-blue-500" : "border-gray-400 dark:border-gray-600"}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-row items-center gap-1.5">
                                                <p
                                                    className={`text-xs max-w-[75%] truncate font-semibold flex-1 break-word ${
                                                        task.is_done
                                                            ? "text-blue-700 dark:text-blue-200 line-through"
                                                            : "normal-text"
                                                    }`}
                                                >
                                                    {task.task_order}. {task.title}
                                                </p>
                                                <p className={`text-[10px] px-1.5 py-0.5 rounded  ${task.is_required
                                                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                                    : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                }`}>
                                                    {task.is_required ? "필수" : "선택"}
                                                </p>
                                            </div>
                                            {task.description ? (
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                            ) : ""}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : ""}

            {!isCompleted ? (
                <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300">Day {selectedDay} 일지</p>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="오늘 진행 내용이나 회고를 작성해보세요."
                        disabled={!canEditLog}
                        className="w-full h-24 rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 p-2 text-xs normal-text resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    />
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                type="button"
                                key={`difficulty-${score}`}
                                disabled={!canEditLog}
                                onClick={() => setDifficultyScore((prev) => prev === score ? null : score)}
                                className={`h-8 rounded border text-[11px] transition-colors ${difficultyScore === score
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-100 hover:dark:bg-gray-800 normal-text"} disabled:opacity-50`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">난이도 1(쉬움) ~ 5(어려움)</p>
                    <button
                        type="button"
                        disabled={logSaving || loading || !canEditLog}
                        onClick={() => onSaveDailyLog(logDate, reviewText.trim(), difficultyScore)}
                        className="btn text-xs bg-blue-500 text-white w-full disabled:opacity-60"
                    >
                        {logSaving ? "저장 중..." : "일지 저장"}
                    </button>
                    {!canEditTasks ? (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">미션 체크는 오늘 일차만 수정할 수 있습니다. 일지/난이도는 지난 일차도 수정 가능합니다.</p>
                    ) : ""}
                </div>
            ) : ""}

            <div className="space-y-2">
                {isCompleted ? (
                    <>
                        <button
                            type="button"
                            disabled={aiSummarizing || loading}
                            onClick={onSummarizeWithAi}
                            className="btn text-xs bg-indigo-500 hover:bg-indigo-600 text-white w-full disabled:opacity-60"
                        >
                            {aiSummarizing ? "AI 요약 생성 중..." : (aiSummary ? "AI 요약 다시 생성" : "AI 요약 생성")}
                        </button>
                        {aiSummary ? (
                            <div className="rounded border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 p-3 max-h-[260px] overflow-y-auto hidden-scroll">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap break-words">
                                    {aiSummary}
                                </p>
                            </div>
                        ) : ""}
                    </>
                ) : ""}
                <button
                    type="button"
                    disabled={deleting || loading}
                    onClick={onDeleteChallenge}
                    className="btn text-xs bg-red-500 hover:bg-red-600 text-white w-full disabled:opacity-60"
                >
                    {deleting ? "삭제 중..." : "챌린지 삭제"}
                </button>
            </div>
        </div>
    );
}
