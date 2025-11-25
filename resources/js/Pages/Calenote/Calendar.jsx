// 캘린더 영역
import CalendarTitleSection from "@/Pages/Calenote/Sections/Calendar/CalendarTitleSection.jsx";

import { Head, router } from '@inertiajs/react';
export default function Calendar({ auth }) {
    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <CalendarTitleSection />
            </div>
        </>
    );
}
