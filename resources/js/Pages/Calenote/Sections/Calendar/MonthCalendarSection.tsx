import {useState, useRef, useEffect, RefObject, useCallback} from "react";
import { Dispatch, SetStateAction } from "react";
import {CalendarAtData, EventReminderItem, ParticipantsData} from "../CalenoteSectionsData";
import {EventsData} from "../CalenoteSectionsData";

interface SideBarSectionProps {
    allDates: CalendarAtData[];
    setAllDates: Dispatch<SetStateAction<CalendarAtData[]>>;
    handleEventClick: (Event:EventsData) => Promise<void>;
    getActiveEventReminder: (eventUuid:string) => Promise<void>;
    setEventParticipants: Dispatch<SetStateAction<ParticipantsData[]>>;
    setEventReminder: Dispatch<SetStateAction<EventReminderItem[]>>;
    setEventIdChangeDone: Dispatch<SetStateAction<boolean>>;
    events: EventsData[];
    firstCenter: boolean;
    setFirstCenter: Dispatch<SetStateAction<boolean>>;
    eventId: string | null;
    setEventId: Dispatch<SetStateAction<string | null>>;
    setEventDescription: Dispatch<SetStateAction<string>>;
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
    setEventTitle: Dispatch<SetStateAction<string>>;
    isDragging: boolean;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    startAt: Date | null;
    setStartAt: Dispatch<SetStateAction<Date | null>>;
    endAt: Date | null;
    setEndAt: Dispatch<SetStateAction<Date | null>>;
    months: Date[];
    setMonths: Dispatch<SetStateAction<Date[]>>;
    sideBar: number;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>;
    now: Date;
    activeAt: Date;
    setActiveAt: Dispatch<SetStateAction<Date>>;
}

interface EventWithLayout extends EventsData {
    start_area: number;
    end_area: number;
    row: number;
    column: number;
}

