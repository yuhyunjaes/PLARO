// 캘린더 영역
import CalendarTitleSection from "./Sections/Calendar/CalendarTitleSection";
import SideBarSection from "./Sections/Calendar/SideBarSection";
import MainCalendarSection from "./Sections/Calendar/MainCalendarSection";
import { Head } from '@inertiajs/react';
import {AuthUser} from "../../Types/CalenoteTypes";
import {useCallback, useEffect, useState} from "react";

interface CalendarProps {
    auth: {
        user: AuthUser | null;
    };
    mode: "month" | "week" | "day";
}
export default function Calendar({ auth, mode } : CalendarProps) {
    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [startAt, setStartAt] = useState<string>("");
    const [endAt, setEndAt] = useState<string>("");

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    useEffect(() => {
        if (mode) {
            setViewMode(mode);
        }
    }, [mode]);


    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <CalendarTitleSection />
                <div className="flex-1 flex px-5 gap-5 flex-row pb-5">
                    <MainCalendarSection viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                    <SideBarSection sideBar={sideBar} />
                </div>
            </div>
        </>
    );
}
