import {Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import MonthCreator from "./CalendarSection/MonthCreator";
import {CalendarAtData} from "../CalenoteSectionsData";

interface WeekCalendarSectionProps {
    isDragging: boolean;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    startAt: Date | null;
    setStartAt: Dispatch<SetStateAction<Date | null>>;
    endAt: Date | null;
    setEndAt: Dispatch<SetStateAction<Date | null>>;
    activeAt: Date;
    setActiveAt: Dispatch<SetStateAction<Date>>;
    activeDay: number | null;
    setActiveDay: Dispatch<SetStateAction<number | null>>;
}

export default function WeekCalendarSection({ isDragging, setIsDragging, startAt, setStartAt, endAt, setEndAt, activeAt, setActiveAt, activeDay, setActiveDay }: WeekCalendarSectionProps) {
    const [days, setDays] = useState<Date[]>([]);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [baseDate, setBaseDate] = useState<null | Date>(null);
    const scrollRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const daysCreator = useCallback(() => {
        if(!activeAt || !activeDay) return;

        const currentBaseDate = new Date(activeAt.getFullYear(), activeAt.getMonth(), activeDay);
        setBaseDate(currentBaseDate);

        const newDays: Date[] = [];

        for(let i = -4; i <= 4; i++) {
            const day = new Date(currentBaseDate);
            day.setDate(currentBaseDate.getDate() + i);
            newDays.push(day);
        }

        setDays(newDays);

    }, [activeAt, activeDay]);

    useEffect(() => {
        daysCreator();
    }, [daysCreator]);

    const center = () => {
        const container = scrollRef.current;
        if (!container) return;

        const firstEl = container.querySelector(".first") as HTMLElement | null;
        if (!firstEl) return;

        container.scrollLeft = firstEl.offsetLeft;
    }

    useEffect(() => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
            });
        }, 1);
    }, []);

    const [isScrolling, setIsScrolling] = useState<boolean>(false);

    const handleScroll = useCallback(() => {
        if(!scrollRef.current || !activeAt || !activeDay || isScrolling) return;

        const container = scrollRef.current;
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;

        const isAtEnd = scrollLeft + clientWidth >= (scrollWidth - 0.5);

        if (scrollLeft === 0) {
            setIsScrolling(true);
            const newDay = activeDay - 1;

            if (newDay < 1) {
                const newDate = new Date(activeAt.getFullYear(), activeAt.getMonth() - 1, 1);
                const daysInPrevMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();

                setActiveAt(newDate);
                setActiveDay(daysInPrevMonth);
            } else {
                setActiveDay(newDay);
            }
            setTimeout(() => setIsScrolling(false), 300);
        } else if (isAtEnd) {
            setIsScrolling(true);
            const newDay = activeDay + 1;
            const daysInCurrentMonth = new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 0).getDate();

            if (newDay > daysInCurrentMonth) {
                const newDate = new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 1);

                setActiveAt(newDate);
                setActiveDay(1);
            } else {
                setActiveDay(newDay);
            }
            setTimeout(() => setIsScrolling(false), 300);
        }
    }, [activeAt, activeDay, isScrolling]);

    useEffect(() => {
        if (days.length > 0) {
            requestAnimationFrame(() => {
                center();
            });
        }
    }, [days]);

    const handleDateStart = useCallback((e: any):void => {
        if(isMobile) return;

        if(startAt) {
            setStartAt(null);
            setEndAt(null);
            return;
        }
        setIsDragging(true);
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(dateStr) {
            setStartAt(dateStr);
            setEndAt(dateStr);
        }
    }, [startAt, isMobile]);

    const handleDateMove = useCallback((e: any):void => {
        if (!isDragging || isMobile) return;
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(dateStr);
    }, [isDragging]);

    const handleDateEnd = useCallback((e: any) => {
        if (!isDragging || isMobile) return;

        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(dateStr);
        setIsDragging(false);
    }, [isDragging]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleMobileDateClick = useCallback((e: any) => {
        if (!isMobile) return;

        const dateStr = new Date(e.target.dataset.date);
        if (!dateStr) return;

        if (!startAt) {
            setStartAt(dateStr);
            setEndAt(dateStr);
        } else if (!endAt || startAt.getTime() === endAt.getTime()) {
            setEndAt(dateStr);
        } else {
            setStartAt(null);
            setEndAt(null);
        }
    }, [isMobile, startAt, endAt]);

    const handleDateMoveOut = useCallback((e: MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;

        const rect = scrollRef.current.getBoundingClientRect();
        const headerHeight = 36;

        // 수직 범위 체크
        if (
            e.clientY < rect.top + headerHeight ||
            e.clientY > rect.bottom
        ) return;

        let direction = 0;

        if (e.clientX < rect.left) {
            direction = -1;  // 왼쪽으로 벗어남
        } else if (e.clientX > rect.right) {
            direction = 1;   // 오른쪽으로 벗어남
        } else {
            return;  // 범위 내에 있음
        }

        // 현재 activeDay 기준으로 다음/이전 날짜로 이동
        const newDay = activeDay! + direction;
        const daysInCurrentMonth = new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 0).getDate();

        if (newDay < 1) {
            // 이전 달로
            const prevMonth = new Date(activeAt.getFullYear(), activeAt.getMonth() - 1, 1);
            const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();

            setActiveAt(prevMonth);
            setActiveDay(daysInPrevMonth);
        } else if (newDay > daysInCurrentMonth) {
            // 다음 달로
            const nextMonth = new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 1);

            setActiveAt(nextMonth);
            setActiveDay(1);
        } else {
            // 같은 달 내에서 이동
            setActiveDay(newDay);
        }

    }, [isDragging, activeAt, activeDay]);

    useEffect(() => {
        document.addEventListener("mousemove", handleDateMoveOut);
        return () => document.removeEventListener("mousemove", handleDateMoveOut);
    }, [handleDateMoveOut]);



    return(
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl flex-1 flex flex-row overflow-hidden">
            <div className="w-[40px] sm:w-[70px] border-r border-gray-300 dark:border-gray-800 flex flex-col">
                <div className="h-[36px]"></div>
                <div
                    className="flex-1 overflow-y-auto hidden-scroll"
                >
                    {Array.from({ length: 24 }, (_, h) => (
                        <div
                            key={h}
                            className="min-h-[50px] text-xs flex items-start justify-end pr-1 text-gray-500 user-select-none"
                        >
                            {h}:00
                        </div>
                    ))}
                </div>
            </div>
            <div onScroll={handleScroll} ref={scrollRef} className="flex-1 overflow-y-hidden hidden-scroll overflow-x-auto snap-x snap-mandatory flex">
                {days.map((day, index) => {
                    const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
                    return (
                        <div data-prentdate={day} key={day.getTime()} className={`w-[calc(100%/7)] h-full flex flex-col snap-start flex-shrink-0 ${day.toDateString() === baseDate?.toDateString() ? "active" : ""} ${index === 0 ? "first" : ""}`}>
                            <div className="py-2 text-center text-sm dark:bg-gray-800 max-h-[36px] user-select-none font-semibold normal-text flex flex-col items-center justify-center leading-tight">
                                <span className="text-xs text-gray-500 space-x-1">
                                    <span>{WEEK_DAYS[day.getDay()]}</span>
                                    <span>{day.getDate()}</span>
                                </span>
                            </div>

                            <div className="flex-1 grid">
                                {Array.from({ length: 24 }, (_, hour) => (
                                    <div
                                        data-time={`${hour+1}:00`}
                                        key={hour}
                                        className={`grid border-[0.5px] border-gray-300 dark:border-gray-800 min-h-[50px]`}
                                    >
                                        {Array.from({ length: 60 },(_, min) => {
                                            const toStartOfDay = (date: Date) =>
                                                new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

                                            const year = day.getFullYear();
                                            const month = day.getMonth() + 1;
                                            const date = day.getDate();

                                            const yyyy = year;
                                            const mm = month < 10 ? `0${month}` : month;
                                            const dd = date < 10 ? `0${date}` : date;
                                            const hh = hour < 10 ? `0${hour}` : hour;
                                            const mi = min < 10 ? `0${min}` : min;

                                            const cellDayTime = new Date(
                                                day.getFullYear(),
                                                day.getMonth(),
                                                day.getDate()
                                            ).getTime();

                                            const startDayTime = startAt ? toStartOfDay(startAt) : null;
                                            const endDayTime = endAt ? toStartOfDay(endAt) : null;

                                            const minDay = startDayTime !== null && endDayTime !== null
                                                ? Math.min(startDayTime, endDayTime)
                                                : null;

                                            const maxDay = startDayTime !== null && endDayTime !== null
                                                ? Math.max(startDayTime, endDayTime)
                                                : null;

                                            const isSelected =
                                                minDay !== null &&
                                                maxDay !== null &&
                                                cellDayTime >= minDay &&
                                                cellDayTime <= maxDay;

                                            return(
                                                <div
                                                    data-date={`${yyyy}-${mm}-${dd}T${hh}:${mi}`}
                                                    onMouseDown={handleDateStart}
                                                    onMouseUp={handleDateEnd}
                                                    onMouseEnter={handleDateMove}
                                                    onClick={handleMobileDateClick}
                                                    key={min}
                                                    className={`
                                                ${isSelected
                                                        ? "bg-blue-500/10"
                                                        : (day.getDay() === 5 || day.getDay() === 6)
                                                            ? "bg-gray-50 dark:bg-[#0d1117]"
                                                            : "bg-white dark:bg-gray-950"}`}

                                                >

                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
