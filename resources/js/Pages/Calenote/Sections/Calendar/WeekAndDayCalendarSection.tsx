import {Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

interface WeekCalendarSectionProps {
    setEventReminder: Dispatch<SetStateAction<number[]>>;
    eventId: string | null;
    setEventDescription: Dispatch<SetStateAction<string>>;
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
    setEventTitle: Dispatch<SetStateAction<string>>;
    mobileView: boolean;
    viewMode: "month" | "week" | "day";
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

export default function WeekAndDayCalendarSection({
    setEventReminder,
    eventId,
    setEventDescription,
    setEventColor,
    setEventTitle,
    mobileView,
    viewMode,
    isDragging,
    setIsDragging,
    startAt,
    setStartAt,
    endAt,
    setEndAt,
    activeAt,
    setActiveAt,
    activeDay,
    setActiveDay
}: WeekCalendarSectionProps) {
    const [days, setDays] = useState<Date[]>([]);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [baseDate, setBaseDate] = useState<null | Date>(null);
    const [isScrolling, setIsScrolling] = useState<boolean>(false);

    const scrollRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const intervalRef = useRef<any | null>(null);
    const directionRef = useRef<-1 | 0 | 1>(0);
    const lastMouseEvent = useRef<MouseEvent | null>(null);

    const activeAtRef = useRef(activeAt);
    const activeDayRef = useRef(activeDay);

    useEffect(() => {
        activeAtRef.current = activeAt;
        activeDayRef.current = activeDay;
    }, [activeAt, activeDay]);

    const add15Minutes = useCallback((date:Date):Date => {
        if (startAt && date < startAt) {
            const d = new Date(startAt.getTime());
            d.setMinutes(d.getMinutes() + 15);
            setStartAt(d)
            return date;
        }
        const d = new Date(date.getTime());
        d.setMinutes(d.getMinutes() + 15);
        return d;
    }, [startAt]);


    const daysCreator = useCallback(() => {
        if(!activeAt || !activeDay || !viewMode) return;

        const currentBaseDate = new Date(activeAt.getFullYear(), activeAt.getMonth(), activeDay);
        setBaseDate(currentBaseDate);

        const newDays: Date[] = [];

        const frontAndBack:1 | 2 | 4 = mobileView && viewMode === "week" ? 2 : viewMode === "week" ? 4 : 1;

        for(let i = -frontAndBack; i <= frontAndBack; i++) {
            const day = new Date(currentBaseDate);
            day.setDate(currentBaseDate.getDate() + i);
            newDays.push(day);
        }

        setDays(newDays);
    }, [activeAt, activeDay, viewMode]);

    useEffect(() => {
        daysCreator();
    }, [daysCreator]);

    const center = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const firstEl = container.querySelector(".first") as HTMLElement | null;
        if (!firstEl) return;

        container.scrollLeft = firstEl.offsetLeft;
    }, []);

    useEffect(() => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
            });
        }, 1);
    }, [center]);

    useEffect(() => {
        if (days.length > 0) {
            requestAnimationFrame(() => {
                center();
            });
        }
    }, [days, center]);

    const scrollTimeoutRef = useRef<number | null>(null);

    const handleScroll = useCallback(() => {
        if(!scrollRef.current || !activeAtRef.current || !activeDayRef.current || isScrolling) return;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const container = scrollRef.current;
            if (!container) return;

            const currentActiveAt = activeAtRef.current;
            const currentActiveDay = activeDayRef.current;

            if (!currentActiveAt || !currentActiveDay) return;

            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            const threshold = 5;

            if (scrollLeft < threshold) {
                setIsScrolling(true);
                const newDay = currentActiveDay - 1;

                if (newDay < 1) {
                    const newDate = new Date(currentActiveAt.getFullYear(), currentActiveAt.getMonth() - 1, 1);
                    const daysInPrevMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();

                    setActiveAt(newDate);
                    setActiveDay(daysInPrevMonth);
                } else {
                    setActiveDay(newDay);
                }
                setTimeout(() => setIsScrolling(false), 300);
            } else if (scrollLeft + clientWidth > scrollWidth - threshold) {
                setIsScrolling(true);
                const newDay = currentActiveDay + 1; // ref 대신 변수 사용
                const daysInCurrentMonth = new Date(currentActiveAt.getFullYear(), currentActiveAt.getMonth() + 1, 0).getDate();

                if (newDay > daysInCurrentMonth) {
                    const newDate = new Date(currentActiveAt.getFullYear(), currentActiveAt.getMonth() + 1, 1);

                    setActiveAt(newDate);
                    setActiveDay(1);
                } else {
                    setActiveDay(newDay);
                }
                setTimeout(() => setIsScrolling(false), 300);
            }
        }, 300);
    }, [isScrolling]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleDateStart = useCallback((e: any):void => {
        if (isMobile) return;

        if(eventId && startAt) {
            setStartAt(null);
            setEndAt(null);
            return;
        } else if (startAt && !eventId) {
            setStartAt(null);
            setEndAt(null);
            setEventTitle("");
            setEventReminder([]);
            setEventDescription("");
            setEventColor("bg-blue-500");
            return;
        }

        setIsDragging(true);
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(dateStr) {
            setStartAt(dateStr);
            setEndAt(add15Minutes(dateStr));
        }
    }, [startAt, isMobile, eventId]);

    const handleDateMove = useCallback((e: any):void => {
        if (!isDragging || isMobile) return;
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(add15Minutes(dateStr));
    }, [isDragging, isMobile]);

    const handleDateEnd = useCallback((e: any) => {
        if (!isDragging || isMobile) return;

        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(add15Minutes(dateStr));
        setIsDragging(false);
    }, [isDragging, isMobile]);

    const isInitialRange = (start: Date, end: Date) =>
        end.getTime() === add15Minutes(start).getTime();

    const handleMobileDateClick = useCallback((e: any) => {
        if (!isMobile) return;

        const date = new Date(e.target.dataset.date);
        if (!date) return;

        if (!startAt) {
            setStartAt(date);
            setEndAt(add15Minutes(date));
            return;
        }

        if (!endAt || isInitialRange(startAt, endAt)) {
            setEndAt(add15Minutes(date));
            return;
        }

        if(eventId) {
            setStartAt(null);
            setEndAt(null);
        } else {
            setStartAt(null);
            setEndAt(null);
            setEventTitle("");
            setEventReminder([]);
            setEventDescription("");
            setEventColor("bg-blue-500");
        }
    }, [isMobile, startAt, endAt, eventId]);


    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (isDragging) {
            container.style.overflowX = 'hidden';
        } else {
            container.style.overflowX = 'auto';
        }
    }, [isDragging]);

    const handleDateMoveOut = useCallback((e: MouseEvent) => {
        if (!isDragging || !scrollRef.current || isMobile) return;

        const rect = scrollRef.current.getBoundingClientRect();
        const headerHeight = 36;

        if (
            e.clientY < rect.top + headerHeight ||
            e.clientY > rect.bottom
        ) return;

        let weekX: number;
        if (e.clientX < rect.left) {
            weekX = viewMode === "week" ? 1 : 0;
        } else if (e.clientX > rect.right) {
            weekX = viewMode === "week" ? 7 : 2;
        } else {
            return;
        }

        const targetDiv = document.querySelectorAll<HTMLElement>('[data-prentdate]')[weekX];
        if (!targetDiv) return;

        const hourParent = targetDiv.querySelectorAll<HTMLElement>('.hour');
        if(hourParent.length <= 0) return;

        const hour = weekX === 1 ? hourParent[0] : hourParent[hourParent.length - 1];
        if(!hour) return;

        const slotParent = hour.querySelectorAll<HTMLElement>('.time-slot');
        if(!slotParent) return;

        const slot = weekX === 1 ? slotParent[0] : slotParent[slotParent.length - 1];
        if(!slot?.dataset.date) return;

        const dateStr:Date | undefined = new Date(slot.dataset.date);
        if(!dateStr) return;

        setEndAt(add15Minutes(dateStr));
    }, [isDragging]);

    const startInterval = useCallback(() => {
        if (intervalRef.current !== null) return;

        intervalRef.current = window.setInterval(() => {
            if (directionRef.current === 0 || !activeAtRef.current || !activeDayRef.current) return;

            setIsScrolling(true);

            if (directionRef.current === -1) {
                const newDay = activeDayRef.current - 1;
                if (newDay < 1) {
                    const newDate = new Date(activeAtRef.current.getFullYear(), activeAtRef.current.getMonth() - 1, 1);
                    const daysInPrevMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                    setActiveAt(newDate);
                    setActiveDay(daysInPrevMonth);
                } else {
                    setActiveDay(newDay);
                }
            } else if (directionRef.current === 1) {
                const newDay = activeDayRef.current + 1;
                const daysInCurrentMonth = new Date(activeAtRef.current.getFullYear(), activeAtRef.current.getMonth() + 1, 0).getDate();
                if (newDay > daysInCurrentMonth) {
                    const newDate = new Date(activeAtRef.current.getFullYear(), activeAtRef.current.getMonth() + 1, 1);
                    setActiveAt(newDate);
                    setActiveDay(1);
                } else {
                    setActiveDay(newDay);
                }
            }

            requestAnimationFrame(() => {
                center();
            });

            setTimeout(() => {
                setIsScrolling(false);
                if (lastMouseEvent.current) {
                    handleDateMoveOut(lastMouseEvent.current);
                }
            }, 300);
        }, 1000);
    }, [center, handleDateMoveOut]);

    const stopInterval = useCallback(() => {
        directionRef.current = 0;
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        lastMouseEvent.current = e;

        if (!scrollRef.current || !isDragging) return;

        const rect = scrollRef.current.getBoundingClientRect();

        if (e.clientX < rect.left) {
            directionRef.current = -1;
            startInterval();
        } else if (e.clientX > rect.right) {
            directionRef.current = 1;
            startInterval();
        } else {
            directionRef.current = 0;
            stopInterval();
        }

        handleDateMoveOut(e);
    }, [isDragging, handleDateMoveOut, startInterval, stopInterval]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        stopInterval();
        lastMouseEvent.current = null;
    }, [setIsDragging, stopInterval]);

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            if(intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [handleMouseMove, handleMouseUp]);

    return(
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl flex-1 flex flex-row overflow-hidden bg-white dark:bg-[#0d1117]">
            <div className="w-[40px] sm:w-[70px] border-r border-gray-300 dark:border-gray-800 flex flex-col">
                <div className="min-h-[32px] max-h-[36px] dark:bg-gray-800"></div>
                {Array.from({ length: 24 }, (_, h) => (
                    <div
                        key={h}
                        className="text-xs flex justify-end pr-1 text-gray-500 user-select-none max-h-[50px] flex-1"
                    >
                        {h !== 0 ? h+":00" : ""}
                    </div>
                ))}
            </div>
            <div
                onScroll={handleScroll}
                ref={scrollRef}
                className="flex-1 overflow-y-hidden hidden-scroll overflow-x-auto snap-x snap-mandatory flex"
            >
                {days.map((day, index) => {
                    const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
                    return (
                        <div
                            data-prentdate={day}
                            key={day.getTime()}
                            className={`${mobileView && viewMode === "week" ? "w-[calc(100%/3)]" : viewMode === "week" ? "w-[calc(100%/7)]" : "w-[calc(100%)]"} h-full flex flex-col snap-start flex-shrink-0 ${
                                day.toDateString() === baseDate?.toDateString() ? "active" : ""
                            } ${viewMode === "week" ? (index === 0 ? "first" : "") : index === 1 ? "first" : ""}`}
                        >
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
                                        className={`grid hour border-[0.5px] border-gray-300 dark:border-gray-800 min-h-[50px]`}
                                    >
                                        {Array.from({ length: 4 },(_, quarterIndex) => {
                                            const actualHour = hour;
                                            const actualMin = quarterIndex * 15;

                                            const year = day.getFullYear();
                                            const month = day.getMonth() + 1;
                                            const date = day.getDate();

                                            const yyyy = year;
                                            const mm = month < 10 ? `0${month}` : month;
                                            const dd = date < 10 ? `0${date}` : date;
                                            const hh = actualHour < 10 ? `0${actualHour}` : actualHour;
                                            const mi = actualMin < 10 ? `0${actualMin}` : actualMin;

                                            const cellDateTime = new Date(
                                                year,
                                                day.getMonth(),
                                                date,
                                                actualHour,
                                                actualMin,
                                                0,
                                                0
                                            ).getTime();

                                            const startDateTime = startAt
                                                ? new Date(
                                                    startAt.getFullYear(),
                                                    startAt.getMonth(),
                                                    startAt.getDate(),
                                                    startAt.getHours(),
                                                    startAt.getMinutes(),
                                                    0,
                                                    0
                                                ).getTime()
                                                : null;

                                            const endDateTime = endAt
                                                ? new Date(
                                                    endAt.getFullYear(),
                                                    endAt.getMonth(),
                                                    endAt.getDate(),
                                                    endAt.getHours(),
                                                    endAt.getMinutes(),
                                                    0,
                                                    0
                                                ).getTime()
                                                : null;

                                            const minTime =
                                                startDateTime !== null && endDateTime !== null
                                                    ? Math.min(startDateTime, endDateTime)
                                                    : null;

                                            const maxTime =
                                                startDateTime !== null && endDateTime !== null
                                                    ? Math.max(startDateTime, endDateTime)
                                                    : null;

                                            const isSelected =
                                                minTime !== null &&
                                                maxTime !== null &&
                                                cellDateTime >= minTime &&
                                                cellDateTime < maxTime;



                                            return(
                                                <div
                                                    data-date={`${yyyy}-${mm}-${dd}T${hh}:${mi}`}
                                                    onDragStart={(e) => {e.preventDefault();}}
                                                    onMouseDown={handleDateStart}
                                                    onMouseUp={handleDateEnd}
                                                    onMouseEnter={handleDateMove}
                                                    onClick={handleMobileDateClick}
                                                    key={quarterIndex}
                                                    className={`
                                                        ${isSelected
                                                        ? "bg-blue-500/10"
                                                        : (day.getDay() === 0 || day.getDay() === 6)
                                                            ? "bg-gray-50 dark:bg-[#0d1117]"
                                                            : "bg-white dark:bg-gray-950"
                                                    } time-slot cursor-pointer transition-colors`}
                                                />
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
