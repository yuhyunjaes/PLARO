import {useState, useRef, useEffect, RefObject, useCallback} from "react";
import MonthCreator from "./CalendarSection/MonthCreator";
import { Dispatch, SetStateAction } from "react";
import {CalendarAtData} from "../CalenoteSectionsData";

interface SideBarSectionProps {
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
    today: Date;
    activeAt: Date;
    setActiveAt: Dispatch<SetStateAction<Date>>;
}

export default function MonthCalendarSection({ isDragging, setIsDragging, months, setMonths, sideBar, activeAt, setActiveAt, viewMode, setViewMode, today, startAt, setStartAt, endAt, setEndAt }: SideBarSectionProps) {
    const scrollRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [allDates, setAllDates] = useState<CalendarAtData[]>([]);

    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        console.log(`startAt${startAt?.getTime()} --------- endAt${endAt?.getTime()}`)
    }, [startAt, endAt]);

    const handleScroll = useCallback(() => {
        if(!scrollRef.current || isScrolling) return;

        const container = scrollRef.current;
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        if (scrollTop <= 0) {
            setAllDates([]);
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
        } else if (scrollTop + clientHeight >= scrollHeight - 0.5) {
            setAllDates([]);
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

    const center:()=>void = () => {
        const container = scrollRef.current;
        if (!container || !isScrolling) return;

        const firstEl = container.querySelectorAll(".count-2")[0] as HTMLElement | null;
        if (!firstEl) return;

        const rect = firstEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();


        container.scrollTop = rect.top - containerRect.top;
    };

    useEffect(() => { requestAnimationFrame(() => { center(); }); }, [isScrolling]);

    useEffect(() => {
        setIsScrolling(true);
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
                setIsScrolling(false);
            });
        }, 1);
    }, []);


    useEffect(() => {
        if(months.length <= 0) return;

        setAllDates((pre: CalendarAtData[]): CalendarAtData[] => {
            const map = new Map<string, CalendarAtData>();

            for (const item of pre) {
                const key = `${item.year}-${item.month}-${item.day}`;

                if (map.has(key)) {
                    const existing = map.get(key)!;
                    if (!existing.isActive && item.isActive) {
                        map.set(key, item);
                    }
                } else {
                    map.set(key, item);
                }
            }

            return pre
                .map(item => map.get(`${item.year}-${item.month}-${item.day}`)!)
                .filter((item, index, self) => self.indexOf(item) === index);
        });

    }, [months]);

    const formatDate:(dayData: CalendarAtData) => Date | undefined = (dayData: CalendarAtData):Date | undefined => {
        if(!dayData.year || !dayData.day) return;


        return new Date(dayData.year, dayData.month, dayData.day);
    }

    const toStartOfDay = (date: Date): Date =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

    const toEndOfDay = (date: Date): Date =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);


    const handleDateStart = useCallback((dayData: CalendarAtData): void => {
        if (isMobile) return;

        if (startAt) {
            setStartAt(null);
            setEndAt(null);
            return;
        }

        setIsDragging(true);

        const date = formatDate(dayData);
        if (!date) return;

        setStartAt(toStartOfDay(date));
        setEndAt(toEndOfDay(date));
    }, [startAt, isMobile]);

    const handleDateMove = useCallback((dayData: CalendarAtData): void => {
        if (!isDragging || isMobile) return;

        const date = formatDate(dayData);
        if (!date) return;

        setEndAt(toEndOfDay(date));
    }, [isDragging, isMobile]);


    const handleDateEnd = useCallback((dayData: CalendarAtData): void => {
        if (!isDragging || isMobile) return;

        const date = formatDate(dayData);
        if (!date) return;

        setEndAt(toEndOfDay(date));
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
                    setEndAt(toEndOfDay(date));
                }
            }
        });
    }, [isDragging]);

    useEffect(() => {
        document.addEventListener("mousemove", handleDateMoveOut);

        return () => document.removeEventListener("mousemove", handleDateMoveOut);
    }, [handleDateMoveOut]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const handleMobileDateClick = useCallback((dayData: CalendarAtData): void => {
        if (!isMobile) return;

        const dateStr = formatDate(dayData);
        if (!dateStr) return;

        if (!startAt) {
            setStartAt(toStartOfDay(dateStr));
            setEndAt(toEndOfDay(dateStr));
        } else if (!endAt || isSameDay(startAt, endAt)) {
            setEndAt(toEndOfDay(dateStr));
        } else {
            setStartAt(null);
            setEndAt(null);
        }
    }, [isMobile, startAt, endAt]);

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
                            weeks.map((week:CalendarAtData[], index:number) => (
                                <div key={index} className="grid grid-cols-7 text-right flex-1 snap-start week">
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

                                        const isSelected =
                                            minTime !== null &&
                                            maxTime !== null &&
                                            cellTime >= minTime &&
                                            cellTime <= maxTime;


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
                                                count-${dayData.count} border-gray-300 dark:border-gray-800 cursor-pointer transition-colors ${dayData.isToday ? "today text-white font-semibold text-sm md:text-base" : (dayData.isActive ? "normal-text text-sm md:text-base font-semibold" : "text-gray-400 text-sm")} user-select-none`}
                                            >
                                                {(dayData.day === 1) ?
                                                    <><span className="px-2 hidden xl:block">
                                                        {dayData.month+1}월 {dayData.day}
                                                </span><span className="px-2 block xl:hidden">
                                                        {dayData.day}
                                                    </span>
                                                    </>
                                                    :
                                                    <span className="px-2">{dayData.day}
                                                    </span>
                                                }
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
