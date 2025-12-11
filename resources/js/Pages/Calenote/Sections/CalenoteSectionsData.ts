// CalenoteSectionsData.ts

// 각 섹션 객체 타입 정의
export interface CalenoteSection {
    title: string;
    link: string;
    icon: "faChartLine" | "faClipboard" | "faCalendar";
}


// 데이터 배열
export const CalenoteSectionsData: CalenoteSection[] = [
    {
        title: "대시보드",
        link: "/calenote",
        icon: "faChartLine",
    },
    {
        title: "메모장",
        link: "/calenote/notepad",
        icon: "faClipboard",
    },
    {
        title: "캘린더",
        link: "/calenote/calendar",
        icon: "faCalendar",
    },
];

export interface CalendarAtData {
    day: number;
    year: number;
    month: number;
    isWeekend: boolean;
    isActive: boolean;
    isCurrentMonth: boolean;
    count?: number;
    isToday?: boolean;
}
