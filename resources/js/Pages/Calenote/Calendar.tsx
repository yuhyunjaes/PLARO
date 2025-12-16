// 캘린더 영역
import SideBarSection from "./Sections/Calendar/SideBarSection";
import MonthCalendarSection from "./Sections/Calendar/MonthCalendarSection";
import { Head } from '@inertiajs/react';
import {AuthUser} from "../../Types/CalenoteTypes";
import {useCallback, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import CalendarControlSection from "./Sections/Calendar/CalendarSection/CalendarControlSection";
import WeekAndDayCalendarSection from "./Sections/Calendar/WeekAndDayCalendarSection";

interface CalendarProps {
    auth: {
        user: AuthUser | null;
    };
    mode: "month" | "week" | "day";
    year: number | null;
    month: number | null;
    day:  number | null;
}

export default function Calendar({ auth, mode, year, month, day } : CalendarProps) {
    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [mobileView, setMobileView] = useState<boolean>(():boolean => (window.innerWidth <= 640));

    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const At:Date = (year && month) ? new Date(year, month-1, 1) : today;
    const [activeAt, setActiveAt] = useState<Date>(At);
    const [activeDay, setActiveDay] = useState<number | null>(viewMode !== "month" ? day : null);

    const [months, setMonths] = useState<Date[]>([]);

    const handleResize = () => {
        setMobileView(window.innerWidth <= 640);
    }

    useEffect((): ()=> void => {
        window.addEventListener("resize", handleResize);
        handleResize();
        return ():void => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (!activeAt) return;

        setMonths([
            new Date(activeAt.getFullYear(), activeAt.getMonth() - 1, 1),
            new Date(activeAt.getFullYear(), activeAt.getMonth(), 1),
            new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 1),
        ]);
    }, [activeAt]);


    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
        const handleResize = () => {
            setSideBar(window.innerWidth <= 640 ? 0 : 250);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const eventAtUpdate = useCallback(() => {
        if(!startAt || !endAt || isDragging) return;

        if(startAt > endAt) {
            setStartAt(endAt);
            setEndAt(startAt)
        }

    }, [startAt, endAt, isDragging]);

    useEffect(() => {
        eventAtUpdate();
    }, [eventAtUpdate]);

    useEffect(() => {
        if (mode) {
            setViewMode(mode);
        }
    }, [mode]);

    useEffect(() => {
        if(viewMode !== "month") {
            setActiveDay(day);
        } else {
            setActiveDay(null);
        }
    }, [viewMode, day]);

    useEffect(() => {
        if(!activeAt || !viewMode || (viewMode !== "month" && !activeDay) || startAt) return;
        router.visit(`/calenote/calendar/${viewMode}/${activeAt.getFullYear()}/${activeAt.getMonth()+1}${(activeDay && viewMode !== 'month') ? ("/"+activeDay) : ""}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
    }, [activeAt, activeDay, viewMode, startAt]);


    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <div className="flex-1 flex px-5 gap-5 flex-row py-5">
                    <div className="flex-1 flex flex-col gap-5">
                        <CalendarControlSection setIsDragging={setIsDragging} startAt={startAt} activeAt={activeAt} setActiveAt={setActiveAt} viewMode={viewMode} setViewMode={setViewMode} activeDay={activeDay}/>
                        {
                            mode === "month" && (
                                <MonthCalendarSection isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} today={today} viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                            )
                        }
                        {
                            (mode === "week" || mode === "day") && (
                                <WeekAndDayCalendarSection mobileView={mobileView} viewMode={viewMode} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} activeAt={activeAt} setActiveAt={setActiveAt} activeDay={activeDay} setActiveDay={setActiveDay} />
                            )
                        }
                    </div>
                    <SideBarSection viewMode={viewMode} sideBar={sideBar} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                </div>
            </div>
        </>
    );
}
