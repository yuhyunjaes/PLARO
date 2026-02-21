// 캘린더 영역
import SideBarSection from "./Sections/Calendar/SideBarSection";
import ChallengeTemplateModal from "./Sections/Calendar/Challenge/ChallengeTemplateModal";
import ChallengeTemplateCreateModal, {
    ChallengeTemplateCreatePayload,
    ChallengeTemplateEditFormData
} from "./Sections/Calendar/Challenge/ChallengeTemplateCreateModal";
import MonthCalendarSection from "./Sections/Calendar/MonthCalendarSection";
import { Head } from '@inertiajs/react';
import {AuthUser} from "../../Types/CalenoteTypes";
import {Dispatch, RefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {router} from "@inertiajs/react";
import CalendarControlSection from "./Sections/Calendar/CalendarControlSection";
import WeekAndDayCalendarSection from "./Sections/Calendar/WeekAndDayCalendarSection";
import axios from "axios";
import {
    ActiveChallengeData,
    CalendarAtData, ChallengeTemplateItem,
    EventReminderItem,
    EventsData,
    ParticipantsData,
    ReminderData
} from "./Sections/CalenoteSectionsData";
import { useContext } from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight, faPlus} from "@fortawesome/free-solid-svg-icons";
import Echo from 'laravel-echo';
import {AlertsData} from "../../Components/Elements/ElementsData";
import Modal from "../../Components/Elements/Modal";
import {DateUtils} from "../../Utils/dateUtils";


interface CalendarProps {
    event: string | null;
    activeEvent?: EventsData | null;
    activeEventParticipants?: ParticipantsData[];
    activeEventReminder?: EventReminderItem[];
    auth: {
        user: AuthUser | null;
    };
    type: "normal" | "challenge" | "dday";
    mode: "month" | "week" | "day";
    year: number | null;
    month: number | null;
    day: number | null;
    setReminderEvents: Dispatch<SetStateAction<EventsData[]>>;
    reminders: ReminderData[];
    setReminders: Dispatch<SetStateAction<ReminderData[]>>;
    now: Date;
    setNow: Dispatch<SetStateAction<Date>>;
}

