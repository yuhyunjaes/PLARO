import {Dispatch, RefObject, SetStateAction, useEffect} from "react";
import {CalendarAtData} from "../../CalenoteSectionsData";

interface MonthCreatorProps {
    date: Date;
    scrollRef: RefObject<HTMLDivElement | null>;
    activeAt: Date;
    count: number;
    setAllDates: Dispatch<SetStateAction<CalendarAtData[]>>;
}

export default function MonthCreator({ date, scrollRef, activeAt, count, setAllDates }: MonthCreatorProps) {
    const today = new Date();

    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // 필요한 총 셀 수 계산 (5주 또는 6주)
    const totalDays = firstDayIndex + lastDay;
    const TOTAL_CELLS = totalDays > 35 ? 42 : 35;

    const allDays: CalendarAtData[] = [];
    let dayCounter = 0;

    // 이전 달의 년도와 월 계산
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    // 다음 달의 년도와 월 계산
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    // 1. 이전 달 날짜 채우기
    for (let i = firstDayIndex; i > 0; i--) {
        const day = prevLastDay - i + 1;
        const weekIndex = (firstDayIndex - i) % 7;

        allDays.push({
            day: day,
            year: prevYear,
            month: prevMonth,
            isWeekend: weekIndex === 0 || weekIndex === 6,
            isActive: false,
            isCurrentMonth: false,
        });
        dayCounter++;
    }

    // 2. 이번 달 날짜 채우기
    for (let i = 1; i <= lastDay; i++) {
        const weekIndex = dayCounter % 7;
        const isWeekend = weekIndex === 0 || weekIndex === 6;

        const isActive = (count === 2);

        const isToday = today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === i;

        allDays.push({
            day: i,
            year: year,
            month: month,
            isWeekend,
            isActive,
            isCurrentMonth: true,
            isToday,
            count:count
        });

        dayCounter++;
    }

    // 3. 다음 달 날짜 채우기
    let nextMonthDay = 1;
    while (dayCounter < TOTAL_CELLS) {
        const weekIndex = dayCounter % 7;
        const isWeekend = weekIndex === 0 || weekIndex === 6;

        allDays.push({
            day: nextMonthDay,
            year: nextYear,
            month: nextMonth,
            isWeekend,
            isActive: false,
            isCurrentMonth: false,
        });
        nextMonthDay++;
        dayCounter++;
    }

    useEffect(() => {
        setAllDates(prev => [...prev, ...allDays]);
    }, [year, month]);

    return(<></>);

    // 7개씩 묶어서 주 단위로 분리
    // const weeks = [];
    // for (let i = 0; i < allDays.length; i += 7) {
    //     weeks.push(allDays.slice(i, i + 7));
    // }


    // return (
    //     <div className="flex flex-col h-full">
    //         {weeks.map((week, weekIdx) => (
    //             <div
    //                 key={weekIdx}
    //                 className="grid grid-cols-7 text-sm text-right flex-1 snap-start">
    //                 {week.map((dayData, dayIdx) => {
    //                     const { day, isWeekend, isActive, isCurrentMonth, position } = dayData;
    //                     const textColorClass = isActive ? "normal-text" : "text-gray-400";
    //                     const dayBgClass = isWeekend && "bg-[#0d1117]";
    //
    //                     if(count === 1 && position === "bottom") {
    //                         return;
    //                     }
    //                     if((count === 2 && position === "top") || count === 2 && position === "bottom") {
    //                         return;
    //                     }
    //                     if(count === 3 && position === "top") {
    //                         return;
    //                     }
    //
    //                     return (
    //                         <div
    //                             key={`${day}-${dayIdx}-${weekIdx}`}
    //                             className={`border-[0.5px] border-gray-800 ${textColorClass} ${dayBgClass}`}
    //                         >
    //                             <p className="pt-2">
    //                                 <span className="p-2">{day}</span>
    //                             </p>
    //                         </div>
    //                     );
    //                 })}
    //             </div>
    //         ))}
    //     </div>
    // );
}
