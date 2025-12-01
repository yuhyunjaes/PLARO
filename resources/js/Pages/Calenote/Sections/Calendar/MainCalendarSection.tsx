import { useState, useRef, useEffect, useCallback } from "react";
import CalendarSection from "./MainCalendarSection/CalendarSection";
import CalendarControlSection from "./MainCalendarSection/CalendarControlSection";
import { Dispatch, SetStateAction } from "react";

interface SideBarSectionProps {
    sideBar: number;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>
}

// 헬퍼: 쓰로틀링 유틸리티 함수
const throttle = (func: (...args: any[]) => void, limit: number) => {
    let inThrottle: boolean;
    return function (this: any, ...args: any[]) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export default function MainCalendarSection({ sideBar, viewMode, setViewMode }: SideBarSectionProps) {
    const today = new Date();

    // 순차적 초기화: [이전 달, 현재 달, 다음 달]
    const [months, setMonths] = useState<Date[]>([
        new Date(today.getFullYear(), today.getMonth() - 1, 1), // 이전 달
        today, // 현재 달
        new Date(today.getFullYear(), today.getMonth() + 1, 1), // 다음 달
    ]);

    const [isPrepended, setIsPrepended] = useState(false);
    const [activeMonth, setActiveMonth] = useState<Date>(today);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAdjusting = useRef(false);

    // 스크롤 처리: 위/아래 끝에서 무한 스크롤 (useCallback 적용)
    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;

        // 아래 끝 (10px 여유)
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setMonths(prev => {
                const last = prev[prev.length - 1]!;
                const next = new Date(last.getFullYear(), last.getMonth() + 1, 1);
                const newMonths = [...prev, next];
                // 맨 앞에서 제거 (가장 오래된 달 제거)
                if (newMonths.length > 5) newMonths.shift();
                return newMonths;
            });
        }

        // 위 끝 (10px 여유)
        if (scrollTop <= 10) {
            setMonths(prev => {
                const first = prev[0]!;
                const prevMonth = new Date(first.getFullYear(), first.getMonth() - 1, 1);

                const newMonths = [prevMonth, ...prev];

                // 맨 뒤에서 제거 (가장 새로운 달 제거)
                if (newMonths.length > 5) newMonths.pop();

                setIsPrepended(true);

                return newMonths;
            });
        }

    }, []);

    // 위로 스크롤 시 위치 조정 (점프 방지)
    useEffect(() => {
        if (isPrepended && scrollRef.current) {
            const container = scrollRef.current;
            isAdjusting.current = true;

            const firstChild = container.children[0] as HTMLElement;
            if (firstChild) {
                container.scrollTop += firstChild.offsetHeight;
            }

            setIsPrepended(false);

            setTimeout(() => {
                isAdjusting.current = false;
            }, 0);
        }
    }, [months, isPrepended]);

    // activeMonth 계산 로직 (useCallback 적용)
    const updateActiveMonth = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (isAdjusting.current) return;

        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const children = container.children;

        let closestChild: HTMLElement | null = null;
        let closestDistance = Infinity;
        const viewportCenter = scrollTop + clientHeight / 2;

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            const childMiddle = child.offsetTop + child.offsetHeight / 2;
            const distance = Math.abs(childMiddle - viewportCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestChild = child;
            }
        }

        if (closestChild) {
            const index = Array.from(children).indexOf(closestChild);
            const newActiveMonth = months[index];

            if (newActiveMonth) {
                setActiveMonth(prev => {
                    if (newActiveMonth.getTime() !== prev.getTime()) {
                        return newActiveMonth;
                    }
                    return prev;
                });
            }
        }
    }, [months]);

    // 스크롤 이벤트 리스너 설정 및 해제 (쓰로틀링 적용)
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const throttledUpdateActiveMonth = throttle(updateActiveMonth, 200);

        // 초기 렌더링 시 activeMonth 설정
        updateActiveMonth();

        container.addEventListener("scroll", throttledUpdateActiveMonth);

        return () => container.removeEventListener("scroll", throttledUpdateActiveMonth);
    }, [months, updateActiveMonth]);

    useEffect(() => {
        console.log(`Active Month: ${activeMonth.getFullYear()}-${activeMonth.getMonth() + 1}`);
    }, [activeMonth]);

    // 초기 렌더링 시 현재 달(두 번째 요소)로 스크롤
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const secondChild = container.children[1] as HTMLElement;
        if (secondChild) {
            container.scrollTop = secondChild.offsetTop;
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col gap-5">
            <CalendarControlSection viewMode={viewMode} setViewMode={setViewMode}/>
            <div className="border border-gray-800 rounded flex-1 flex flex-col overflow-hidden">
                <div className="py-2 grid grid-cols-7 text-center text-sm border border-b-gray-800">
                    {['일','월','화','수','목','금','토'].map((d) => (
                        <div key={d} className="font-bold normal-text items-center flex justify-center">{d}</div>
                    ))}
                </div>
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 hidden-scroll overflow-x-hidden overflow-y-auto max-h-[calc(105px*5)]"
                >
                    {months.map((m) => (
                        <CalendarSection
                            key={m.getTime()}
                            date={m}
                            active={m.getTime() === activeMonth.getTime()}
                            isNextOfActive={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
