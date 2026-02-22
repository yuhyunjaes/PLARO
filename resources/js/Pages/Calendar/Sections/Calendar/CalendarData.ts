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
    id: number;
    uuid: string;
    creator_id: number;
    challenge_id?: number | null;
    title: string;
    description: string;
    start_at: Date;
    end_at: Date;
    type: "normal" | "challenge" | "dday";
    status?: "active" | "completed" | "cancelled";
    color: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    updated_at?: string | null;
    lock_version?: number | null;
    ai_source_text?: string | null;
    ai_summary?: string | null;
    start_area?: number;
    end_area?: number;
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

export interface EventReminderItem {
    id: number | null;
    seconds: number;
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
    role: "owner" | "editor" | "viewer";
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

export interface ChallengeTemplateItem {
    id: number;
    uuid: string;
    owner_id: number | null;
    owner_name: string | null;
    title: string;
    description: string | null;
    icon: string | null;
    category: "routine" | "study" | "workout" | "custom";
    duration_days: number;
    visibility: "private" | "public" | "unlisted";
    is_system: boolean;
    is_active: boolean;
    liked: boolean;
    usage_count: number;
    like_count: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface ChallengeDayTaskItem {
    id: number;
    day_number: number;
    task_order: number;
    title: string;
    description: string | null;
    is_required: boolean;
    is_done: boolean;
    done_at: string | null;
}

export interface ChallengeDayGroupItem {
    day_number: number;
    tasks: ChallengeDayTaskItem[];
}

export interface ChallengeDailyLogItem {
    id: number;
    log_date: string;
    review_text: string | null;
    difficulty_score: number | null;
    updated_at: string | null;
}

export interface ActiveChallengeData {
    id: number;
    uuid: string;
    title: string;
    status: "active" | "paused" | "completed" | "cancelled";
    mode: "template" | "custom";
    current_day: number;
    unlocked_day: number;
    can_retry: boolean;
    extension_count: number;
    total_required_count: number;
    done_required_count: number;
    remaining_required_count: number;
    streak_count: number;
    achievement_rate: number;
    start_date: string | null;
    end_date: string | null;
    last_check_date: string | null;
    review: string | null;
    ai_summary: string | null;
    color: string | null;
    event_uuid: string | null;
    template: {
        uuid: string;
        title: string;
        icon: string | null;
        duration_days: number;
    } | null;
    days: ChallengeDayGroupItem[];
    daily_logs: ChallengeDailyLogItem[];
}

export interface DdayCheckItem {
    id: number;
    check_date: string;
    is_done: boolean;
    checked_at: string | null;
}

export interface ActiveDdayData {
    id: number;
    uuid: string;
    title: string | null;
    status: "active" | "completed" | "cancelled";
    start_date: string | null;
    target_date: string | null;
    duration_days: number;
    current_day: number;
    unlocked_day: number;
    checked_days: number;
    checked_until_today: number;
    elapsed_days: number;
    total_days: number;
    missed_days_count: number;
    streak_count: number;
    achievement_rate: number;
    can_retry: boolean;
    can_extend: boolean;
    last_check_date: string | null;
    color: string | null;
    event_uuid: string | null;
    checks: DdayCheckItem[];
}
