import CalendarSection from "./MainCalendarSection/CalendarSection";
import CalendarControlSection from "./MainCalendarSection/CalendarControlSection";
import {Dispatch, SetStateAction} from "react";

interface SideBarSectionProps {
    sideBar: number;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>
}

export default function MainCalendarSection({ sideBar, viewMode, setViewMode }:SideBarSectionProps) {
    return (
        <div className="flex-1 flex flex-col gap-5">
            <CalendarControlSection viewMode={viewMode} setViewMode={setViewMode}/>
            <CalendarSection />
        </div>
    );
}
