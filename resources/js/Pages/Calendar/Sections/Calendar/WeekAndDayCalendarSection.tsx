import {Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {CalendarAtData, EventReminderItem, EventsData, ParticipantsData} from "./CalendarData";
import {DateUtils} from "../../../../Utils/dateUtils";

interface WeekCalendarSectionProps {
    resetEvent: () => void;
    now: Date;
    handleEventClick: (Event:EventsData) => Promise<void>;
    events: EventsData[];
    setEventParticipants: Dispatch<SetStateAction<ParticipantsData[]>>;
    setEventReminder: Dispatch<SetStateAction<EventReminderItem[]>>;
    eventId: string | null;
    setEventDescription: Dispatch<SetStateAction<string>>;
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
    setEventTitle: Dispatch<SetStateAction<string>>;
    contentMode: "normal" | "challenge" | "dday";
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

interface EventWithLayout extends EventsData {
    start_area: number;
    end_area: number;
    row: number;
    column: number;
}

export default function WeekAndDayCalendarSection({
                                                      resetEvent,
                                                      now,
                                                      handleEventClick,
                                                      events,
                                                      setEventParticipants,
                                                      setEventReminder,
                                                      eventId,
                                                      setEventDescription,
                                                      setEventColor,
                                                      setEventTitle,
                                                      contentMode,
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
    const isPastBlockedInDday = useCallback((date: Date): boolean => {
        if (contentMode !== "dday") return false;
        const today = DateUtils.now();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        return targetStart < todayStart;
    }, [contentMode]);

    const scrollRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const timeZoneRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
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
        if(!activeAtRef.current || !activeDayRef.current || !viewMode) return;

        const currentBaseDate = new Date(activeAtRef.current.getFullYear(), activeAtRef.current.getMonth(), activeDayRef.current);
        setBaseDate(currentBaseDate);

        const newDays: Date[] = [];

        const frontAndBack:1 | 4 = viewMode === "week" ? 4 : 1;

        for(let i = -frontAndBack; i <= frontAndBack; i++) {
            const day = new Date(currentBaseDate);
            day.setDate(currentBaseDate.getDate() + i);
            newDays.push(day);
        }

        setDays(newDays);
    }, [viewMode]);

    useEffect(() => {
        daysCreator();
    }, [activeAt, activeDay, viewMode]);

    const center = () => {
        const container = scrollRef.current;
        if (!container) return;

        const activeEl = container.querySelector(".first") as HTMLElement | null;
        if (!activeEl) return;

        container.scrollTo({
            left: activeEl.offsetLeft,
            behavior: "auto",
        });
    };


    useEffect(() => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
            });
        }, 1);
    }, []);

    useEffect(() => {
        if (days.length > 0) {
            requestAnimationFrame(() => {
                center();
            });
        }
    }, [days]);

    const scrollTimeoutRef = useRef<number | null>(null);

    const handleScroll = useCallback(() => {
        // week 모드에서는 자동 스크롤 비활성화
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

            const threshold = 10;

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
                setTimeout(() => setIsScrolling(false), 100);
            } else if (scrollLeft + clientWidth > scrollWidth - threshold) {
                setIsScrolling(true);
                const newDay = currentActiveDay + 1;
                const daysInCurrentMonth = new Date(currentActiveAt.getFullYear(), currentActiveAt.getMonth() + 1, 0).getDate();

                if (newDay > daysInCurrentMonth) {
                    const newDate = new Date(currentActiveAt.getFullYear(), currentActiveAt.getMonth() + 1, 1);

                    setActiveAt(newDate);
                    setActiveDay(1);
                } else {
                    setActiveDay(newDay);
                }
                setTimeout(() => setIsScrolling(false), 100);
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
        if (contentMode === "challenge") {
            resetEvent();
            return;
        }
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
            setEventParticipants([]);
            setEventDescription("");
            setEventColor("bg-blue-500");
            return;
        }

        setIsDragging(true);
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if (dateStr && isPastBlockedInDday(dateStr)) return;
        if(dateStr) {
            setStartAt(dateStr);
            setEndAt(add15Minutes(dateStr));
        }
    }, [startAt, isMobile, eventId, contentMode, isPastBlockedInDday]);

    const handleDateMove = useCallback((e: any):void => {
        if (contentMode === "challenge") {
            return;
        }
        if (!isDragging || isMobile) return;
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;
        if (isPastBlockedInDday(dateStr)) return;

        setEndAt(add15Minutes(dateStr));
    }, [isDragging, isMobile, contentMode, isPastBlockedInDday]);

    const handleDateEnd = useCallback((e: any) => {
        if (contentMode === "challenge") {
            return;
        }
        if (!isDragging || isMobile) return;

        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;
        if (isPastBlockedInDday(dateStr)) return;

        setEndAt(add15Minutes(dateStr));
        setIsDragging(false);
    }, [isDragging, isMobile, contentMode, isPastBlockedInDday]);

    const isInitialRange = (start: Date, end: Date) =>
        end.getTime() === add15Minutes(start).getTime();

    const handleMobileDateClick = useCallback((e: any) => {
        if (contentMode === "challenge") {
            resetEvent();
            return;
        }
        if (!isMobile) return;

        const date = new Date(e.target.dataset.date);
        if (!date) return;
        if (isPastBlockedInDday(date)) return;

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
            setEventParticipants([]);
            setEventDescription("");
            setEventColor("bg-blue-500");
        }
    }, [isMobile, startAt, endAt, eventId, contentMode, isPastBlockedInDday]);


    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (isDragging) {
            container.style.overflowX = 'hidden';
        } else {
            container.style.overflowX = 'auto';
        }
    }, [isDragging]);

    const subtractDay:(date:Date) => void = (date:Date):Date => {
        const d = new Date(date.getTime());
        d.setDate(d.getDate() - 1);
        return d;
    }

    const handleDateMoveOut = useCallback((e: MouseEvent) => {
        if (!isDragging || !scrollRef.current || isMobile) return;

        const rect = scrollRef.current.getBoundingClientRect();
        const headerHeight = 36;

        if (
            e.clientY < rect.top + headerHeight ||
            e.clientY > rect.bottom
        ) return;

        let weekX: number;
        let XSwitch: string;
        if (e.clientX < rect.left) {
            weekX = viewMode === "week" ? 1 : 1;
            XSwitch = "left";
        } else if (e.clientX > rect.right) {
            weekX = viewMode === "week" ? 7 : 2;
            XSwitch = "right";
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

        const dateStr:Date | void = (XSwitch === "right" && viewMode === "day") ? subtractDay(new Date(slot.dataset.date)) :new Date(slot.dataset.date);
        if(!dateStr) return;
        if (isPastBlockedInDday(dateStr)) return;

        setEndAt(add15Minutes(dateStr));
    }, [isDragging, viewMode, isMobile, isPastBlockedInDday]);

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
    }, [handleDateMoveOut]);

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

    const findIncludeDate = useCallback(( firstDate: Date, lastDate: Date, events: EventsData[] ): (EventsData & { start_area: number; end_area: number })[] => {
        const GRID_COLS = viewMode === "week" ? 9 : 3;

        const weekStartDate = new Date(
            firstDate.getFullYear(),
            firstDate.getMonth(),
            firstDate.getDate(),
            0, 0, 0, 0
        );

        const weekEndDate = new Date(
            lastDate.getFullYear(),
            lastDate.getMonth(),
            lastDate.getDate() + 1,
            0, 0, 0, 0
        );

        const weekStart = weekStartDate.getTime();
        const weekEnd = weekEndDate.getTime();

        const result: (EventsData & { start_area: number; end_area: number })[] = [];

        for (const event of events) {
            const eventStartDate = DateUtils.parseServerDate(event.start_at);
            const eventEndDate = DateUtils.parseServerDate(event.end_at);

            const eventStart = eventStartDate.getTime();
            const eventEnd = eventEndDate.getTime();

            const isOverlap =
                eventStart < weekEnd && eventEnd > weekStart;

            if (!isOverlap) continue;

            const eventStartDay = new Date(
                eventStartDate.getFullYear(),
                eventStartDate.getMonth(),
                eventStartDate.getDate(),
                0, 0, 0, 0
            ).getTime();

            const rawStartArea = Math.floor(
                (eventStartDay - weekStart) / 86400000
            );

            const start_area = Math.min(GRID_COLS - 1, Math.max(0, rawStartArea));

            const isEventEndMidnight =
                eventEndDate.getHours() === 0 &&
                eventEndDate.getMinutes() === 0 &&
                eventEndDate.getSeconds() === 0 &&
                eventEndDate.getMilliseconds() === 0;

            const eventLastDay = new Date(
                eventEndDate.getFullYear(),
                eventEndDate.getMonth(),
                eventEndDate.getDate() - (isEventEndMidnight ? 1 : 0),
                0, 0, 0, 0
            ).getTime();

            const weekLastDay = new Date(
                lastDate.getFullYear(),
                lastDate.getMonth(),
                lastDate.getDate(),
                0, 0, 0, 0
            ).getTime();

            const rawEndArea = Math.floor(
                (weekLastDay - eventLastDay) / 86400000
            );

            const end_area = Math.min(GRID_COLS - 1, Math.max(0, rawEndArea));

            result.push({
                ...event,
                start_area,
                end_area
            });
        }

        return result;
    }, [ viewMode]);

    const calculateEventLayout = useCallback((events: (EventsData & { start_area: number; end_area: number })[]): EventWithLayout[] => {
        if (events.length === 0) return [];

        const GRID_COLS = viewMode === "week" ? 9 : 3;

        const rowOccupancy: boolean[][] = [];

        const layoutEvents: EventWithLayout[] = [];

        const sortedEvents = [...events].sort((a, b) => {
            if (a.start_area !== b.start_area) {
                return a.start_area - b.start_area;
            }
            return (
                (GRID_COLS - b.start_area - b.end_area) -
                (GRID_COLS - a.start_area - a.end_area)
            );
        });

        for (const event of sortedEvents) {
            const eventWidth = GRID_COLS - event.start_area - event.end_area;
            let placed = false;

            for (let row = 0; row < rowOccupancy.length; row++) {
                const rowData = rowOccupancy[row];
                if (!rowData) continue;

                let canPlace = true;

                for (
                    let col = event.start_area;
                    col < event.start_area + eventWidth;
                    col++
                ) {
                    if (rowData[col]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (
                        let col = event.start_area;
                        col < event.start_area + eventWidth;
                        col++
                    ) {
                        rowData[col] = true;
                    }

                    layoutEvents.push({
                        ...event,
                        row,
                        column: event.start_area
                    });

                    placed = true;
                    break;
                }
            }

            if (!placed) {
                // 새로운 행 생성
                const newRow = Array(GRID_COLS).fill(false);
                for (
                    let col = event.start_area;
                    col < event.start_area + eventWidth;
                    col++
                ) {
                    newRow[col] = true;
                }

                const newRowIndex = rowOccupancy.length;
                rowOccupancy.push(newRow);

                layoutEvents.push({
                    ...event,
                    row: newRowIndex,
                    column: event.start_area
                });
            }
        }

        return layoutEvents;
    }, [viewMode]);

    return(
        <div className="flex-1 flex flex-row overflow-hidden bg-white dark:bg-gray-950">
            <div className="w-[40px] sm:w-[70px] border-r border-gray-300 dark:border-gray-800 flex flex-col">
                <div className="min-h-[36px] lg:min-h-[32px] max-h-[36px] bg-white dark:bg-gray-950"></div>
                <div className="h-[100px] border-y-1 border-gray-300 dark:border-gray-800" />
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
                className="flex-1 overflow-y-hidden hidden-scroll overflow-x-auto snap-x snap-mandatory flex relative">

                {(() => {
                    const container = scrollRef.current;
                    if (!container) return null;

                    const firstDayCol = container.querySelector("[data-prentdate]") as HTMLElement | null;
                    if (!firstDayCol) return null;

                    const headerEl = firstDayCol.children[0] as HTMLElement | undefined; // 요일/날짜
                    const eventEl = firstDayCol.children[1] as HTMLElement | undefined;  // 100px 영역
                    const timeGridEl = firstDayCol.children[2] as HTMLElement | undefined; // 24h 그리드

                    const headerH = headerEl?.offsetHeight ?? 0;
                    const eventH = eventEl?.offsetHeight ?? 0;
                    const timeGridH = timeGridEl?.offsetHeight ?? 0;

                    const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
                    const percent = minutes / (24 * 60);

                    const top = headerH + eventH + (timeGridH * percent);

                    return (
                        <div
                            className={`z-[1] absolute left-0 ${viewMode === "week" ? "w-[calc((100%/7)*9)]" : "w-[calc((100%)*3)]"} h-[2px] bg-red-500/70 pointer-events-none flex justify-center items-center`}
                            style={{ top: `${top}px` }}>
                            <div className={`size-8 bg-red-500/70 rounded absolute ${viewMode === "week" ? "left-[calc(100%/9)]" : "left-[calc(100%/3)]"} z-[999] flex items-center justify-center`}>
                                <span className="text-[0.5rem] font-semibold text-white">
                                    {(now.getHours() > 9) ? now.getHours() : `0${now.getHours()}`}:
                                    {(now.getMinutes() > 9) ? now.getMinutes() : `0${now.getMinutes()}`}
                                </span>
                            </div>
                        </div>
                    );
                })()}

                <div className={`${viewMode === "week" ? "w-[calc((100%/7)*9)] bg-white dark:bg-gray-950 border-y border-gray-300 dark:border-gray-800 grid-cols-9" : "w-[calc((100%)*3)] grid-cols-3"} h-[100px] absolute left-0 top-[36px] lg:top-[32px] text-center overflow-x-hidden overflow-y-auto grid py-5`}>
                    {(() => {
                        const first = days[0];
                        const last = days[days.length - 1];
                        if (!first || !last) return null;

                        const firstDate = new Date(first.getFullYear(), first.getMonth(), first.getDate());
                        const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());

                        const rawIncludeEvents = findIncludeDate(firstDate, lastDate, events);
                        const includeEvents: EventWithLayout[] = calculateEventLayout(rawIncludeEvents);

                        return includeEvents.map((includeEvent) => {
                            const GRID_COLS = viewMode === "week" ? 9 : 3;
                            const span = Math.max(1, GRID_COLS - includeEvent.start_area - includeEvent.end_area);

                            let bodyColor = null;

                            switch (includeEvent.color) {
                                case "bg-red-500":
                                    bodyColor = "bg-red-500/40";
                                    break;
                                case "bg-orange-500":
                                    bodyColor = "bg-orange-500/40";
                                    break;
                                case "bg-yellow-500":
                                    bodyColor = "bg-yellow-500/40";
                                    break;
                                case "bg-green-500":
                                    bodyColor = "bg-green-500/40";
                                    break;
                                case "bg-blue-500":
                                    bodyColor = "bg-blue-500/40";
                                    break;
                                case "bg-purple-500":
                                    bodyColor = "bg-purple-500/40";
                                    break;
                                case "bg-gray-500":
                                    bodyColor = "bg-gray-500/40";
                                    break;
                            }

                            return (
                                <div
                                    data-event="true"
                                    key={includeEvent.uuid}
                                    className="pointer-events-auto relative h-[20px]"
                                    style={{
                                        gridRow: includeEvent.row + 1,
                                        gridColumn: `${includeEvent.start_area + 1} / span ${span}`,
                                        margin: '1px'
                                    }}
                                >
                                    <div
                                        onClick={async () => {
                                            if (handleEventClick) {
                                                await handleEventClick(includeEvent);
                                            }
                                        }}
                                        className={`h-full rounded overflow-hidden flex cursor-pointer transition-opacity hover:opacity-80`}
                                    >
                                        <div className={`w-[4px] ${includeEvent.color}`}></div>
                                        <div className={`${eventId === includeEvent.uuid ? includeEvent.color : bodyColor} flex-1 flex justify-start items-center`}>
                                            <p className={`text-xs pl-1 truncate select-none ${eventId === includeEvent.uuid ? "text-white" : "text-gray-950"}`}>{includeEvent.title}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>

                {days.map((day, index) => {
                    const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
                    const today = DateUtils.now();
                    const IsToday = (day.getFullYear() === today.getFullYear()) && (day.getMonth() === today.getMonth()) && (day.getDate() === today.getDate());
                    const isActiveDay = day.getFullYear() === activeAt.getFullYear()
                        && day.getMonth() === activeAt.getMonth()
                        && day.getDate() === activeDay;
                    return (
                        <div
                            data-prentdate={day}
                            key={day.getTime()}
                            className={`${viewMode === "week" ? "w-[calc(100%/7)]" : "w-[calc(100%)]"} h-full flex flex-col snap-start flex-shrink-0 ${
                                day.toDateString() === baseDate?.toDateString() ? "active" : ""
                            } ${index === 1 ? "first" : ""}`}
                        >
                            <div className="py-2 text-center text-sm bg-white dark:bg-gray-950 max-h-[36px] lg:max-h-[72px] user-select-none font-semibold normal-text flex flex-col items-center justify-center leading-tight">
                                <p className={`text-xs ${IsToday ? "today text-white" : isActiveDay ? "text-blue-600 dark:text-blue-300 font-semibold" : "text-gray-500"} flex flex-col lg:flex-row gap-1`}>
                                    <span className={`px-2 ${isActiveDay && !IsToday ? "bg-blue-500/10 rounded" : ""}`}>{WEEK_DAYS[day.getDay()]} {day.getDate()}</span>
                                </p>
                            </div>
                            <div className="h-[100px]"></div>
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
                                                            ? "bg-gray-100 dark:bg-[#0d1117]"
                                                            : "bg-gray-50 dark:bg-gray-950"
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
