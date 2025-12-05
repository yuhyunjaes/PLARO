// 캘린더 영역
import CalendarTitleSection from "./Sections/Calendar/CalendarTitleSection";
import SideBarSection from "./Sections/Calendar/SideBarSection";
import MonthCalendarSection from "./Sections/Calendar/MonthCalendarSection";
import { Head } from '@inertiajs/react';
import {AuthUser} from "../../Types/CalenoteTypes";
import {useCallback, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import CalendarControlSection from "./Sections/Calendar/CalendarSection/CalendarControlSection";
interface CalendarProps {
    auth: {
        user: AuthUser | null;
    };
    mode: "month" | "week" | "day";
    year: number | null;
    month: number | null;
}
export default function Calendar({ auth, mode, year, month } : CalendarProps) {
    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const At:Date = (year && month) ? new Date(year, month-1, 1) : today;
    const [activeAt, setActiveAt] = useState<Date>(today);
    const [months, setMonths] = useState<Date[]>([
        new Date(At.getFullYear(), At.getMonth() - 1, 1),
        At,
        new Date(At.getFullYear(), At.getMonth() + 1, 1),
    ]);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const eventAtUpdate = useCallback(() => {
        if(!startAt || !endAt || isDragging) return;

        if(startAt > endAt) {
            setStartAt(endAt);
            setEndAt(startAt)
        }

    }, [startAt, endAt, isDragging]);

    useEffect(() => {
        const handleResize = () => {
            setSideBar(window.innerWidth <= 640 ? 0 : 250);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        eventAtUpdate();
    }, [eventAtUpdate]);

    // useEffect(() => {
    //     if(!startAt || !endAt) return;
    //     console.log(`startAt: ${startAt.getFullYear()}-${startAt.getMonth()+1}-${startAt.getDate()},  endAt: ${endAt.getFullYear()}-${endAt.getMonth()+1}-${endAt.getDate()}`)
    // }, [startAt, endAt]);

    useEffect(() => {
        if (mode) {
            setViewMode(mode);
        }
    }, [mode]);

    useEffect(() => {
        if(!activeAt) return;
        router.visit(`/calenote/calendar/${viewMode}/${activeAt.getFullYear()}/${activeAt.getMonth()+1}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
    }, [activeAt]);


    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <CalendarTitleSection />
                <div className="flex-1 flex px-5 gap-5 flex-row pb-5">
                    <div className="flex-1 flex flex-col gap-5">
                        <CalendarControlSection activeAt={activeAt} viewMode={viewMode} setViewMode={setViewMode}/>
                        {
                            mode === "month" && (
                                <MonthCalendarSection isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} today={today} viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                            )
                        }
                    </div>
                    <SideBarSection sideBar={sideBar} />
                </div>
            </div>
        </>
    );
}