export default function Calendar({ event, activeEvent, activeEventParticipants, activeEventReminder, auth, type, mode, year, month, day, setReminderEvents, reminders, setReminders, now } : CalendarProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
        loading
    } = ui;

    const [challengeTemplateModal, setChallengeTemplateModal] = useState<{status: boolean, templateType: "mine" | "every" | null}>({status: false, templateType: null});
    const [challengeTemplateCreateModal, setChallengeTemplateCreateModal] = useState<boolean>(false);
    const [creatingTemplate, setCreatingTemplate] = useState<boolean>(false);
    const [templates, setTemplates] = useState<ChallengeTemplateItem[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<null | string>(null);
    const [activeChallenge, setActiveChallenge] = useState<ActiveChallengeData | null>(null);
    const [challengeLoading, setChallengeLoading] = useState<boolean>(false);
    const [challengeStarting, setChallengeStarting] = useState<boolean>(false);
    const [challengeTaskUpdating, setChallengeTaskUpdating] = useState<boolean>(false);
    const [challengeLogSaving, setChallengeLogSaving] = useState<boolean>(false);
    const [challengeRetrying, setChallengeRetrying] = useState<boolean>(false);
    const [challengeExtending, setChallengeExtending] = useState<boolean>(false);
    const [challengeDeleting, setChallengeDeleting] = useState<boolean>(false);
    const [challengeColorUpdating, setChallengeColorUpdating] = useState<boolean>(false);
    const [challengeAiSummarizing, setChallengeAiSummarizing] = useState<boolean>(false);
    const [challengeAiSummary, setChallengeAiSummary] = useState<string>("");
    const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
    const [templatesError, setTemplatesError] = useState<string>("");
    const [editingTemplate, setEditingTemplate] = useState<ChallengeTemplateEditFormData | null>(null);
    const [templateDeleteTarget, setTemplateDeleteTarget] = useState<ChallengeTemplateItem | null>(null);
    const [templateDaysReloadKey, setTemplateDaysReloadKey] = useState<number>(0);
    const sortTemplates = useCallback((list: ChallengeTemplateItem[]) => {
        return [...list].sort((a, b) => {
            if (Number(b.liked) !== Number(a.liked)) return Number(b.liked) - Number(a.liked);
            if (b.like_count !== a.like_count) return b.like_count - a.like_count;
            if (b.usage_count !== a.usage_count) return b.usage_count - a.usage_count;
            return a.title.localeCompare(b.title);
        });
    }, []);

    const [contentMode, setContentMode] = useState<"normal" | "challenge" | "dday">(type ?? "normal");
    const [events, setEvents] = useState<EventsData[]>([]);
    const setEventsWithReminder = useCallback((updater: SetStateAction<EventsData[]>) => {
        setEvents(updater);
        setReminderEvents(updater);
    }, []);
    const sideBarToggleRef:RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);

    const [modal, setModal] = useState<boolean>(false);
    const [modalTitle, setModalTitle] = useState<string>("");
    const [modalMessage, setModalMessage] = useState<string>("");
    const [modalType, setModalType] = useState<"" | "delete" | "removeUser" | "deleteChallenge" | "deleteTemplate">("");

    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth < 768 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    const [temporaryYear, setTemporaryYear] = useState<number | null>(year);
    const [temporaryMonth, setTemporaryMonth] = useState<number | null>(month);
    const [temporaryDay, setTemporaryDay] = useState<number | null>(day);

    const nowByTz = DateUtils.now();
    const today = new Date(nowByTz.getFullYear(), nowByTz.getMonth(), 1);
    const At:Date = (temporaryYear && temporaryMonth) ? new Date(temporaryYear, temporaryMonth-1, 1) : today;
    const [activeAt, setActiveAt] = useState<Date>(At);

    const [activeDay, setActiveDay] = useState<number | null>(viewMode !== "month" ? temporaryDay : null);
    const [allDates, setAllDates] = useState<CalendarAtData[]>([]);
    const challengeColorSyncRef = useRef<string | null>(null);

    useEffect(() => {
        if (viewMode !== "month" && temporaryDay) {
            setActiveDay(temporaryDay);
        } else if (viewMode === "month") {
            setActiveDay(null);
        }
    }, [temporaryDay, viewMode]);

    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [months, setMonths] = useState<Date[]>([
        new Date(At.getFullYear(), At.getMonth() - 1, 1),
        new Date(At.getFullYear(), At.getMonth(), 1),
        new Date(At.getFullYear(), At.getMonth() + 1, 1),
    ]);

    const [eventTitle, setEventTitle] = useState<string>("");
    const [eventDescription, setEventDescription] = useState<string>("");
    const [eventColor, setEventColor] = useState<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">("bg-blue-500");
    const [eventReminder, setEventReminder] = useState<EventReminderItem[]>([]);
    const [participantControl, setParticipantControl] = useState<string>("");
    const [eventParticipants, setEventParticipants] = useState<ParticipantsData[]>([]);
    const [onlineParticipantIds, setOnlineParticipantIds] = useState<number[]>([]);

    const [eventId, setEventId] = useState<string | null>(event ? event : null);

    const [eventIdChangeDone, setEventIdChangeDone] = useState<boolean>(true);

    useEffect(() => {
        DateUtils.setUserTimezone(auth?.user?.timezone);
    }, [auth?.user?.timezone]);

    useEffect(() => {
        if(event) {
            setEventIdChangeDone(true);
        }
    }, [event]);

    const fetchChallengeByEvent = useCallback(async (eventUuid: string): Promise<void> => {
        if (!eventUuid) return;
        setChallengeLoading(true);

        try {
            const res = await axios.get(`/api/challenges/event/${eventUuid}`);
            if (res.data?.success) {
                const challenge = res.data.challenge as ActiveChallengeData;
                setActiveChallenge(challenge);
                setChallengeAiSummary(challenge.ai_summary ?? "");
                challengeColorSyncRef.current = challenge?.color ?? null;
            } else {
                setActiveChallenge(null);
                setChallengeAiSummary("");
                challengeColorSyncRef.current = null;
            }
        } catch (e) {
            setActiveChallenge(null);
            setChallengeAiSummary("");
            challengeColorSyncRef.current = null;
        } finally {
            setChallengeLoading(false);
        }
    }, []);

    const saveEvent: () => Promise<string | undefined> = useCallback(async () => {
        if (!startAt || !endAt || !eventColor || eventId) return;

        const res = await axios.post("/api/events", {
            eventSwitch: "normal",
            type: contentMode,
            title: eventTitle,
            start_at: DateUtils.toApiDateTime(startAt),
            end_at: DateUtils.toApiDateTime(endAt),
            description: eventDescription,
            color: eventColor,
        });

        if (!res.data.success) {
            const alertData:AlertsData = {
                id: new Date(),
                message: res.data.message,
                type: res.data.type
            }
            setAlerts(pre => [...pre, alertData]);
            return;
        }

        const event = {
            ...res.data.event,
            start_at: DateUtils.parseServerDate(res.data.event.start_at),
            end_at: DateUtils.parseServerDate(res.data.event.end_at),
        };

        setEventsWithReminder(pre => [...pre, event]);

        if (eventReminder.length > 0 && event.uuid) {
            for (const reminder of eventReminder) {
                await addEventReminderBySecond(event.uuid, reminder.seconds);
            }
            await getActiveEventReminder(event.uuid);
        }

        const participantsData:ParticipantsData = {
            user_name: auth.user!.name,
            user_id: auth.user!.id,
            event_id: event.uuid,
            email: auth.user!.email,
            role: "owner",
            status: null
        }

        setEventParticipants([participantsData]);

        router.visit(`/calenote/calendar/${contentMode[0]}/${event.uuid}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
        setEventId(event.uuid);

        return event.uuid;
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventReminder, contentMode, setEventsWithReminder]);

    const addEventReminderBySecond = useCallback(async (eventUuid: string, seconds: number): Promise<void> => {
        if (!eventUuid) return;

        try {
            const res = await axios.post(`/api/event/${eventUuid}/reminders`, {
                seconds,
            });

            if (!res.data.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const created = res.data.reminder as ReminderData;

            setEventReminder(prev => {
                const withoutSecond = prev.filter(item => item.seconds !== seconds);
                return [...withoutSecond, { id: created.id, seconds: created.seconds }];
            });

            setReminders(prev => {
                const exists = prev.some(item => item.id === created.id);
                return exists ? prev : [...prev, created];
            });
        } catch (err) {
            console.error(err);
        }
    }, []);

    const addEventReminder = useCallback(async (seconds: number): Promise<void> => {
        if (eventReminder.some(item => item.seconds === seconds)) return;

        if (!eventId) {
            setEventReminder(prev => [...prev, { id: null, seconds }]);
            return;
        }

        await addEventReminderBySecond(eventId, seconds);
    }, [eventReminder, eventId, addEventReminderBySecond]);

    const removeEventReminder = useCallback(async (reminder: EventReminderItem): Promise<void> => {
        if (!reminder.id) {
            setEventReminder(prev => prev.filter(item => item.seconds !== reminder.seconds));
            return;
        }

        try {
            const res = await axios.delete(`/api/event/reminders/${reminder.id}`);
            if (!res.data.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setEventReminder(prev => prev.filter(item => item.id !== reminder.id));
            setReminders(prev => prev.filter(item => item.id !== reminder.id));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const [isRemoteUpdate, setIsRemoteUpdate] = useState<boolean>(false);

    const updateEvent:()=>Promise<void> = useCallback(async ():Promise<void> => {
        if(!startAt || !endAt || !eventColor || !eventId) return;

        if(!eventIdChangeDone) {
            setEventIdChangeDone(true);
            return;
        }

        // 원격 업데이트인 경우 서버로 전송하지 않음
        if(isRemoteUpdate) {
            setIsRemoteUpdate(false);
            return;
        }

        try {
            const res = await axios.put(`/api/events/${eventId}`, {
                title: eventTitle,
                start_at: DateUtils.toApiDateTime(startAt),
                end_at: DateUtils.toApiDateTime(endAt),
                description: eventDescription,
                color: eventColor,
            });

            if (res.data.success) {
                setEventsWithReminder(pre =>
                    pre.map(event =>
                        event.uuid === eventId
                            ? {
                                ...event,
                                title: eventTitle,
                                start_at: startAt,
                                end_at: endAt,
                                description: eventDescription,
                                color: eventColor
                            }
                            : event
                    )
                );
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventIdChangeDone, isRemoteUpdate, setEventsWithReminder]);

    useEffect(() => {
        if (!isDragging) {
            updateEvent();
        }
    }, [eventColor, startAt, endAt, isDragging]);

    const deleteEvent = useCallback(async ():Promise<void> => {
        if(!eventId) return;

        try {
            const res = await axios.delete(`/api/events/${eventId}`);
            if(res.data.success) {

                setReminders(pre => pre.filter(item => item.event_uuid !== eventId));

                setEventsWithReminder(pre => pre.filter(item => item.uuid !== eventId));
                resetEvent();

            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventId, setEventsWithReminder]);

    const [firstCenter, setFirstCenter] = useState<boolean>(false);
    const [getDone, setGetDone] = useState<boolean>(false);

    // Calendar 컴포넌트에서 getEvent 함수 수정

    const getActiveEvent:()=>Promise<void> = async ():Promise<void> => {
        if(!event) {
            setGetDone(true);
            return;
        }

        if (activeEvent && activeEvent.uuid === event) {
            if (activeEventReminder) {
                setEventReminder(activeEventReminder);
            } else {
                await getActiveEventReminder(activeEvent.uuid);
            }

            if (activeEventParticipants) {
                setEventParticipants(activeEventParticipants);
            } else {
                await getActiveEventParticipants(activeEvent.uuid);
            }

            setEventTitle(activeEvent.title);
            const resStartAt = DateUtils.parseServerDate(activeEvent.start_at);

            const newActiveAt = new Date(resStartAt.getFullYear(), resStartAt.getMonth(), 1);
            const IsSameActiveAt:boolean = newActiveAt.getTime() !== At.getTime();

            if (IsSameActiveAt) {
                setActiveAt(newActiveAt);
            }

            setStartAt(resStartAt);
            setEndAt(DateUtils.parseServerDate(activeEvent.end_at));
            setEventDescription(activeEvent.description);
            setEventColor(activeEvent.color);
            if (activeEvent.type === "challenge") {
                await fetchChallengeByEvent(activeEvent.uuid);
            } else {
                setActiveChallenge(null);
            }

            if (IsSameActiveAt) {
                setFirstCenter(true);
            }

            setGetDone(true);
            return;
        }

        setLoading(true);

        try {
            const res = await axios.get(`/api/events/${event}`);
            if(res.data.success) {
                const activeEvent = res.data.event;
                if(!activeEvent) return;

                await getActiveEventReminder(activeEvent.uuid);
                await getActiveEventParticipants(activeEvent.uuid);

                setEventTitle(activeEvent.title);
                const resStartAt = DateUtils.parseServerDate(activeEvent.start_at);

                // startAt의 달을 기준으로 activeAt을 설정
                const newActiveAt = new Date(resStartAt.getFullYear(), resStartAt.getMonth(), 1);

                const IsSameActiveAt:boolean = newActiveAt.getTime() !== At.getTime();

                if(IsSameActiveAt) {
                    setActiveAt(newActiveAt);
                }

                setStartAt(resStartAt);
                setEndAt(DateUtils.parseServerDate(activeEvent.end_at));
                setEventDescription(activeEvent.description);
                setEventColor(activeEvent.color);
                if (activeEvent.type === "challenge") {
                    await fetchChallengeByEvent(activeEvent.uuid);
                } else {
                    setActiveChallenge(null);
                }

                // firstCenter를 true로 설정하여 MonthCalendarSection에서 center() 호출
                if(IsSameActiveAt) {
                    setFirstCenter(true);
                }
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
                router.visit(`/calenote/calendar`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => {setGetDone(true);}, 1);
            setLoading(false);
        }
    }

    const getActiveEventReminder:(eventUuid:string) => Promise<void> = async (eventUuid:string):Promise<void> => {
        if(!eventUuid) return;
        try {
            const res = await axios.get(`/api/event/${eventUuid}/reminders`);
            if(res.data.success) {
                const remindersData = (res.data.reminders as Array<{ id: number; seconds: number }>).map(item => ({
                    id: item.id,
                    seconds: item.seconds
                }));
                setEventReminder(remindersData);
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getActiveEventParticipants:(eventUuid:string) => Promise<void> = async (eventUuid:string):Promise<void> => {
        if(!eventUuid) return;
        try {
            const res = await axios.get(`/api/event/${eventUuid}/participants`);
            if(res.data.success) {
                setEventParticipants(res.data.participants);
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getEventsByType = useCallback(async (targetType: "normal" | "challenge" | "dday"): Promise<void> => {
        try {
            const res = await axios.get("/api/events", {
                params: { type: targetType }
            });

            if (res.data.success) {
                const normalizedEvents = (res.data.events || []).map((event: EventsData) => ({
                    ...event,
                    start_at: DateUtils.parseServerDate(event.start_at),
                    end_at: DateUtils.parseServerDate(event.end_at),
                }));
                setEvents(normalizedEvents);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getActiveEvent();
    }, []);

    useEffect(() => {
        getEventsByType(contentMode);
    }, [contentMode, getEventsByType]);

    const updateEventReminderReadReset = useCallback(async () => {
        if(!eventId || !eventIdChangeDone || !getDone) return;

        try {
            const res = await axios.put(`/api/event/${eventId}/reminders`);
            if(res.data.success) {
                setReminders(prev =>
                        prev.map(pre => pre.event_uuid === eventId
                                ? { ...pre, read: 0 }
                                : pre
                        )
                );
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventId, eventIdChangeDone, getDone]);

    useEffect(() => {
        if(!startAt || !endAt) return;
        updateEventReminderReadReset();
    }, [startAt, endAt]);

    useEffect(() => {
        if (!eventId || !getDone) return;

        if (!startAt && !endAt) {
            resetEvent();
        }
    }, [eventId, startAt, endAt, getDone]);

    useEffect(() => {
        if (!activeAt) return;
        setMonths([
            new Date(activeAt.getFullYear(), activeAt.getMonth() - 1, 1),
            new Date(activeAt.getFullYear(), activeAt.getMonth(), 1),
            new Date(activeAt.getFullYear(), activeAt.getMonth() + 1, 1),
        ]);
    }, [activeAt]);

    useEffect(() => {
        const handleResize = () => {
            setSideBar(window.innerWidth < 768 ? 0 : 250);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [eventAtUpdateDone, setEventAtUpdateDone] = useState<boolean>(false);

    const eventAtUpdate = useCallback(() => {
        if(!startAt || !endAt || isDragging) return;
        if(startAt.getTime() > endAt.getTime()) {
            setEventAtUpdateDone(true);
            setStartAt(endAt);
            setEndAt(startAt);
        }

    }, [startAt, endAt, isDragging]);

    const [overDate, setOverDate] = useState<boolean>(false);

    useEffect(() => {
        if (!startAt || !endAt) return;

        setOverDate(startAt.getTime() > endAt.getTime());
    }, [startAt, endAt]);

    const sliceStartAtUpdate = useCallback(() => {
        if(eventAtUpdateDone) {
            setEventAtUpdateDone(false);
            setOverDate(false);
            return;
        }
        if(!overDate || !startAt || !endAt) return;

        if (startAt.getTime() <= endAt.getTime()) {
            const sliceStartAt = new Date(startAt.getTime());
            viewMode === "month" ? sliceStartAt.setDate(sliceStartAt.getDate() - 1) : sliceStartAt.setMinutes(sliceStartAt.getMinutes() - 15);

            setStartAt(sliceStartAt);

            setOverDate(false);
        }
    }, [overDate, startAt, endAt, viewMode, eventAtUpdateDone])

    useEffect(() => {
        sliceStartAtUpdate();
    }, [overDate, startAt, endAt, viewMode]);

    useEffect(() => {
        eventAtUpdate();
    }, [eventAtUpdate]);

    useEffect(() => {
        if (mode) {
            setViewMode(mode);
        }
    }, [mode]);

    const handleEventClick = useCallback(async (Event: EventsData) => {
        if (Event.uuid === eventId) return;

        setLoading(true);
        setEventIdChangeDone(false);

        try {
            const startAt = DateUtils.parseServerDate(Event.start_at);
            if (isNaN(startAt.getTime())) return;

            const usuallyActiveAt = new Date(activeAt.getFullYear(), activeAt.getMonth(), 1);
            const startAtActiveAt = new Date(startAt.getFullYear(), startAt.getMonth(), 1);

            if(usuallyActiveAt.getTime() !== startAtActiveAt.getTime()) {
                setActiveAt(new Date(startAt.getFullYear(), startAt.getMonth(), 1));


                if(viewMode === "month") {
                    setFirstCenter(true);
                }
            }

            if(viewMode !== "month") {
                setActiveDay(startAt.getDate());
            }

            await getActiveEventReminder(Event.uuid);
            await getActiveEventParticipants(Event.uuid);

            setParticipantControl("");
            setEventId(Event.uuid);
            setEventTitle(Event.title);
            setEventDescription(Event.description);
            setEventColor(Event.color);
            setStartAt(startAt);
            setEndAt(DateUtils.parseServerDate(Event.end_at));
            if (Event.type === "challenge") {
                await fetchChallengeByEvent(Event.uuid);
            } else {
                setActiveChallenge(null);
            }

            router.visit(`/calenote/calendar/${contentMode[0]}/${Event.uuid}`, {
                method: "get",
                preserveState: true,
                preserveScroll: true,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [viewMode, activeAt, eventId, contentMode, fetchChallengeByEvent]);

    useEffect(() => {
        if (!window.Echo || !getDone || events.length <= 0 || contentMode !== "normal") return;

        const channel = window.Echo.private(`user.${auth.user?.id}.events`);

        const handleEventUpdated = (data: any) => {
            const { event, update_by } = data.payload;

            if (update_by === auth.user?.id) return;

            // 원격 업데이트 플래그
            setIsRemoteUpdate(true);

            // 현재 보고 있는 이벤트라면 상세 동기화
            if (event.uuid === eventId) {
                setEventTitle(event.title);
                setEventDescription(event.description);
                setEventColor(event.color);
                setStartAt(DateUtils.parseServerDate(event.start_at));
                setEndAt(DateUtils.parseServerDate(event.end_at));
            }

            // 전체 이벤트 목록 동기화
            setEventsWithReminder(prev =>
                prev.map(e =>
                    e.uuid === event.uuid
                        ? {
                            ...e,
                            title: event.title,
                            description: event.description,
                            start_at: DateUtils.parseServerDate(event.start_at),
                            end_at: DateUtils.parseServerDate(event.end_at),
                            color: event.color,
                            start_area: e.start_area,
                            end_area: e.end_area,
                        }
                        : e
                )
            );
        };

        const handleEventDeleted = (data: any) => {
            const { event_uuid, delete_by } = data;

            if (delete_by === auth.user?.id) return;

            setEventsWithReminder(prev =>
                prev.filter(e => e.uuid !== event_uuid)
            );

            // 현재 보고 있는 이벤트가 삭제된 경우
            if (eventId === event_uuid) {
                resetEvent();

                const alertData:AlertsData = {
                    id: new Date(),
                    message: "해당 이벤트가 삭제되었습니다.",
                    type: "warning"
                }
                setAlerts(pre => [...pre, alertData]);
            }
        };

        channel.listen('.event.updated', handleEventUpdated);
        channel.listen('.event.deleted', handleEventDeleted);

        return () => {
            channel.stopListening('.event.updated');
            channel.stopListening('.event.deleted');
            window.Echo.leave(`user.${auth.user?.id}.events`);
        };
    }, [getDone, eventId, auth.user?.id, events, setEventsWithReminder, contentMode]);

    useEffect(() => {
        if (!window.Echo || !getDone || !eventId || contentMode !== "normal") return;

        const channel = window.Echo.private(`event.${eventId}.participants`);

        const handleParticipantUpdated = (data: any) => {
            const { payload } = data;
            const { type, participant, user_id } = payload;

            if (user_id === auth.user?.id && user_id !== 0) return;

            if (type === 'invitation_added') {
                setEventParticipants(prev => [...prev, participant]);
            }
            else if (type === 'role_updated') {
                setEventParticipants(prev =>
                    prev.map(p =>
                        p.user_id === participant.user_id
                            ? { ...p, role: participant.role }
                            : p
                    )
                );
            }
            else if (type === 'user_removed') {
                setEventParticipants(prev =>
                    prev.filter(p => p.user_id !== participant.user_id)
                );
            }
            else if (type === 'invitation_removed') {
                setEventParticipants(prev =>
                    prev.filter(p => p.invitation_id !== participant.invitation_id)
                );
            }
            else if (type === 'invitation_accepted') {
                setEventParticipants(prev =>
                    prev.map(p =>
                        p.email === participant.email
                            ? {
                                user_name: participant.user_name,
                                user_id: participant.user_id,
                                event_id: participant.event_id,
                                email: participant.email,
                                role: participant.role,
                                status: null,
                            }
                            : p
                    )
                );
            }
            else if (type === 'invitation_declined') {
                setEventParticipants(prev =>
                    prev.map(p =>
                        p.invitation_id === participant.invitation_id
                            ? { ...p, status: 'declined' }
                            : p
                    )
                );
            }
            else if (type === 'invitation_expired') {
                setEventParticipants(prev =>
                    prev.map(p =>
                        p.invitation_id === participant.invitation_id
                            ? { ...p, status: 'expired' }
                            : p
                    )
                );
            }
        };

        channel.listen('.participant.updated', handleParticipantUpdated);

        return () => {
            channel.stopListening('.participant.updated');
            window.Echo.leave(`event.${eventId}.participants`);
        };
    }, [getDone, eventId, auth.user?.id]);

    useEffect(() => {
        if (!window.Echo || !getDone || !auth.user?.id || contentMode !== "normal") return;

        const channel = window.Echo.private(`user.${auth.user?.id}.events.participants`);

        const handleParticipantDelete = (data: any) => {
            const { event_uuid, user_id } = data;

            if(user_id !== auth.user?.id) return;

            setEventsWithReminder(prev =>
                prev.filter(e => e.uuid !== event_uuid)
            );

            if (eventId === event_uuid) {
                resetEvent();
                const alertData:AlertsData = {
                    id: new Date(),
                    message: "해당 이벤트에서 추방되었습니다.",
                    type: "warning"
                }
                setAlerts(pre => [...pre, alertData]);
            }
        };

        channel.listen('.participant.deleted', handleParticipantDelete);

        return () => {
            channel.stopListening('.participant.deleted');
            window.Echo.leave(`user.${auth.user?.id}.events.participants`);
        };

    }, [getDone, auth.user?.id, eventId, setEventsWithReminder, contentMode]);

    useEffect(() => {
        if (!window.Echo || !getDone || !eventId || contentMode !== "normal") {
            setOnlineParticipantIds([]);
            return;
        }

        const channel = window.Echo.join(`event.${eventId}.online`);

        const normalizeUserId = (user: any): number | null => {
            const value = Number(user?.id ?? user?.user_id);
            return Number.isFinite(value) ? value : null;
        };

        channel.here((users: any[]) => {
            const ids = users
                .map(normalizeUserId)
                .filter((id): id is number => id !== null);
            setOnlineParticipantIds(Array.from(new Set(ids)));
        });

        channel.joining((user: any) => {
            const userId = normalizeUserId(user);
            if (userId === null) return;

            setOnlineParticipantIds(prev =>
                prev.includes(userId) ? prev : [...prev, userId]
            );
        });

        channel.leaving((user: any) => {
            const userId = normalizeUserId(user);
            if (userId === null) return;

            setOnlineParticipantIds(prev => prev.filter(id => id !== userId));
        });

        return () => {
            window.Echo.leave(`event.${eventId}.online`);
            setOnlineParticipantIds([]);
        };
    }, [getDone, eventId, contentMode]);

    const [eventUserControl, setEventUserControl] = useState<boolean>(false);

    const removeParticipantsAll = useCallback(async () => {
        if(!eventId) return;

        try {
            const res = await axios.delete(`/api/event/${eventId}/participants/all`);

            if (res.data.success) {
                setEventParticipants(prev => prev.filter(eventParticipant => eventParticipant.role === "owner"));
                setEventUserControl(false);
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventId]);

    useEffect(() => {
        if(!modalTitle && !modalMessage) {
            setModalType("");
        }
    }, [modalTitle, modalMessage]);

    useEffect(() => {
        if(contentMode !== "normal") {
            setViewMode("month")
        }
    }, [contentMode]);

    useEffect(() => {
        if (type && type !== contentMode) {
            setContentMode(type);
        }
    }, [type]);

    useEffect(() => {
        if(viewMode === "month") {
            setActiveDay(null);
        }
    }, [viewMode]);

    const getWeekWednesday = (date: Date) => {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());

        const wednesday = new Date(weekStart);
        wednesday.setDate(weekStart.getDate() + 3);

        return wednesday;
    }

    const activeAtToToday = useCallback(() => {
        const today = DateUtils.now();

        if (viewMode === "month") {
            if (
                activeAt.getFullYear() === today.getFullYear() &&
                activeAt.getMonth() === today.getMonth()
            ) return;

            setActiveAt(new Date(today.getFullYear(), today.getMonth(), 1));
            setFirstCenter(true);
            return;
        }

        if (viewMode === "week") {
            const weekWednesday = getWeekWednesday(today);

            setActiveAt(
                new Date(
                    weekWednesday.getFullYear(),
                    weekWednesday.getMonth(),
                    1
                )
            );

            setActiveDay(weekWednesday.getDate());
            return;
        }

        if (viewMode === "day") {
            setActiveAt(new Date(today.getFullYear(), today.getMonth(), 1));
            setActiveDay(today.getDate());
        }

    }, [activeAt, viewMode]);

    const contentModeMap: Record<string, string> = {
        normal: "n",
        challenge: "c",
        dday: "d",
    };

    const clearCurrentEventState = () => {
        setEventId(null);
        setEventTitle("");
        setEventReminder([]);
        setEventParticipants([]);
        setEventDescription("");
        setEventColor("bg-blue-500");
        setStartAt(null);
        setEndAt(null);
        setActiveChallenge(null);
        setParticipantControl("");
    }

    const resetEvent = () => {
        clearCurrentEventState();
        router.visit(`/calenote/calendar/${contentModeMap[contentMode]}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
    }

    const changeContentTypeUrl = useCallback(() => {
        if(!contentMode) return;

        const eventTypeSame = events.some(event => (event.uuid === eventId && event.type === contentMode));

        if(!eventTypeSame) {
            clearCurrentEventState();
        }

        router.visit(`/calenote/calendar/${contentModeMap[contentMode]}${eventTypeSame ? `/${eventId}` : ""}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
    }, [contentMode, eventId, events]);

    const firstRockChangeContentTypeUrl = useRef<boolean>(false);

    useEffect(() => {
        if(!firstRockChangeContentTypeUrl.current) {
            firstRockChangeContentTypeUrl.current = true;
            return;
        }
        changeContentTypeUrl();
    }, [contentMode]);

    useEffect(() => {
        if (!challengeTemplateModal.status || contentMode !== "challenge" || !challengeTemplateModal.templateType) {
            return;
        }

        const fetchTemplates = async () => {
            setTemplatesLoading(true);
            setTemplatesError("");

            try {
                const res = await axios.get('/api/challenge-templates', {
                    params: {
                        template_type: challengeTemplateModal.templateType,
                    },
                });

                if (res.data?.success) {
                    setTemplates(sortTemplates(res.data.templates ?? []));
                } else {
                    setTemplates([]);
                    setTemplatesError("템플릿을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
                }
            } catch (e) {
                setTemplates([]);
                setTemplatesError("템플릿을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
            } finally {
                setTemplatesLoading(false);
            }
        };

        fetchTemplates();
    }, [challengeTemplateModal, contentMode, sortTemplates]);

    const toggleTemplateLike = useCallback(async (template: ChallengeTemplateItem) => {
        try {
            const res = template.liked
                ? await axios.delete(`/api/challenge-templates/${template.uuid}/like`)
                : await axios.post(`/api/challenge-templates/${template.uuid}/like`);

            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "좋아요 처리 중 오류가 발생했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setTemplates(prev => sortTemplates(prev.map(item => {
                if (item.uuid !== template.uuid) return item;

                const nextLiked = !item.liked;
                return {
                    ...item,
                    liked: nextLiked,
                    like_count: nextLiked ? item.like_count + 1 : Math.max(0, item.like_count - 1),
                };
            })));
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "좋아요 처리 중 오류가 발생했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        }
    }, [setAlerts, sortTemplates]);

    const createChallengeTemplate = useCallback(async (payload: ChallengeTemplateCreatePayload) => {
        if (creatingTemplate) return;
        setCreatingTemplate(true);

        try {
            const res = await axios.post('/api/challenge-templates', payload);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "템플릿 생성 중 오류가 발생했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const createdTemplate = res.data?.template as ChallengeTemplateItem | undefined;
            if (createdTemplate) {
                setTemplates(prev => sortTemplates([createdTemplate, ...prev]));
            }
            setTemplateDaysReloadKey((prev) => prev + 1);

            setChallengeTemplateCreateModal(false);
            setChallengeTemplateModal({ status: true, templateType: "mine" });

            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿이 생성되었습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿 생성 중 오류가 발생했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setCreatingTemplate(false);
        }
    }, [creatingTemplate, setAlerts, sortTemplates]);

    const updateChallengeTemplate = useCallback(async (templateUuid: string, payload: ChallengeTemplateCreatePayload) => {
        if (creatingTemplate) return;
        setCreatingTemplate(true);

        try {
            const res = await axios.put(`/api/challenge-templates/${templateUuid}`, payload);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "템플릿 수정 중 오류가 발생했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const updatedTemplate = res.data?.template as ChallengeTemplateItem | undefined;
            if (updatedTemplate) {
                setTemplates(prev => sortTemplates(prev.map(item => item.uuid === updatedTemplate.uuid ? { ...item, ...updatedTemplate } : item)));
            }
            setTemplateDaysReloadKey((prev) => prev + 1);

            setEditingTemplate(null);
            setChallengeTemplateCreateModal(false);
            setChallengeTemplateModal({ status: true, templateType: "mine" });

            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿이 수정되었습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿 수정 중 오류가 발생했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setCreatingTemplate(false);
        }
    }, [creatingTemplate, setAlerts, sortTemplates]);

    const openEditTemplateModal = useCallback(async (template: ChallengeTemplateItem): Promise<void> => {
        try {
            const res = await axios.get(`/api/challenge-templates/${template.uuid}/days`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "템플릿 정보를 불러오지 못했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const editData: ChallengeTemplateEditFormData = {
                uuid: template.uuid,
                title: template.title,
                description: template.description ?? null,
                icon: template.icon ?? null,
                category: template.category,
                duration_days: template.duration_days,
                visibility: template.visibility,
                days: (res.data?.days ?? []).map((day: any) => ({
                    day_number: Number(day.day_number),
                    tasks: (day.tasks ?? []).map((task: any) => ({
                        title: String(task.title ?? ""),
                        description: task.description ? String(task.description) : null,
                        is_required: Boolean(task.is_required),
                    })),
                })),
            };

            setEditingTemplate(editData);
            setChallengeTemplateModal({ status: false, templateType: null });
            setChallengeTemplateCreateModal(true);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿 정보를 불러오지 못했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        }
    }, [setAlerts]);

    const openTemplateDeleteModal = useCallback(async (template: ChallengeTemplateItem): Promise<void> => {
        setTemplateDeleteTarget(template);
        setModalType("deleteTemplate");
        setModalTitle("템플릿 삭제");
        setModalMessage("이 템플릿을 삭제하시겠습니까?");
        setModal(true);
    }, []);

    const deleteTemplate = useCallback(async (): Promise<void> => {
        if (!templateDeleteTarget) return;

        try {
            const res = await axios.delete(`/api/challenge-templates/${templateDeleteTarget.uuid}`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "템플릿 삭제 중 오류가 발생했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setTemplates(prev => prev.filter(item => item.uuid !== templateDeleteTarget.uuid));
            if (activeTemplate === templateDeleteTarget.uuid) {
                setActiveTemplate(null);
            }
            setTemplateDaysReloadKey((prev) => prev + 1);

            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿이 삭제되었습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "템플릿 삭제 중 오류가 발생했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setTemplateDeleteTarget(null);
        }
    }, [templateDeleteTarget, activeTemplate, setAlerts]);

    useEffect(() => {
        if(!challengeTemplateModal.status) setTemplates([]);
    }, [challengeTemplateModal.status]);

    useEffect(() => {
        if (!challengeTemplateCreateModal) {
            setEditingTemplate(null);
        }
    }, [challengeTemplateCreateModal]);

    useEffect(() => {
        if (!modal && modalType === "deleteTemplate") {
            setTemplateDeleteTarget(null);
        }
    }, [modal, modalType]);

    const startChallengeFromTemplate = useCallback(async (): Promise<void> => {
        if (!activeTemplate || challengeStarting) return;

        setChallengeStarting(true);
        try {
            const res = await axios.post('/api/challenges/start', {
                template_uuid: activeTemplate,
                color: eventColor,
            });

            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "챌린지 생성 중 오류가 발생했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const createdEvent = {
                ...res.data.event,
                start_at: DateUtils.parseServerDate(res.data.event.start_at),
                end_at: DateUtils.parseServerDate(res.data.event.end_at),
            } as EventsData;

            setEventsWithReminder(prev => {
                const exists = prev.some(item => item.uuid === createdEvent.uuid);
                return exists ? prev : [...prev, createdEvent];
            });

            const participantsData: ParticipantsData = {
                user_name: auth.user!.name,
                user_id: auth.user!.id,
                event_id: createdEvent.uuid,
                email: auth.user!.email,
                role: "owner",
                status: null
            };

            setEventParticipants([participantsData]);
            setEventId(createdEvent.uuid);
            setEventTitle(createdEvent.title);
            setEventDescription(createdEvent.description ?? "");
            setEventColor(createdEvent.color);
            setStartAt(DateUtils.parseServerDate(createdEvent.start_at));
            setEndAt(DateUtils.parseServerDate(createdEvent.end_at));
            const challenge = res.data.challenge as ActiveChallengeData;
            setActiveChallenge(challenge);
            setChallengeAiSummary(challenge.ai_summary ?? "");
            challengeColorSyncRef.current = challenge?.color ?? null;
            setChallengeTemplateModal({ status: false, templateType: null });

            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지가 시작되었습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);

            router.visit(`/calenote/calendar/c/${createdEvent.uuid}`, {
                method: "get",
                preserveState: true,
                preserveScroll: true,
            });
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 생성 중 오류가 발생했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeStarting(false);
        }
    }, [activeTemplate, challengeStarting, auth.user, eventColor, setAlerts, setEventsWithReminder]);

    const toggleChallengeTask = useCallback(async (taskId: number, isDone: boolean): Promise<void> => {
        if (!activeChallenge || challengeTaskUpdating) return;
        setChallengeTaskUpdating(true);

        try {
            const res = await axios.patch(`/api/challenges/${activeChallenge.uuid}/tasks/${taskId}`, {
                is_done: isDone,
            });

            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "할 일 업데이트에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setActiveChallenge(res.data.challenge as ActiveChallengeData);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "할 일 업데이트에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeTaskUpdating(false);
        }
    }, [activeChallenge, challengeTaskUpdating, setAlerts]);

    const saveChallengeDailyLog = useCallback(async (logDate: string, reviewText: string, difficultyScore: number | null): Promise<void> => {
        if (!activeChallenge || challengeLogSaving) return;
        setChallengeLogSaving(true);

        try {
            const res = await axios.put(`/api/challenges/${activeChallenge.uuid}/daily-logs`, {
                log_date: logDate,
                review_text: reviewText.length > 0 ? reviewText : null,
                difficulty_score: difficultyScore,
            });

            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "일지 저장에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setActiveChallenge(res.data.challenge as ActiveChallengeData);
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 일지를 저장했습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "일지 저장에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeLogSaving(false);
        }
    }, [activeChallenge, challengeLogSaving, setAlerts]);

    const retryChallenge = useCallback(async (): Promise<void> => {
        if (!activeChallenge || challengeRetrying) return;
        setChallengeRetrying(true);

        try {
            const res = await axios.post(`/api/challenges/${activeChallenge.uuid}/retry`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "챌린지 재도전에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const challenge = res.data.challenge as ActiveChallengeData;
            setActiveChallenge(challenge);
            setChallengeAiSummary(challenge.ai_summary ?? "");

            const eventData = res.data?.event;
            if (eventData) {
                const startAtDate = DateUtils.parseServerDate(eventData.start_at);
                const endAtDate = DateUtils.parseServerDate(eventData.end_at);
                setStartAt(startAtDate);
                setEndAt(endAtDate);

                setEventsWithReminder(prev => prev.map(item => {
                    if (item.uuid !== eventData.uuid) return item;
                    return {
                        ...item,
                        start_at: startAtDate,
                        end_at: endAtDate,
                    };
                }));
            }

            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지를 재도전으로 다시 시작했습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 재도전에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeRetrying(false);
        }
    }, [activeChallenge, challengeRetrying, setAlerts, setEventsWithReminder]);

    const extendChallenge = useCallback(async (): Promise<void> => {
        if (!activeChallenge || challengeExtending) return;
        setChallengeExtending(true);

        try {
            const res = await axios.post(`/api/challenges/${activeChallenge.uuid}/extend`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "챌린지 연장에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            setActiveChallenge(res.data.challenge as ActiveChallengeData);

            const eventData = res.data?.event;
            if (eventData) {
                const endAtDate = DateUtils.parseServerDate(eventData.end_at);
                setEndAt(endAtDate);

                setEventsWithReminder(prev => prev.map(item => {
                    if (item.uuid !== eventData.uuid) return item;
                    return {
                        ...item,
                        end_at: endAtDate,
                        status: eventData.status ?? item.status,
                    };
                }));
            }

            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지를 템플릿 1회분 연장했습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 연장에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeExtending(false);
        }
    }, [activeChallenge, challengeExtending, setAlerts, setEventsWithReminder]);

    const deleteChallenge = useCallback(async (): Promise<void> => {
        if (!activeChallenge || challengeDeleting) return;
        setChallengeDeleting(true);

        try {
            const res = await axios.delete(`/api/challenges/${activeChallenge.uuid}`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "챌린지 삭제에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const deletedEventUuid = (res.data?.event_uuid as string | null) ?? activeChallenge.event_uuid ?? eventId;
            if (deletedEventUuid) {
                setEventsWithReminder(prev => prev.filter(item => item.uuid !== deletedEventUuid));
                setReminders(prev => prev.filter(item => item.event_uuid !== deletedEventUuid));
            }

            setActiveChallenge(null);
            setChallengeAiSummary("");
            challengeColorSyncRef.current = null;
            resetEvent();

            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지를 삭제했습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 삭제에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeDeleting(false);
        }
    }, [activeChallenge, challengeDeleting, eventId, resetEvent, setAlerts, setEventsWithReminder, setReminders]);

    const summarizeChallengeWithAi = useCallback(async (): Promise<void> => {
        if (!activeChallenge || challengeAiSummarizing) return;

        setChallengeAiSummarizing(true);
        try {
            const res = await axios.post(`/api/challenges/${activeChallenge.uuid}/summary`);
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "AI 요약 생성에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            const nextSummary = String(res.data?.summary ?? "").trim();
            setChallengeAiSummary(nextSummary);
            if (res.data?.challenge) {
                setActiveChallenge(res.data.challenge as ActiveChallengeData);
            } else {
                setActiveChallenge(prev => prev ? { ...prev, ai_summary: nextSummary } : prev);
            }
            const alertData: AlertsData = {
                id: new Date(),
                message: "AI 요약이 생성되었습니다.",
                type: "success",
            };
            setAlerts(pre => [...pre, alertData]);
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "AI 요약 생성에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeAiSummarizing(false);
        }
    }, [activeChallenge, challengeAiSummarizing, setAlerts]);

    const updateChallengeColor = useCallback(async (color: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500"): Promise<void> => {
        if (!activeChallenge || challengeColorUpdating) return;
        if (challengeColorSyncRef.current === color) return;

        setChallengeColorUpdating(true);
        try {
            const res = await axios.patch(`/api/challenges/${activeChallenge.uuid}/color`, { color });
            if (!res.data?.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data?.message ?? "챌린지 색상 업데이트에 실패했습니다.",
                    type: res.data?.type ?? "danger",
                };
                setAlerts(pre => [...pre, alertData]);
                return;
            }

            challengeColorSyncRef.current = color;
            setActiveChallenge(prev => prev ? { ...prev, color } : prev);

            const updatedEventUuid = (res.data?.event_uuid as string | null) ?? eventId;
            if (updatedEventUuid) {
                setEventsWithReminder(prev => prev.map(item => item.uuid === updatedEventUuid ? { ...item, color } : item));
            }
        } catch (e) {
            const alertData: AlertsData = {
                id: new Date(),
                message: "챌린지 색상 업데이트에 실패했습니다.",
                type: "danger",
            };
            setAlerts(pre => [...pre, alertData]);
        } finally {
            setChallengeColorUpdating(false);
        }
    }, [activeChallenge, challengeColorUpdating, eventId, setAlerts, setEventsWithReminder]);

    useEffect(() => {
        if (contentMode !== "challenge" || !activeChallenge) return;
        if (!eventColor) return;
        updateChallengeColor(eventColor);
    }, [eventColor, contentMode, activeChallenge, updateChallengeColor]);

    const openChallengeDeleteModal = useCallback(async (): Promise<void> => {
        if (!activeChallenge) return;
        setModalType("deleteChallenge");
        setModalTitle("챌린지 삭제");
        setModalMessage("챌린지를 정말 삭제하시겠습니까?");
        setModal(true);
    }, [activeChallenge]);

    useEffect(() => {
        if (contentMode !== "challenge") {
            setActiveChallenge(null);
            setChallengeAiSummary("");
            return;
        }
        if (eventId) {
            fetchChallengeByEvent(eventId);
        }
    }, [contentMode, eventId, fetchChallengeByEvent]);

    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-white dark:bg-gray-950 relative flex flex-col">
                <div className="flex-1 flex flex-row">
                    <div className={`flex-1 flex flex-col`}>
                        <CalendarControlSection getWeekWednesday={getWeekWednesday} activeAtToToday={activeAtToToday} contentMode={contentMode} setContentMode={setContentMode} setFirstCenter={setFirstCenter} setMonths={setMonths} setTemporaryYear={setTemporaryYear} setTemporaryMonth={setTemporaryMonth} setTemporaryDay={setTemporaryDay} setIsDragging={setIsDragging} startAt={startAt} activeAt={activeAt} setActiveAt={setActiveAt} viewMode={viewMode} setViewMode={setViewMode} activeDay={activeDay} setActiveDay={setActiveDay}/>

                        {
                            viewMode === "month" && (
                                <MonthCalendarSection resetEvent={resetEvent} allDates={allDates} setAllDates={setAllDates} handleEventClick={handleEventClick} getActiveEventReminder={getActiveEventReminder} setEventParticipants={setEventParticipants} setEventReminder={setEventReminder} setEventIdChangeDone={setEventIdChangeDone} events={events} firstCenter={firstCenter} setFirstCenter={setFirstCenter} eventId={eventId} setEventId={setEventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} now={now} viewMode={viewMode} setViewMode={setViewMode} contentMode={contentMode} sideBar={sideBar} />
                            )
                        }
                        {
                            (viewMode === "week" || viewMode === "day") && (
                                <WeekAndDayCalendarSection resetEvent={resetEvent} now={now} handleEventClick={handleEventClick} events={events} setEventParticipants={setEventParticipants} setEventReminder={setEventReminder} eventId={eventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} contentMode={contentMode} viewMode={viewMode} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} activeAt={activeAt} setActiveAt={setActiveAt} activeDay={activeDay} setActiveDay={setActiveDay} />
                            )
                        }
                    </div>

                    <button ref={sideBarToggleRef} onClick={() => {
                        setSideBarToggle(!sideBarToggle);
                    }} className={`fixed z-[2] block md:hidden bottom-0 duration-300 transition-[right] cursor-pointer ${sideBarToggle ? 'right-[240px]' : 'right-0'}  bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-12 rounded-full text-white font-semibold m-[25px] md:m-[50px]`}>
                        <FontAwesomeIcon icon={sideBarToggle ? faAngleRight : faAngleLeft} />
                    </button>
                    <SideBarSection
                        participantControl={participantControl}
                        setParticipantControl={setParticipantControl}
                        challengeTemplateModal={challengeTemplateModal}
                        setChallengeTemplateModal={setChallengeTemplateModal}
                        setChallengeTemplateCreateModal={setChallengeTemplateCreateModal}
                        activeTemplate={activeTemplate}
                        activeChallenge={activeChallenge}
                        challengeLoading={challengeLoading}
                        challengeStarting={challengeStarting}
                        challengeTaskUpdating={challengeTaskUpdating}
                        challengeLogSaving={challengeLogSaving}
                        challengeRetrying={challengeRetrying}
                        challengeExtending={challengeExtending}
                        challengeDeleting={challengeDeleting}
                        challengeColorUpdating={challengeColorUpdating}
                        challengeAiSummarizing={challengeAiSummarizing}
                        challengeAiSummary={challengeAiSummary}
                        startChallengeFromTemplate={startChallengeFromTemplate}
                        toggleChallengeTask={toggleChallengeTask}
                        saveChallengeDailyLog={saveChallengeDailyLog}
                        retryChallenge={retryChallenge}
                        extendChallenge={extendChallenge}
                        deleteChallenge={openChallengeDeleteModal}
                        summarizeChallengeWithAi={summarizeChallengeWithAi}

                        contentMode={contentMode}
                        resetEvent={resetEvent}
                        eventUserControl={eventUserControl}
                        setEventUserControl={setEventUserControl}
                        setModalType={setModalType}
                        setModalTitle={setModalTitle}
                        setModalMessage={setModalMessage}
                        setModal={setModal}
                        sideBarToggleRef={sideBarToggleRef}
                        onlineParticipantIds={onlineParticipantIds}
                        eventParticipants={eventParticipants}
                        setEventParticipants={setEventParticipants}
                        auth={auth}
                        sideBarToggle={sideBarToggle}
                        setSideBarToggle={setSideBarToggle}
                        handleEventClick={handleEventClick}
                        reminders={reminders}
                        now={now}
                        events={events}
                        setEvents={setEventsWithReminder}
                        eventReminder={eventReminder}
                        setEventReminder={setEventReminder}
                        addEventReminder={addEventReminder}
                        removeEventReminder={removeEventReminder}
                        updateEvent={updateEvent}
                        eventId={eventId}
                        setEventId={setEventId}
                        saveEvent={saveEvent}
                        eventDescription={eventDescription}
                        setEventDescription={setEventDescription}
                        eventColor={eventColor}
                        setEventColor={setEventColor}
                        eventTitle={eventTitle}
                        setEventTitle={setEventTitle}
                        viewMode={viewMode}
                        sideBar={sideBar}
                        startAt={startAt}
                        setStartAt={setStartAt}
                        endAt={endAt}
                        setEndAt={setEndAt} />
                </div>

                <ChallengeTemplateModal
                    activeTemplate={activeTemplate}
                    setActiveTemplate={setActiveTemplate}
                    contentMode={contentMode}
                    challengeTemplateModal={challengeTemplateModal}
                    templates={templates}
                    templatesLoading={templatesLoading}
                    templatesError={templatesError}
                    templateDaysReloadKey={templateDaysReloadKey}
                    onClose={() => setChallengeTemplateModal({ status: false, templateType: null })}
                    onConfirm={() => {
                        if (!activeTemplate) return;
                        setChallengeTemplateModal({ status: false, templateType: null });
                    }}
                    onToggleTemplateLike={toggleTemplateLike}
                    onEditTemplate={openEditTemplateModal}
                    onDeleteTemplate={openTemplateDeleteModal}
                />

                <ChallengeTemplateCreateModal
                    open={challengeTemplateCreateModal}
                    setOpen={setChallengeTemplateCreateModal}
                    creating={creatingTemplate}
                    onCreate={createChallengeTemplate}
                    onUpdate={updateChallengeTemplate}
                    editingTemplate={editingTemplate}
                />

                {modal ? (
                    <Modal
                        custom={true}
                        Title={modalTitle}
                        onClickEvent={
                            modalType === "delete"
                                ? deleteEvent
                                : modalType === "deleteChallenge"
                                    ? deleteChallenge
                                    : modalType === "deleteTemplate"
                                        ? deleteTemplate
                                        : removeParticipantsAll
                        }
                        setModal={setModal}
                        setEditId={setModalTitle}
                        setEditStatus={setModalMessage}
                        Text={`${modalType === "deleteChallenge"
                            ? activeChallenge?.title || ""
                            : modalType === "deleteTemplate"
                                ? templateDeleteTarget?.title || ""
                                : events.find(event => event.uuid === eventId)?.title || ""
                        } ${modalMessage}`}
                        Position="top"
                        CloseText="삭제"
                    />
                ) : ""}
            </div>
        </>
    );
}
