import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faCalendarDays, faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import {DateUtils} from "../../../../Utils/dateUtils";

interface Mode {
    title: string;
    key: "month" | "week" | "day";
}
const miniWeekdays: string[] = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarControlSectionProps {
    getWeekWednesday: (date:Date) => Date;
    activeAtToToday: () => void;
    contentMode: "normal" | "challenge" | "dday";
    setContentMode: Dispatch<SetStateAction<"normal" | "challenge" | "dday">>;
    setFirstCenter: Dispatch<SetStateAction<boolean>>;
    setMonths: Dispatch<SetStateAction<Date[]>>;
    setTemporaryYear: Dispatch<SetStateAction<number | null>>;
    setTemporaryMonth: Dispatch<SetStateAction<number | null>>;
    setTemporaryDay: Dispatch<SetStateAction<number | null>>;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    startAt: null | Date;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>;
    activeAt: Date;
    setActiveAt: Dispatch<SetStateAction<Date>>;
    activeDay: number | null;
    setActiveDay: Dispatch<SetStateAction<number | null>>;
}

export default function CalendarControlSection({ getWeekWednesday, activeAtToToday, contentMode, setContentMode, setFirstCenter, setMonths, setTemporaryYear, setTemporaryMonth, setTemporaryDay, setIsDragging, startAt, viewMode, setViewMode, activeAt, setActiveAt, activeDay, setActiveDay}: CalendarControlSectionProps) {
    const MIN_YEAR = 2015;
    const MAX_YEAR = 5000;
    const modes:Mode[] = [
        {
            title: "월",
            key: "month"
        },
        {
            title: "주",
            key: "week"
        },
        {
            title: "일",
            key: "day"
        }
    ];

    const [contentChangeToggle, setContentChangeToggle] = useState<boolean>(false);
    const contentChangeAreaRef = useRef<HTMLDivElement | null>(null);
    const [viewModeToggle, setViewModeToggle] = useState<boolean>(false);
    const viewModeAreaRef = useRef<HTMLDivElement | null>(null);
    const [dateJumpToggle, setDateJumpToggle] = useState<boolean>(false);
    const dateJumpAreaRef = useRef<HTMLDivElement | null>(null);
    const contentModeMeta: Record<"normal" | "challenge" | "dday", {label: string; mobileLabel: string;}> = {
        normal: {
            label: "일반 모드",
            mobileLabel: "일반",
        },
        challenge: {
            label: "챌린지 모드",
            mobileLabel: "챌린지",
        },
        dday: {
            label: "D-day 모드",
            mobileLabel: "D-day",
        }
    };
    const viewModeMeta: Record<"month" | "week" | "day", {label: string; mobileLabel: string;}> = {
        month: {
            label: "월",
            mobileLabel: "월",
        },
        week: {
            label: "주",
            mobileLabel: "주",
        },
        day: {
            label: "일",
            mobileLabel: "일",
        }
    };

    function addOrSubOneMonth(date:Date, status:"add" | "sub") {
        const newDate = new Date(date);
        newDate.setMonth(status === "add" ? newDate.getMonth() + 1 : newDate.getMonth() - 1);
        return newDate;
    }

    const toDateInputValue = useCallback((year: number, month: number, day: number): string => {
        const y = year;
        const m = String(month).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }, []);

    const daysInMonth = useCallback((year: number, month: number): number => {
        return new Date(year, month, 0).getDate();
    }, []);

    const clampYear = useCallback((year: number): number => {
        return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
    }, []);

    const clampMonth = useCallback((month: number): number => {
        return Math.min(12, Math.max(1, month));
    }, []);

    const baseDayForSingleView = useMemo(() => {
        if (activeDay) return activeDay;
        if (startAt) return startAt.getDate();
        return 1;
    }, [activeDay, startAt]);

    const [jumpYear, setJumpYear] = useState<number>(activeAt.getFullYear());
    const [jumpMonth, setJumpMonth] = useState<number>(activeAt.getMonth() + 1);
    const [jumpDay, setJumpDay] = useState<number>(baseDayForSingleView);
    const [miniYear, setMiniYear] = useState<number>(activeAt.getFullYear());
    const [miniMonth, setMiniMonth] = useState<number>(activeAt.getMonth() + 1);
    const displayMonth = String(activeAt.getMonth() + 1).padStart(2, "0");
    const displayDay = String(baseDayForSingleView).padStart(2, "0");
    const displayYearShort = String(activeAt.getFullYear()).slice(2);

    const moveDay = useCallback((baseMonth: Date, day: number, type: "add" | "sub") => {
        const date = new Date(
            baseMonth.getFullYear(),
            baseMonth.getMonth(),
            day
        );

        date.setDate(type === "add"
            ? (viewMode === "week" ? date.getDate() + 7 : date.getDate() + 1)
            : (viewMode === "week" ? date.getDate() - 7 : date.getDate() - 1)
        );

        return {
            newActiveAt: new Date(date.getFullYear(), date.getMonth(), 1),
            newActiveDay: date.getDate(),
        };
    }, [viewMode])

    const handleViewModeChange = useCallback((value: "month" | "week" | "day") => {
        setIsDragging(false);

        if (value === "month") {
            setViewMode("month");
            setTemporaryYear(activeAt.getFullYear());
            setTemporaryMonth(activeAt.getMonth() + 1);
            return;
        }

        const baseYear = startAt ? startAt.getFullYear() : activeAt.getFullYear();
        const baseMonth = startAt ? startAt.getMonth() + 1 : activeAt.getMonth() + 1;
        const baseDay = startAt
            ? startAt.getDate()
            : activeDay
                ? activeDay
                : (activeAt.getMonth() === DateUtils.now().getMonth() && activeAt.getFullYear() === DateUtils.now().getFullYear())
                    ? DateUtils.now().getDate()
                    : 1;

        const baseDate = new Date(baseYear, baseMonth - 1, baseDay);

        setViewMode(value);

        if (value === "week") {
            const weekWednesday = getWeekWednesday(baseDate);

            setTemporaryYear(weekWednesday.getFullYear());
            setTemporaryMonth(weekWednesday.getMonth() + 1);
            setTemporaryDay(weekWednesday.getDate());
        } else {
            setTemporaryYear(baseYear);
            setTemporaryMonth(baseMonth);
            setTemporaryDay(baseDay);
        }
    }, [setIsDragging, setViewMode, setTemporaryYear, setTemporaryMonth, activeAt, startAt, activeDay, getWeekWednesday, setTemporaryDay]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (contentChangeAreaRef.current && !contentChangeAreaRef.current.contains(target) && contentChangeToggle) {
                setContentChangeToggle(false);
            }

            if (viewModeAreaRef.current && !viewModeAreaRef.current.contains(target) && viewModeToggle) {
                setViewModeToggle(false);
            }

            if (dateJumpAreaRef.current && !dateJumpAreaRef.current.contains(target) && dateJumpToggle) {
                setDateJumpToggle(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [contentChangeToggle, viewModeToggle, dateJumpToggle]);

    useEffect(() => {
        if (!dateJumpToggle) return;

        const nextYear = clampYear(activeAt.getFullYear());
        const nextMonth = clampMonth(activeAt.getMonth() + 1);
        setJumpYear(nextYear);
        setJumpMonth(nextMonth);
        setJumpDay(Math.max(1, Math.min(baseDayForSingleView, daysInMonth(nextYear, nextMonth))));
        setMiniYear(nextYear);
        setMiniMonth(nextMonth);
    }, [dateJumpToggle, activeAt, baseDayForSingleView, clampMonth, clampYear, daysInMonth]);

    const shiftMiniMonth = useCallback((offset: number) => {
        let year = miniYear;
        let month = miniMonth + offset;

        while (month < 1) {
            month += 12;
            year -= 1;
        }
        while (month > 12) {
            month -= 12;
            year += 1;
        }

        year = clampYear(year);
        month = clampMonth(month);

        setMiniYear(year);
        setMiniMonth(month);
        setJumpYear(year);
        setJumpMonth(month);
        setJumpDay((prev) => Math.max(1, Math.min(prev, daysInMonth(year, month))));
    }, [miniYear, miniMonth, clampYear, clampMonth, daysInMonth]);

    const miniCalendarCells = useMemo(() => {
        const firstDay = new Date(miniYear, miniMonth - 1, 1);
        const firstWeekday = firstDay.getDay();
        const currentMonthDays = daysInMonth(miniYear, miniMonth);
        const prevMonth = miniMonth === 1 ? 12 : miniMonth - 1;
        const prevYear = miniMonth === 1 ? miniYear - 1 : miniYear;
        const prevMonthDays = daysInMonth(prevYear, prevMonth);
        const nextMonth = miniMonth === 12 ? 1 : miniMonth + 1;
        const nextYear = miniMonth === 12 ? miniYear + 1 : miniYear;

        const cells: Array<{ year: number; month: number; day: number; current: boolean }> = [];

        for (let i = firstWeekday - 1; i >= 0; i--) {
            cells.push({
                year: prevYear,
                month: prevMonth,
                day: prevMonthDays - i,
                current: false,
            });
        }

        for (let day = 1; day <= currentMonthDays; day++) {
            cells.push({
                year: miniYear,
                month: miniMonth,
                day,
                current: true,
            });
        }

        while (cells.length % 7 !== 0) {
            const day = cells.length - (firstWeekday + currentMonthDays) + 1;
            cells.push({
                year: nextYear,
                month: nextMonth,
                day,
                current: false,
            });
        }

        return cells;
    }, [miniYear, miniMonth, daysInMonth]);

    const applyMonthJump = useCallback(() => {
        const year = clampYear(jumpYear);
        const month = clampMonth(jumpMonth);

        const nextActiveAt = new Date(year, month - 1, 1);
        setIsDragging(false);
        setActiveAt(nextActiveAt);
        setMonths([
            new Date(nextActiveAt.getFullYear(), nextActiveAt.getMonth() - 1, 1),
            new Date(nextActiveAt.getFullYear(), nextActiveAt.getMonth(), 1),
            new Date(nextActiveAt.getFullYear(), nextActiveAt.getMonth() + 1, 1),
        ]);
        setTemporaryYear(year);
        setTemporaryMonth(month);
        setTemporaryDay(null);
        setFirstCenter(true);
        setDateJumpToggle(false);
    }, [jumpYear, jumpMonth, clampYear, clampMonth, setIsDragging, setActiveAt, setMonths, setTemporaryYear, setTemporaryMonth, setTemporaryDay, setFirstCenter]);

    const applyDayJump = useCallback(() => {
        const year = clampYear(jumpYear);
        const month = clampMonth(jumpMonth);
        const maxDay = daysInMonth(year, month);
        const day = Math.max(1, Math.min(jumpDay, maxDay));
        const nextActiveAt = new Date(year, month - 1, 1);

        setIsDragging(false);
        setActiveAt(nextActiveAt);
        setActiveDay(day);
        setTemporaryYear(year);
        setTemporaryMonth(month);
        setTemporaryDay(day);
        setDateJumpToggle(false);
    }, [jumpYear, jumpMonth, jumpDay, clampYear, clampMonth, daysInMonth, setIsDragging, setActiveAt, setActiveDay, setTemporaryYear, setTemporaryMonth, setTemporaryDay]);

    return(
        <div className="flex justify-between items-center px-5 pt-5">
            <div className="flex items-center space-x-1 relative">
                <div ref={dateJumpAreaRef} className="relative">
                    <button
                        type="button"
                        className="flex max-w-[150px] md:max-w-none items-center gap-1 text-base md:text-2xl normal-text font-semibold user-select-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                        onClick={() => setDateJumpToggle((prev) => !prev)}
                    >
                        <span className="md:hidden">
                            {displayYearShort}.{displayMonth}
                            {viewMode !== "month" && (
                                <>.{displayDay}</>
                            )}
                        </span>
                        <span className="hidden md:inline">
                            {activeAt.getFullYear()}-{displayMonth}월
                            {viewMode !== "month" && (
                                <>-{displayDay}일</>
                            )}
                        </span>
                        <FontAwesomeIcon icon={faCalendarDays} className="text-xs md:text-sm shrink-0" />
                    </button>

                    {dateJumpToggle && (
                        <div className="absolute top-full left-0 mt-2 w-[220px] md:w-[250px] rounded border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 z-[10] shadow">
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        className="size-6 rounded border border-gray-300 dark:border-gray-700 text-xs normal-text hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
                                        onClick={() => shiftMiniMonth(-1)}
                                    >
                                        <FontAwesomeIcon icon={faAngleLeft} />
                                    </button>
                                    <p className="text-xs md:text-sm font-semibold normal-text">
                                        {miniYear}.{String(miniMonth).padStart(2, "0")}
                                    </p>
                                    <button
                                        type="button"
                                        className="size-6 rounded border border-gray-300 dark:border-gray-700 text-xs normal-text hover:bg-gray-100 hover:dark:bg-gray-800 transition-colors"
                                        onClick={() => shiftMiniMonth(1)}
                                    >
                                        <FontAwesomeIcon icon={faAngleRight} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {miniWeekdays.map((weekday) => (
                                        <span key={`mini-weekday-${weekday}`} className="text-[10px] text-center text-gray-500 dark:text-gray-400 font-semibold">
                                            {weekday}
                                        </span>
                                    ))}
                                    {miniCalendarCells.map((cell, index) => {
                                        const isSelected = viewMode === "month"
                                            ? (cell.year === jumpYear && cell.month === jumpMonth && cell.day === 1)
                                            : (cell.year === jumpYear && cell.month === jumpMonth && cell.day === jumpDay);
                                        return (
                                            <button
                                                key={`mini-cell-${cell.year}-${cell.month}-${cell.day}-${index}`}
                                                type="button"
                                                className={`h-7 rounded text-[10px] md:text-xs font-semibold transition-colors ${
                                                    isSelected
                                                        ? "bg-blue-500 text-white"
                                                        : cell.current
                                                            ? "normal-text hover:bg-gray-100 hover:dark:bg-gray-800"
                                                            : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-800"
                                                }`}
                                                onClick={() => {
                                                    setMiniYear(cell.year);
                                                    setMiniMonth(cell.month);
                                                    setJumpYear(cell.year);
                                                    setJumpMonth(cell.month);
                                                    if (viewMode !== "month") {
                                                        setJumpDay(cell.day);
                                                    }
                                                }}
                                            >
                                                {cell.day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {viewMode === "month" ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold normal-text">이동할 월 선택</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min={MIN_YEAR}
                                            max={MAX_YEAR}
                                            value={jumpYear}
                                            onChange={(e) => {
                                                const year = clampYear(Number(e.target.value || MIN_YEAR));
                                                setJumpYear(year);
                                                setMiniYear(year);
                                            }}
                                            className="form-control"
                                            placeholder="년도"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={jumpMonth}
                                            onChange={(e) => {
                                                const month = clampMonth(Number(e.target.value || 1));
                                                setJumpMonth(month);
                                                setMiniMonth(month);
                                            }}
                                            className="form-control"
                                            placeholder="월"
                                        />
                                    </div>
                                    <button type="button" onClick={applyMonthJump} className="btn main-btn w-full">
                                        이동
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold normal-text">이동할 날짜 선택</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            min={MIN_YEAR}
                                            max={MAX_YEAR}
                                            value={jumpYear}
                                            onChange={(e) => {
                                                const nextYear = clampYear(Number(e.target.value || MIN_YEAR));
                                                setJumpYear(nextYear);
                                                setMiniYear(nextYear);
                                                setJumpDay((prev) => Math.max(1, Math.min(prev, daysInMonth(nextYear, clampMonth(jumpMonth)))));
                                            }}
                                            className="form-control"
                                            placeholder="년"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={jumpMonth}
                                            onChange={(e) => {
                                                const nextMonth = clampMonth(Number(e.target.value || 1));
                                                setJumpMonth(nextMonth);
                                                setMiniMonth(nextMonth);
                                                setJumpDay((prev) => Math.max(1, Math.min(prev, daysInMonth(clampYear(jumpYear), nextMonth))));
                                            }}
                                            className="form-control"
                                            placeholder="월"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={daysInMonth(clampYear(jumpYear), clampMonth(jumpMonth))}
                                            value={jumpDay}
                                            onChange={(e) => {
                                                const maxDay = daysInMonth(clampYear(jumpYear), clampMonth(jumpMonth));
                                                const day = Number(e.target.value || 1);
                                                setJumpDay(Math.max(1, Math.min(day, maxDay)));
                                            }}
                                            className="form-control"
                                            placeholder="일"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={daysInMonth(clampYear(jumpYear), clampMonth(jumpMonth))}
                                        value={jumpDay}
                                        onChange={(e) => setJumpDay(Number(e.target.value))}
                                        className="w-full accent-blue-500"
                                    />
                                    <button type="button" onClick={applyDayJump} className="btn main-btn w-full">
                                        이동
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {viewMode === "month" ? (
                    <>
                        <button onClick={() => {
                            setActiveAt(addOrSubOneMonth(activeAt, "sub"));

                            setFirstCenter(true);
                        }} className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
                            <FontAwesomeIcon icon={faAngleUp} />
                        </button>

                        <button onClick={() => {
                            setActiveAt(addOrSubOneMonth(activeAt, "add"));

                            setFirstCenter(true);
                        }}  className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
                            <FontAwesomeIcon icon={faAngleDown} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => {
                                if (!activeDay) return;

                                const { newActiveAt, newActiveDay } = moveDay(
                                    activeAt,
                                    activeDay,
                                    "sub"
                                );

                                setActiveAt(newActiveAt);
                                setActiveDay(newActiveDay);
                            }}
                            className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl"
                        >
                            <FontAwesomeIcon icon={faAngleLeft} />
                        </button>


                        <button
                            onClick={() => {
                                if (!activeDay) return;

                                const { newActiveAt, newActiveDay } = moveDay(
                                    activeAt,
                                    activeDay,
                                    "add"
                                );

                                setActiveAt(newActiveAt);
                                setActiveDay(newActiveDay);
                            }}
                            className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl"
                        >
                            <FontAwesomeIcon icon={faAngleRight} />
                        </button>

                    </>
                )}
            </div>

            <div className="flex items-center relative">
                <div ref={contentChangeAreaRef} className="relative mr-1">
                    <button
                        type="button"
                        onClick={() => setContentChangeToggle((prev) => !prev)}
                        className={`rounded border px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer bg-gray-50 hover:bg-gray-200 dark:bg-gray-950 hover:dark:bg-gray-800 border-gray-300 dark:border-gray-800 normal-text`}
                        aria-live="polite"
                        title={`현재 ${contentModeMeta[contentMode].label}`}
                    >
                        <p>
                            <span className="md:hidden">{contentModeMeta[contentMode].mobileLabel}</span>
                            <span className="hidden md:inline">{contentModeMeta[contentMode].label}</span>
                        </p>

                        <FontAwesomeIcon className="normal-text pointer-events-none pl-1 text-[10px] md:text-xs" icon={contentChangeToggle ? faChevronUp : faChevronDown}/>
                    </button>

                    {contentChangeToggle ? (
                        <div className="flex flex-col min-w-[90px] bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded p-1 space-y-1 user-select-none absolute top-full mt-1.5 z-[20] left-0 shadow-md">
                            <button
                                type="button"
                                onClick={() => setContentMode("normal")}
                                className={`w-full text-left px-2 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                                    contentMode === "normal"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                }`}
                            >
                                일반
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentMode("challenge")}
                                className={`w-full text-left px-2 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                                    contentMode === "challenge"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                }`}
                            >
                                챌린지
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentMode("dday")}
                                className={`w-full text-left px-2 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                                    contentMode === "dday"
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                }`}
                            >
                                D-day
                            </button>
                        </div>
                    ) : null}
                </div>
                <button onClick={activeAtToToday} className="px-3 py-1 mr-1 font-semibold rounded text-[10px] md:text-xs bg-gray-50 hover:bg-gray-200 dark:bg-gray-950 hover:dark:bg-gray-800 normal-text  transition-colors duration-150 cursor-pointer border border-gray-300 dark:border-gray-800">오늘</button>

                <div ref={viewModeAreaRef} className="relative mr-1">
                    <button
                        type="button"
                        onClick={() => setViewModeToggle((prev) => !prev)}
                        className="rounded border px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer bg-gray-50 hover:bg-gray-200 dark:bg-gray-950 hover:dark:bg-gray-800 border-gray-300 dark:border-gray-800 normal-text"
                        aria-live="polite"
                        title={`현재 ${viewModeMeta[viewMode].label}`}
                    >
                        <p>
                            <span className="md:hidden">{viewModeMeta[viewMode].mobileLabel}</span>
                            <span className="hidden md:inline">{viewModeMeta[viewMode].label}</span>
                        </p>
                        <FontAwesomeIcon className="normal-text pointer-events-none pl-1 text-[10px] md:text-xs" icon={viewModeToggle ? faChevronUp : faChevronDown}/>
                    </button>

                    {viewModeToggle ? (
                        <div className="flex flex-col min-w-[50px] bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded p-1 space-y-1 user-select-none absolute top-full mt-1.5 z-[20] left-0 shadow-md">
                            {modes.map((mode, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        handleViewModeChange(mode.key);
                                        setViewModeToggle(false);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                                        viewMode === mode.key
                                            ? "bg-blue-500 text-white"
                                            : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {mode.title}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

            </div>
        </div>
    );
}
