import {useState, useRef, useEffect, RefObject, useCallback} from "react";
import CalendarSection from "./MainCalendarSection/CalendarSection";
import CalendarControlSection from "./MainCalendarSection/CalendarControlSection";
import { Dispatch, SetStateAction } from "react";
import {CalendarAtData} from "../CalenoteSectionsData";
import {data} from "autoprefixer";

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

export default function MainCalendarSection({ isDragging, setIsDragging, months, setMonths, sideBar, activeAt, setActiveAt, viewMode, setViewMode, today, startAt, setStartAt, endAt, setEndAt }: SideBarSectionProps) {
    const scrollRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [allDates, setAllDates] = useState<CalendarAtData[]>([]);

    const [isScrolling, setIsScrolling] = useState<boolean>(false);

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
                if(!first) return [...prev];
                const newMonth = new Date(first.getFullYear(), first.getMonth() - 1, 1);
                let updated = [newMonth, ...prev];
                if (updated.length > 3) {
                    updated.pop();
                }
                return updated;
            });
            setTimeout(() => setIsScrolling(false), 300);
        }
        else if (scrollTop + clientHeight >= scrollHeight) {
            setAllDates([]);
            setIsScrolling(true);
            setMonths(prev => {
                const last = prev[2];
                if (!last) return [...prev];
                const newMonth = new Date(last.getFullYear(), last.getMonth() + 1, 1);
                let updated = [...prev, newMonth];
                if (updated.length > 3) {
                    updated.shift();
                }
                return updated;
            });
            setTimeout(() => setIsScrolling(false), 300);
        }
    }, [isScrolling]);

    const center:()=>void = () => {
        const container = scrollRef.current;
        if (!container || !isScrolling) return;

        // first 요소 찾기
        const firstEl = container.querySelectorAll(".count-2")[0] as HTMLElement | null;
        if (!firstEl) return;

        // first 요소의 위치 정보
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

    useEffect(() => {
        if (months.length === 3) {
            const activeMonth:Date | undefined = months[1];
            if(activeMonth) {
                setActiveAt(activeMonth);
            }
        }

    }, [months]);

    const formatDate:(dayData: CalendarAtData) => Date | undefined = (dayData: CalendarAtData):Date | undefined => {
        if(!dayData.year || !dayData.day) return;


        return new Date(dayData.year, dayData.month, dayData.day);
    }

    const handleDateStart:(dayData: CalendarAtData) => void = useCallback((dayData: CalendarAtData):void => {
        if(startAt) {
            setStartAt(null);
            setEndAt(null);
            return;
        }
        setIsDragging(true);
        const dateStr:Date | undefined = formatDate(dayData);
        if(dateStr) {
            setStartAt(dateStr);
            setEndAt(dateStr);
        }
    }, [startAt]);

    const handleDateMove:(dayData: CalendarAtData) => void = (dayData: CalendarAtData):void => {
        if (!isDragging) return;
        const dateStr:Date | undefined = formatDate(dayData);
        if(dateStr) {
            setEndAt(dateStr);
        }
    }

    const handleDateEnd:(dayData: CalendarAtData) => void = (dayData: CalendarAtData):void => {
        if (!isDragging) return;

        const dateStr:Date | undefined = formatDate(dayData);
        if(dateStr) {
            setEndAt(dateStr);
            setIsDragging(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-5">
            <CalendarControlSection activeAt={activeAt} viewMode={viewMode} setViewMode={setViewMode}/>
            <div className="border border-gray-300 dark:border-gray-800 rounded flex-1 flex flex-col overflow-hidden">
                <div className="py-2 grid grid-cols-7 text-center text-sm bg-white dark:bg-gray-800">
                    {['일','월','화','수','목','금','토'].map((d) => (
                        <div key={d} className="font-bold normal-text items-center flex justify-center">{d}</div>
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
                                <CalendarSection
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
                    <div className="flex flex-col" style={{maxHeight: `${(scrollRef.current) && scrollRef.current.clientHeight}px`}}>
                        {(() => {
                            const weeks:CalendarAtData[] [] = [];
                            for (let i:number = 0; i < allDates.length; i += 7) {
                                weeks.push(allDates.slice(i, i + 7));
                            }

                            return (
                                weeks.map((week:CalendarAtData[], index:number) => (
                                    <div key={index} className="grid grid-cols-7 text-right flex-1 snap-start">
                                        {week.map((dayData:CalendarAtData, i:number) => (
                                            <div
                                                onMouseDown={() => handleDateStart(dayData)}
                                                onMouseUp={() => handleDateEnd(dayData)}
                                                onTouchStart={() => handleDateStart(dayData)}
                                                onTouchEnd={() => handleDateEnd(dayData)}

                                                onTouchMove={() => handleDateMove(dayData)}
                                                onMouseEnter={() => handleDateMove(dayData)}
                                                style={{height: `${scrollRef.current && (scrollRef.current.clientHeight/6)+'px'}` }}
                                                key={`${index}-${i}`} className={`border-[0.5px]
                                              ${(startAt && endAt) && (
                                                ((startAt <= new Date(dayData.year, dayData.month, dayData.day)) &&
                                                    (endAt >= new Date(dayData.year, dayData.month, dayData.day)) ||
                                                    (endAt <= new Date(dayData.year, dayData.month, dayData.day)) &&
                                                    (startAt >= new Date(dayData.year, dayData.month, dayData.day)))
                                            ) ? "bg-blue-500/10" : (
                                                dayData.isWeekend ? "bg-gray-200 dark:bg-[#0d1117]" : "bg-white"
                                            ) }
                                                 count-${dayData.count} border-gray-300 dark:border-gray-800 ${dayData.isActive ? "normal-text text-base" : "text-gray-700 text-sm"}`}
                                            >
                                                <p className="py-2">
                                                    <span className="px-2">{
                                                        (dayData.day === 1) ?
                                                            `${dayData.month+1}월 ${dayData.day}`
                                                            :
                                                            dayData.day
                                                    }</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
