import {Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

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

export default function WeekCalendarSection({
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

    // Ref로 최신 상태 유지
    const activeAtRef = useRef(activeAt);
    const activeDayRef = useRef(activeDay);

    useEffect(() => {
        activeAtRef.current = activeAt;
        activeDayRef.current = activeDay;
    }, [activeAt, activeDay]);

    // 날짜 배열 생성
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

    // 중앙 정렬
    const center = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const firstEl = container.querySelector(".first") as HTMLElement | null;
        if (!firstEl) return;

        container.scrollLeft = firstEl.offsetLeft;
    }, []);

    // 초기 중앙 정렬
    useEffect(() => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                center();
            });
        }, 1);
    }, [center]);

    // days 변경 시 중앙 정렬
    useEffect(() => {
        if (days.length > 0) {
            requestAnimationFrame(() => {
                center();
            });
        }
    }, [days, center]);

    // 스크롤 핸들러
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
    }, [activeAt, activeDay, isScrolling, setActiveAt, setActiveDay]);

    // 모바일 체크
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 드래그 시작
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
    }, [startAt, isMobile, setIsDragging, setStartAt, setEndAt]);

    // 드래그 중
    const handleDateMove = useCallback((e: any):void => {
        if (!isDragging || isMobile) return;
        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(dateStr);
    }, [isDragging, isMobile, setEndAt]);

    // 드래그 종료
    const handleDateEnd = useCallback((e: any) => {
        if (!isDragging || isMobile) return;

        const dateStr:Date | undefined = new Date(e.target.dataset.date);
        if(!dateStr) return;

        setEndAt(dateStr);
        setIsDragging(false);
    }, [isDragging, isMobile, setEndAt, setIsDragging]);

    // 모바일 클릭
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
    }, [isMobile, startAt, endAt, setStartAt, setEndAt]);

    // 드래그 중 스크롤 비활성화
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (isDragging) {
            container.style.overflowX = 'hidden';
        } else {
            container.style.overflowX = 'auto';
        }
    }, [isDragging]);

    // 영역 밖 드래그
    const handleDateMoveOut = useCallback((e: MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;

        const rect = scrollRef.current.getBoundingClientRect();
        const headerHeight = 36;

        // 수직 범위 체크
        if (
            e.clientY < rect.top + headerHeight ||
            e.clientY > rect.bottom
        ) return;

        let weekX: number;
        if (e.clientX < rect.left) {
            weekX = 0;
        } else if (e.clientX > rect.right) {
            weekX = 8;
        } else {
            return;
        }

        const targetDiv = document.querySelectorAll<HTMLElement>('[data-prentdate]')[weekX];
        if (!targetDiv) return;

        const hourParent = targetDiv.querySelectorAll<HTMLElement>('.hour');
        if(hourParent.length <= 0) return;

        const hour = hourParent[hourParent.length - 1];
        if(!hour) return;

        const minuteParent = hour.querySelectorAll<HTMLElement>('.minute');
        if(!minuteParent) return;

        const minute = minuteParent[minuteParent.length - 1];
        if(!minute?.dataset.date) return;

        const dateStr:Date | undefined = new Date(minute.dataset.date);
        if(!dateStr) return;

        setEndAt(dateStr);
    }, [isDragging, setEndAt]);

    // 인터벌 시작
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
    }, [center, handleDateMoveOut, setActiveAt, setActiveDay]);

    // 인터벌 중지
    const stopInterval = useCallback(() => {
        directionRef.current = 0;
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // 마우스 이동
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

    // 마우스 업
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        stopInterval();
        lastMouseEvent.current = null;
    }, [setIsDragging, stopInterval]);

    // 이벤트 리스너
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
        <div className="border border-gray-300 dark:border-gray-800 rounded-xl flex-1 flex flex-row overflow-hidden bg-white dark:bg-gray-800">
            <div className="w-[40px] sm:w-[70px] border-r border-gray-300 dark:border-gray-800 flex flex-col">
                <div className="h-[36px]"></div>
                <div className="flex-1 overflow-y-auto hidden-scroll">
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
                            className={`w-[calc(100%/7)] h-full flex flex-col snap-start flex-shrink-0 ${
                                day.toDateString() === baseDate?.toDateString() ? "active" : ""
                            } ${index === 0 ? "first" : ""}`}
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
                                        {Array.from({ length: 60 },(_, min) => {
                                            const year = day.getFullYear();
                                            const month = day.getMonth() + 1;
                                            const date = day.getDate();

                                            const yyyy = year;
                                            const mm = month < 10 ? `0${month}` : month;
                                            const dd = date < 10 ? `0${date}` : date;
                                            const hh = hour < 10 ? `0${hour}` : hour;
                                            const mi = min < 10 ? `0${min}` : min;

                                            const cellDateTime = new Date(
                                                year,
                                                day.getMonth(),
                                                date,
                                                hour,
                                                min
                                            ).getTime();

                                            const startDateTime = startAt ? startAt.getTime() : null;
                                            const endDateTime = endAt ? endAt.getTime() : null;

                                            const minTime = startDateTime !== null && endDateTime !== null
                                                ? Math.min(startDateTime, endDateTime)
                                                : null;

                                            const maxTime = startDateTime !== null && endDateTime !== null
                                                ? Math.max(startDateTime, endDateTime)
                                                : null;

                                            const isSelected =
                                                minTime !== null &&
                                                maxTime !== null &&
                                                cellDateTime >= minTime &&
                                                cellDateTime <= maxTime;

                                            return(
                                                <div
                                                    data-date={`${yyyy}-${mm}-${dd}T${hh}:${mi}`}
                                                    onDragStart={(e) => {e.preventDefault();}}
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
                                                            : "bg-white dark:bg-gray-950"
                                                    } minute`}
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
