import {useState, useRef, useEffect, RefObject, useCallback} from "react";
import MonthCreator from "./MonthCalendarSection/MonthCreator";
import { Dispatch, SetStateAction } from "react";
import {CalendarAtData} from "../CalenoteSectionsData";
import {EventsData} from "../CalenoteSectionsData";
import {router} from "@inertiajs/react";
import { useContext } from "react";
import {GlobalUIContext} from "../../../../Providers/GlobalUIContext";

interface SideBarSectionProps {
    handleEventClick: (Event:EventsData) => Promise<void>;
    getActiveEventReminder: (eventUuid:string) => Promise<void>;
    setEventReminder: Dispatch<SetStateAction<number[]>>;
    setEventIdChangeDone: Dispatch<SetStateAction<boolean>>;
    setIsHaveEvent: Dispatch<SetStateAction<boolean>>;
    events: EventsData[];
    IsHaveEvent: boolean;
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

export default function MonthCalendarSection({ handleEventClick, getActiveEventReminder, setEventReminder, setEventIdChangeDone, setIsHaveEvent, events, IsHaveEvent, firstCenter, setFirstCenter, eventId, setEventId, setEventDescription,setEventColor, setEventTitle, isDragging, setIsDragging, months, setMonths, sideBar, activeAt, setActiveAt, viewMode, setViewMode, now, startAt, setStartAt, endAt, setEndAt }: SideBarSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setLoading,
    } = ui;
    const [allDates, setAllDates] = useState<CalendarAtData[]>([]);

    const scrollRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const updateAllDates = useCallback(() => {
        if (allDates.length <= 0 || !now) return;

        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        const nowDate = now.getDate();

        setAllDates(prev =>
            prev.map(date => ({
                ...date,
                isToday: date.year === nowYear && date.month === nowMonth && date.day === nowDate
            }))
        );
    }, [allDates, now]);


    useEffect(() => {
        updateAllDates();
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
                setAllDates([]);

                return [
                    new Date(newCenter.getFullYear(), newCenter.getMonth() - 1, 1),
                    newCenter,
                    new Date(newCenter.getFullYear(), newCenter.getMonth() + 1, 1),
                ];
            });

            setTimeout(() => setIsScrolling(false), 300);
        } else if (scrollTop + clientHeight >= scrollHeight - 0.5) {
            setIsScrolling(true);

            setMonths(prev => {
                const last = prev[2];
                if (!last) return prev;

                const newCenter = new Date(last.getFullYear(), last.getMonth(), 1);
                setActiveAt(newCenter);
                setAllDates([]);

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
        if(!IsHaveEvent) return;
        setAllDates([]);
        setIsHaveEvent(false);
    }, [IsHaveEvent]);

    useEffect(() => {
        if(months.length <= 0) return;

        setAllDates((pre: CalendarAtData[]): CalendarAtData[] => {
            const map = new Map<string, CalendarAtData>();

            for (const item of pre) {
                const key = `${item.year}-${item.month}-${item.day}`;

                if (map.has(key)) {
                    const existing = map.get(key)!;

                    if (item.isToday) {
                        map.set(key, item);
                    }
                    else if (existing.isToday) {
                        // 유지
                    }
                    else if (!existing.isActive && item.isActive) {
                        map.set(key, item);
                    }
                } else {
                    map.set(key, item);
                }
            }

            return Array.from(map.values());
        });
    }, [months]);

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

    const handleDateMoveOut = useCallback((e: MouseEvent) => {
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

    const checkMobile = () => {
        setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    useEffect(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
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

            setAllDates([]);
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
                    handleDateMoveOut(lastMouseEvent.current);
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

        if (e.clientY < rect.top) {
            directionRef.current = -1;
            startInterval();
        } else if (e.clientY > rect.bottom) {
            directionRef.current = 1;
            startInterval();
        } else {
            directionRef.current = 0;
            stopInterval();
        }

        handleDateMoveOut(e);
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

        const MAX_ROWS = 5;

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
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="py-2 grid grid-cols-7 text-xs text-gray-500 max-h-[36px] bg-white dark:bg-gray-800">
                {['일','월','화','수','목','금','토'].map((d) => (
                    <div key={d} className="font-semibold items-center user-select-none flex justify-center">{d}</div>
                ))}
            </div>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 hidden-scroll user-select-none overflow-x-hidden overflow-y-auto snap-y snap-mandatory"
            >
                {(() => {
                    return months.map((m: Date, index: number) => {
                        return (
                            <MonthCreator
                                now={now}
                                key={index}
                                scrollRef={scrollRef}
                                count={index+1}
                                date={m}
                                activeAt={activeAt}
                                setAllDates={setAllDates}
                            />
                        );
                    });
                })()}
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
                                const eventRowHeight = (availableHeight / 5);

                                return (
                                    <div key={index} className="grid grid-cols-7 text-right flex-1 snap-start week relative">
                                        <div className="absolute w-full left-0 grid pointer-events-none"
                                             style={{
                                                 gridTemplateColumns: 'repeat(7, 1fr)',
                                                 gridTemplateRows: `repeat(5, ${eventRowHeight}px)`,
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
                                                        key={includeEvent.uuid}
                                                        className="pointer-events-auto relative"
                                                        style={{
                                                            gridRow: includeEvent.row + 1,
                                                            gridColumn: `${includeEvent.start_area + 1} / span ${span}`,
                                                            margin: '1px'
                                                        }}
                                                    >
                                                        <div
                                                            onClick={async () => {
                                                                await handleEventClick(includeEvent);
                                                            }}
                                                            className={`h-full rounded overflow-hidden flex cursor-pointer transition-opacity hover:opacity-80`}
                                                        >
                                                            <div className={`w-[4px] ${includeEvent.color}`}></div>
                                                            <div className={`${eventId === includeEvent.uuid ? includeEvent.color : bodyColor} flex-1 flex justify-start items-center`}>
                                                                <p className={`text-xs pl-1 truncate ${eventId === includeEvent.uuid ? "text-white" : "text-gray-950"}`}>{includeEvent.title}</p>
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
                                                    key={`${index}-${i}`} className={`border-[0.5px]
                                             ${isSelected ? "bg-blue-500/10" : (
                                                    dayData.isWeekend ? "bg-gray-50 dark:bg-[#0d1117]" : "bg-white dark:bg-gray-950"
                                                ) }
                                                count-${dayData.count} text-xs md:text-sm border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${dayData.isToday ? "today text-white font-semibold" : (dayData.isActive ? "normal-text font-semibold" : "text-gray-400 text-sm")} user-select-none`}
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
