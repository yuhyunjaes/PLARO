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

export interface EventsData {
    uuid: string;
    title: string;
    description: string;
    start_at: Date;
    end_at: Date;
    color: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    start_area? : number;
    end_area? : number;
}

export interface ReminderData {
    id: number;
    user_id: number;
    event_id: number;
    event_uuid: string;
    seconds: number;
    read: number;
    updated_at: string;
    created_at: string;
}

export interface ReminderEventsData {
    id: number;
    event_id: string;
    event_at: Date;
}

export interface EventUsersData {
    id: number;
    event_id: number;
    user_id: number;
    role: "owner" | "editor" | "viewer"
    updated_at: string;
    created_at: string;
}

export interface EventInvitationsData {
    id: number;
    event_id: number;
    inviter_id: number;
    email: string;
    role: "editor" | "viewer";
    token: string;
    status: "pending" | "declined" | "expired";
    expires_at: string;
    updated_at: string;
    created_at: string;
}

export interface ParticipantsData {
    user_name: string | null;
    user_id: number | null;
    invitation_id?: number;
    event_id: string;
    email: string;
    role: "owner" | "editor" | "viewer" | null;
    status: "pending" | "declined" | "expired" | null;
}