export default function MonthCalendarSection({ allDates, setAllDates, handleEventClick, getActiveEventReminder, setEventParticipants, setEventReminder, setEventIdChangeDone, events, firstCenter, setFirstCenter, eventId, setEventId, setEventDescription,setEventColor, setEventTitle, isDragging, setIsDragging, months, setMonths, sideBar, activeAt, setActiveAt, viewMode, setViewMode, now, startAt, setStartAt, endAt, setEndAt }: SideBarSectionProps) {
    const scrollRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const createMonthDays = useCallback((date: Date, count: number): CalendarAtData[] => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();
        const TOTAL_CELLS = 42;

        const allDays: CalendarAtData[] = [];
        let dayCounter = 0;

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;

        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        for (let i = firstDayIndex; i > 0; i--) {
            const day = prevLastDay - i + 1;
            const weekIndex = (firstDayIndex - i) % 7;

            allDays.push({
                day,
                year: prevYear,
                month: prevMonth,
                isWeekend: weekIndex === 0 || weekIndex === 6,
                isActive: false,
                isCurrentMonth: false,
                isToday: false,
                count,
            });
            dayCounter++;
        }

        for (let i = 1; i <= lastDay; i++) {
            const weekIndex = dayCounter % 7;
            const isWeekend = weekIndex === 0 || weekIndex === 6;
            const isToday =
                now.getFullYear() === year &&
                now.getMonth() === month &&
                now.getDate() === i;

            allDays.push({
                day: i,
                year,
                month,
                isWeekend,
                isActive: count === 2,
                isCurrentMonth: true,
                isToday,
                count,
            });
            dayCounter++;
        }

        let nextMonthDay = 1;
        while (dayCounter < TOTAL_CELLS) {
            const weekIndex = dayCounter % 7;
            allDays.push({
                day: nextMonthDay,
                year: nextYear,
                month: nextMonth,
                isWeekend: weekIndex === 0 || weekIndex === 6,
                isActive: false,
                isCurrentMonth: false,
                isToday: false,
                count,
            });
            nextMonthDay++;
            dayCounter++;
        }

        return allDays;
    }, [now]);

    const handleScroll = useCallback(() => {
        if(!scrollRef.current || isScrolling) return;

        const container = scrollRef.current;
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        if (scrollTop <= 0) {
            setIsScrolling(true);

            setMonths(prev => {
                const first = prev[0];
                if (!first) return prev;

                const newCenter = new Date(first.getFullYear(), first.getMonth(), 1);
                setActiveAt(newCenter);

                return [
                    new Date(newCenter.getFullYear(), newCenter.getMonth() - 1, 1),
                    newCenter,
                    new Date(newCenter.getFullYear(), newCenter.getMonth() + 1, 1),
                ];
            });

            setTimeout(() => setIsScrolling(false), 300);
        } else if (scrollTop + clientHeight >= scrollHeight) {
            setIsScrolling(true);

            setMonths(prev => {
                const last = prev[2];
                if (!last) return prev;

                const newCenter = new Date(last.getFullYear(), last.getMonth(), 1);
                setActiveAt(newCenter);

                return [
                    new Date(newCenter.getFullYear(), newCenter.getMonth() - 1, 1),
                    newCenter,
                    new Date(newCenter.getFullYear(), newCenter.getMonth() + 1, 1),
                ];
            });

            setTimeout(() => setIsScrolling(false), 300);
        }

    }, [isScrolling]);

    const center = () => {
        const container = scrollRef.current;
        if (!container) return;

        const firstEl = container.querySelectorAll(".count-2")[0] as HTMLElement | null;

        if (!firstEl) return;

        firstEl.scrollIntoView({
            behavior: "auto",
            block: "start"
        });
    };


    useEffect(() => {
        requestAnimationFrame(() => { center(); });
    }, [isScrolling]);

    const firstCenterFn = () => {
        setIsScrolling(true);
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
                setIsScrolling(false);
            });
        }, 1);
    }

    useEffect(() => {
        firstCenterFn();
    }, []);

    useEffect(() => {
        if(!firstCenter) return;
        firstCenterFn();
        setFirstCenter(false);
    }, [firstCenter]);

    useEffect(() => {
        if (months.length <= 0) return;
        const nextDates = months.flatMap((m, index) => createMonthDays(m, index + 1));

        const merged = new Map<string, CalendarAtData>();
        for (const item of nextDates) {
            const key = `${item.year}-${item.month}-${item.day}`;
            const prev = merged.get(key);

            if (!prev) {
                merged.set(key, item);
                continue;
            }

            // Priority on overlap: center month(count=2) > current-month cell > today mark.
            const prevScore =
                (prev.count === 2 ? 100 : 0) +
                (prev.isCurrentMonth ? 10 : 0) +
                (prev.isToday ? 1 : 0);
            const itemScore =
                (item.count === 2 ? 100 : 0) +
                (item.isCurrentMonth ? 10 : 0) +
                (item.isToday ? 1 : 0);

            if (itemScore > prevScore) {
                merged.set(key, item);
            }
        }

        setAllDates(Array.from(merged.values()));
    }, [months, activeAt, createMonthDays]);

    const formatDate:(dayData: CalendarAtData) => Date | undefined = (dayData: CalendarAtData):Date | undefined => {
        if(!dayData.year || !dayData.day) return;

        return new Date(dayData.year, dayData.month, dayData.day);
    }

    const eventAtSetting = useCallback((date:Date | null): Date | null => {
        if(!date) return date;

        if(startAt && date < startAt) {
            setStartAt(new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate() + 1));
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        }

        return new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);
    }, [startAt]);

    const handleDateStart = useCallback((dayData: CalendarAtData): void => {
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

        const date = formatDate(dayData);
        if (!date) return;

        setStartAt(date);
        setEndAt(eventAtSetting(date));
    }, [startAt, isMobile, eventId]);

    const handleDateMove = useCallback((dayData: CalendarAtData): void => {
        if (!isDragging || isMobile) return;

        const date = formatDate(dayData);
        if (!date) return;

        setEndAt(eventAtSetting(date));
    }, [isDragging, isMobile]);

    const handleDateEnd = useCallback((dayData: CalendarAtData): void => {
        if (!isDragging || isMobile) return;

        const date = formatDate(dayData);
        if (!date) return;

        setEndAt(eventAtSetting(date));
        setIsDragging(false);
    }, [isDragging, isMobile]);

    const handleDateMoveOut = useCallback((e: MouseEvent, interval = false) => {
        if(!isDragging || !scrollRef.current || scrollRef.current.contains(e.target as Node)) return;

        const weeks = document.querySelectorAll('.week');

        weeks.forEach((week, index) => {
            const weekRect = week.getBoundingClientRect();

            if(weekRect.top <= e.clientY && weekRect.bottom >= e.clientY) {
                let weekX: number;
                if(e.clientX < weekRect.left) {
                    weekX = 0;
                } else {
                    weekX = 6;
                }

                const targetDiv = week.querySelectorAll<HTMLElement>('[data-date]')[weekX];
                if (!targetDiv) return;

                const date = targetDiv.dataset.date;
                if (!date) return;

                const [year, month, day] = date.split('-').map(Number);

                if (year !== undefined && month !== undefined && day !== undefined) {
                    const date = new Date(year, month, day);
                    setEndAt(eventAtSetting(date));
                }
            }
        });
    }, [isDragging]);

    useEffect(() => {
        document.addEventListener("mousemove", handleDateMoveOut);

        return () => document.removeEventListener("mousemove", handleDateMoveOut);
    }, [handleDateMoveOut]);

    const checkMobile = useCallback(() => {
        const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
        setIsMobile(isMobileViewport);
    }, []);

    useEffect(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, [checkMobile]);

    const isSameSelectedDay = (start: Date, end: Date) => {
        const startDay = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
        );

        const nextDay = new Date(
            startDay.getFullYear(),
            startDay.getMonth(),
            startDay.getDate() + 1,
            0, 0, 0, 0
        );

        return end.getTime() === nextDay.getTime();
    };

    const handleMobileDateClick = useCallback((dayData: CalendarAtData): void => {
        if (!isMobile) return;

        const dateStr = formatDate(dayData);
        if (!dateStr) return;

        if (!startAt) {
            setStartAt(dateStr);
            setEndAt(eventAtSetting(dateStr));
        } else if (!endAt || isSameSelectedDay(startAt, endAt)) {
            setEndAt(eventAtSetting(dateStr));
        } else {
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
        }
    }, [isMobile, startAt, endAt, eventId]);

    const intervalRef = useRef<any | null>(null);
    const directionRef = useRef<-1 | 0 | 1>(0);
    const lastMouseEvent = useRef<MouseEvent | null>(null);

    const startInterval = () => {
        if (intervalRef.current !== null) return;

        intervalRef.current = window.setInterval(() => {
            if (directionRef.current === 0) return;
            setIsScrolling(true);

            setMonths(prev => {
                const center = prev[1];
                if (!center) return prev;

                const next = new Date(
                    center.getFullYear(),
                    center.getMonth() + directionRef.current,
                    1
                );

                setActiveAt(next);

                return [
                    new Date(next.getFullYear(), next.getMonth() - 1, 1),
                    next,
                    new Date(next.getFullYear(), next.getMonth() + 1, 1),
                ];
            });

            requestAnimationFrame(center);

            setTimeout(() => {
                setIsScrolling(false);
                if (lastMouseEvent.current) {
                    handleDateMoveOut(lastMouseEvent.current, true);
                }
            }, 300);
        }, 1000);
    };

    const stopInterval = () => {
        directionRef.current = 0;
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        lastMouseEvent.current = e;

        if (!scrollRef.current || !isDragging) return;

        const rect = scrollRef.current.getBoundingClientRect();

        if (e.clientY + 5 < rect.top) {
            directionRef.current = -1;
            startInterval();
        } else if (e.clientY + 5 > rect.bottom) {
            directionRef.current = 1;
            console.log('asd')
            startInterval();
        } else {
            directionRef.current = 0;
            stopInterval();
        }

        handleDateMoveOut(e, true);
    }, [isDragging, handleDateMoveOut]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        stopInterval();
        lastMouseEvent.current = null;
    }, []);

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
        };
    }, [handleMouseMove, handleMouseUp]);

    const findIncludeDate = (
        firstDate: Date,
        lastDate: Date,
        events: EventsData[]
    ): (EventsData & { start_area: number; end_area: number })[] => {
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
            const eventStartDate = new Date(event.start_at);
            const eventEndDate = new Date(event.end_at);

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

            const start_area = Math.min(6, Math.max(0, rawStartArea));

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

            const end_area = Math.min(6, Math.max(0, rawEndArea));

            result.push({
                ...event,
                start_area,
                end_area
            });
        }

        return result;
    };

    const calculateEventLayout = (
        events: (EventsData & { start_area: number; end_area: number })[]
    ): EventWithLayout[] => {
        if (events.length === 0) return [];

        const MAX_ROWS = isMobile ? 2 : 5;

        const rowOccupancy: boolean[][] = Array.from(
            { length: MAX_ROWS },
            () => Array(7).fill(false)
        );

        const layoutEvents: EventWithLayout[] = [];

        const sortedEvents = [...events].sort((a, b) => {
            if (a.start_area !== b.start_area) {
                return a.start_area - b.start_area;
            }
            return (
                (7 - b.start_area - b.end_area) -
                (7 - a.start_area - a.end_area)
            );
        });

        for (const event of sortedEvents) {
            const eventWidth = 7 - event.start_area - event.end_area;
            let placed = false;

            for (let row = 0; row < MAX_ROWS; row++) {
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

            if (!placed) continue;
        }

        return layoutEvents;
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="py-2 grid grid-cols-7 text-xs text-gray-500 max-h-[36px]">
                {['일','월','화','수','목','금','토'].map((d) => (
                    <div key={d} className="font-semibold items-center user-select-none flex justify-center">{d}</div>
                ))}
            </div>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 hidden-scroll user-select-none overflow-x-hidden overflow-y-auto snap-y snap-mandatory"
            >
                <div className="flex flex-col"
                     style={{maxHeight: `${(scrollRef.current) && scrollRef.current.clientHeight}px`}}>
                    {(() => {
                        const weeks:CalendarAtData[] [] = [];
                        for (let i:number = 0; i < allDates.length; i += 7) {
                            weeks.push(allDates.slice(i, i + 7));
                        }
                        return (
                            weeks.map((week:CalendarAtData[], index:number) => {
                                const first = week[0];
                                const last = week[week.length - 1];
                                if (!first || !last) return;

                                const firstDate = new Date(first.year, first.month, first.day);
                                const lastDate = new Date(last.year, last.month, last.day);

                                const rawIncludeEvents = findIncludeDate(firstDate, lastDate, events);
                                const includeEvents: EventWithLayout[] = calculateEventLayout(rawIncludeEvents);

                                const cellHeight = scrollRef.current ? (scrollRef.current.clientHeight/6) : 0;
                                const paddingVertical = 20; // 상하 각 20px
                                const availableHeight = cellHeight - (paddingVertical * 2); // 40px 빼기
                                const maxRows = isMobile ? 2 : 5;
                                const eventRowHeight = (availableHeight / maxRows);

                                return (
                                    <div key={index} className="grid grid-cols-7 text-right flex-1 snap-start week relative">
                                        <div className="absolute w-full left-0 grid pointer-events-none"
                                             style={{
                                                 gridTemplateColumns: 'repeat(7, 1fr)',
                                                 gridTemplateRows: `repeat(${maxRows}, ${eventRowHeight}px)`,
                                                 height: `${availableHeight}px`,
                                                 top: `${paddingVertical}px` // 이 줄 추가
                                             }}>
                                            {includeEvents.map((includeEvent) => {
                                                const span = Math.max(1, 7 - includeEvent.start_area - includeEvent.end_area);

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
                                                        className="pointer-events-auto relative"
                                                        style={{
                                                            gridRow: includeEvent.row + 1,
                                                            gridColumn: `${includeEvent.start_area + 1} / span ${span}`,
                                                            margin: '1px'
                                                        }}>
                                                        <div
                                                            onClick={async () => {
                                                                await handleEventClick(includeEvent);
                                                            }}
                                                            className={`h-full rounded overflow-hidden flex cursor-pointer transition-opacity hover:opacity-80`}
                                                        >
                                                            <div className={`w-[4px] ${includeEvent.color}`}></div>
                                                            <div className={`${eventId === includeEvent.uuid ? includeEvent.color : bodyColor} flex-1 flex justify-start items-center`}>
                                                                <p className={`text-[0.5rem] md:text-xs pl-1 truncate ${eventId === includeEvent.uuid ? "text-white" : "text-gray-950"}`}>{includeEvent.title}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {week.map((dayData:CalendarAtData, i:number) => {
                                            const cellTime = new Date(
                                                dayData.year,
                                                dayData.month,
                                                dayData.day,
                                                0, 0, 0, 0
                                            ).getTime();

                                            const toStartOfDay = (date: Date) =>
                                                new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

                                            const startTime = startAt ? toStartOfDay(startAt) : null;
                                            const endTime = endAt ? toStartOfDay(endAt) : null;

                                            const minTime =
                                                startTime !== null && endTime !== null
                                                    ? Math.min(startTime, endTime)
                                                    : null;

                                            const maxTime =
                                                startTime !== null && endTime !== null
                                                    ? Math.max(startTime, endTime)
                                                    : null;

                                            const isEndAtMidnight =
                                                endAt &&
                                                endAt.getHours() === 0 &&
                                                endAt.getMinutes() === 0;

                                            const isSelected =
                                                minTime !== null &&
                                                maxTime !== null &&
                                                cellTime >= minTime &&
                                                (
                                                    isEndAtMidnight
                                                        ? cellTime < maxTime
                                                        : cellTime <= maxTime
                                                );

                                            return(
                                                <div
                                                    data-date={`${dayData.year}-${dayData.month}-${dayData.day}`}
                                                    onMouseDown={() => handleDateStart(dayData)}
                                                    onMouseUp={() => handleDateEnd(dayData)}
                                                    onMouseEnter={() => handleDateMove(dayData)}
                                                    onClick={() => handleMobileDateClick(dayData)}
                                                    style={{height: `${scrollRef.current && (scrollRef.current.clientHeight/6)+'px'}` }}
                                                    key={`${index}-${i}`} className={`border-[0.5px] ${(i === 0) ? "!border-l-transparent" : ""} ${(i === 6) ? "!border-r-transparent" : ""}
                                             ${isSelected ? "bg-blue-500/10" : (
                                                    dayData.isWeekend ? "bg-gray-100 dark:bg-[#0d1117]" : "bg-gray-50 dark:bg-gray-950"
                                                ) }
                                                count-${dayData.count} text-xs md:text-sm border-gray-200 dark:border-gray-800 cursor-pointer transition-colors ${dayData.isToday ? "today text-white font-semibold" : (dayData.isActive ? "normal-text font-semibold" : "text-gray-400 text-sm")} user-select-none`}
                                                >
                                                    {(dayData.day === 1) ?
                                                        <div className="flex justify-end">
                                                            <span className="px-2 hidden xl:block max-w-4/6">
                                                                {dayData.month+1}월 {dayData.day}
                                                            </span>
                                                            <span className="px-2 block xl:hidden">
                                                                {dayData.day}
                                                            </span>
                                                        </div>
                                                        :
                                                        <span className="px-2">{dayData.day}</span>
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
