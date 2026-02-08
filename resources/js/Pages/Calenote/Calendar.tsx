// 캘린더 영역
import SideBarSection from "./Sections/Calendar/SideBarSection";
import MonthCalendarSection from "./Sections/Calendar/MonthCalendarSection";
import { Head } from '@inertiajs/react';
import {AuthUser} from "../../Types/CalenoteTypes";
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import CalendarControlSection from "./Sections/Calendar/CalendarControlSection";
import WeekAndDayCalendarSection from "./Sections/Calendar/WeekAndDayCalendarSection";
import axios from "axios";
import {EventsData, ParticipantsData, ReminderData, ReminderEventsData} from "./Sections/CalenoteSectionsData";
import { useContext } from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight, faPlus} from "@fortawesome/free-solid-svg-icons";
import Echo from 'laravel-echo';
import {AlertsData} from "../../Components/Elements/ElementsData";


interface CalendarProps {
    event: string | null;
    auth: {
        user: AuthUser | null;
    };
    mode: "month" | "week" | "day";
    year: number | null;
    month: number | null;
    day: number | null;
    events: EventsData[];
    setEvents: Dispatch<SetStateAction<EventsData[]>>;
    reminders: ReminderData[];
    setReminders: Dispatch<SetStateAction<ReminderData[]>>;
    getEventDone: boolean;
    setGetEventDone: Dispatch<SetStateAction<boolean>>;
    now: Date;
    setNow: Dispatch<SetStateAction<Date>>;
}

export default function Calendar({ event, auth, mode, year, month, day, events, setEvents, reminders, setReminders, now, setNow, getEventDone, setGetEventDone } : CalendarProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
        loading
    } = ui;

    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    const [temporaryYear, setTemporaryYear] = useState<number | null>(year);
    const [temporaryMonth, setTemporaryMonth] = useState<number | null>(month);
    const [temporaryDay, setTemporaryDay] = useState<number | null>(day);

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const At:Date = (temporaryYear && temporaryMonth) ? new Date(temporaryYear, temporaryMonth-1, 1) : today;
    const [activeAt, setActiveAt] = useState<Date>(At);

    const [activeDay, setActiveDay] = useState<number | null>(viewMode !== "month" ? temporaryDay : null);

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
    const [eventReminder, setEventReminder] = useState<number[]>([]);
    const [eventParticipants, setEventParticipants] = useState<ParticipantsData[]>([]);

    const [eventId, setEventId] = useState<string | null>(event ? event : null);

    const [eventIdChangeDone, setEventIdChangeDone] = useState<boolean>(true);

    useEffect(() => {
        if(event) {
            setEventIdChangeDone(true);
        }
    }, [event]);

    const saveEvent: () => Promise<string | undefined> = useCallback(async () => {
        if (!startAt || !endAt || !eventColor || eventId) return;

        const res = await axios.post("/api/events", {
            eventSwitch: "normal",
            title: eventTitle,
            start_at: startAt,
            end_at: endAt,
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

        const event = res.data.event;

        setEvents(pre => [...pre, event]);

        if (eventReminder.length > 0 && event.uuid) {
            await saveEventReminder(event.uuid);
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

        router.visit(`/calenote/calendar/${event.uuid}`, {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
        setEventId(event.uuid);

        return event.uuid;
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventReminder]);

    const saveEventReminder = useCallback(async (eventUuid: string): Promise<void> => {
        if(!eventUuid) return;
        try {
            const res = await axios.post(`/api/event/${eventUuid}/reminders`, {
                seconds: eventReminder,
            });

            if(!res.data.success)  {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            } else {
                const currentReminder = res.data.reminders;
                setReminders(pre => [
                    ...pre.filter(item => item.event_uuid !== eventUuid),
                    ...currentReminder
                ]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventReminder]);

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
                start_at: startAt,
                end_at: endAt,
                description: eventDescription,
                color: eventColor,
            });

            if (res.data.success) {
                setEvents(pre =>
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
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventIdChangeDone, isRemoteUpdate]);

    useEffect(() => {
        if (!isDragging) {
            updateEvent();
        }
    }, [eventColor, startAt, endAt, isDragging]);

    useEffect(() => {
        if(!isDragging) {
            updateEventReminder();
        }
    }, [eventReminder, isDragging]);

    const deleteEvent = useCallback(async ():Promise<void> => {
        if(!eventId) return;

        try {
            const res = await axios.delete(`/api/events/${eventId}`);
            if(res.data.success) {

                setReminders(pre => pre.filter(item => item.event_uuid !== eventId));

                setEvents(pre => pre.filter(item => item.uuid !== eventId));
                setEventId(null);
                setEventTitle("");
                setEventReminder([]);
                setEventParticipants([]);
                setEventDescription("");
                setEventColor("bg-blue-500");
                setStartAt(null);
                setEndAt(null);

                router.visit(`/calenote/calendar`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });

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

    const [firstCenter, setFirstCenter] = useState<boolean>(false);
    const [IsHaveEvent, setIsHaveEvent] = useState<boolean>(false);
    const [getDone, setGetDone] = useState<boolean>(false);

    const updateEventReminder = useCallback(async () => {
        if(!eventId || !getDone) return;

        if(!eventIdChangeDone) {
            setEventIdChangeDone(true);
            return;
        }

        await saveEventReminder(eventId);
    }, [eventIdChangeDone, eventReminder, eventId, getDone]);

    // Calendar 컴포넌트에서 getEvent 함수 수정

    const getActiveEvent:()=>Promise<void> = async ():Promise<void> => {
        if(!event) {
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
                const resStartAt = new Date(activeEvent.start_at);

                // startAt의 달을 기준으로 activeAt을 설정
                const newActiveAt = new Date(resStartAt.getFullYear(), resStartAt.getMonth(), 1);

                const IsSameActiveAt:boolean = newActiveAt.getTime() !== At.getTime();

                if(IsSameActiveAt) {
                    setIsHaveEvent(true);
                    setActiveAt(newActiveAt);
                }

                setStartAt(resStartAt);
                setEndAt(new Date(activeEvent.end_at));
                setEventDescription(activeEvent.description);
                setEventColor(activeEvent.color);

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
                setEventReminder(res.data.reminders);
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

    useEffect(() => {
        getActiveEvent();
    }, []);

    const updateEventReminderReadReset = useCallback(async () => {
        if(!eventId || !eventIdChangeDone || !getEventDone || !getDone) return;

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
    }, [eventId, eventIdChangeDone, getEventDone, getDone]);

    useEffect(() => {
        if(!startAt || !endAt) return;
        updateEventReminderReadReset();
    }, [startAt, endAt]);

    useEffect(() => {
        if (!eventId || !getDone) return;

        if (!startAt && !endAt) {
            router.visit(`/calenote/calendar`, {
                method: "get",
                preserveState: true,
                preserveScroll: true,
            });
            setEventId(null);
            setEventTitle("");
            setEventReminder([]);
            setEventParticipants([]);
            setEventDescription("");
            setEventColor("bg-blue-500");
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
            setSideBar(window.innerWidth <= 640 ? 0 : 250);
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
            const startAt = new Date(Event.start_at);
            if (isNaN(startAt.getTime())) return;

            const usuallyActiveAt = new Date(activeAt.getFullYear(), activeAt.getMonth(), 1);
            const startAtActiveAt = new Date(startAt.getFullYear(), startAt.getMonth(), 1);

            if(usuallyActiveAt.getTime() !== startAtActiveAt.getTime()) {
                if(viewMode === "month") {
                    setIsHaveEvent(true);
                }

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

            setEventId(Event.uuid);
            setEventTitle(Event.title);
            setEventDescription(Event.description);
            setEventColor(Event.color);
            setStartAt(startAt);
            setEndAt(new Date(Event.end_at));

            router.visit(`/calenote/calendar/${Event.uuid}`, {
                method: "get",
                preserveState: true,
                preserveScroll: true,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [viewMode, activeAt, eventId]);

    useEffect(() => {
        if (!window.Echo || !getDone || events.length <= 0) return;

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
                setStartAt(new Date(event.start_at));
                setEndAt(new Date(event.end_at));
            }

            // 전체 이벤트 목록 동기화
            setEvents(prev =>
                prev.map(e =>
                    e.uuid === event.uuid
                        ? {
                            ...e,
                            title: event.title,
                            description: event.description,
                            start_at: new Date(event.start_at),
                            end_at: new Date(event.end_at),
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

            setEvents(prev =>
                prev.filter(e => e.uuid !== event_uuid)
            );

            // 현재 보고 있는 이벤트가 삭제된 경우
            if (eventId === event_uuid) {
                setEventId(null);
                setEventTitle("");
                setEventReminder([]);
                setEventParticipants([]);
                setEventDescription("");
                setEventColor("bg-blue-500");
                setStartAt(null);
                setEndAt(null);

                router.visit(`/calenote/calendar`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });

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
    }, [getDone, eventId, auth.user?.id, events]);

    useEffect(() => {
        if (!window.Echo || !getDone || !eventId) return;

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
        if (!window.Echo || !getDone || !auth.user?.id) return;

        const channel = window.Echo.private(`user.${auth.user?.id}.events.participants`);

        const handleParticipantDelete = (data: any) => {
            const { event_uuid, user_id } = data;

            if(user_id !== auth.user?.id) return;

            setEvents(prev =>
                prev.filter(e => e.uuid !== event_uuid)
            );

            if (eventId === event_uuid) {
                setEventId(null);
                setEventTitle("");
                setEventReminder([]);
                setEventParticipants([]);
                setEventDescription("");
                setEventColor("bg-blue-500");
                setStartAt(null);
                setEndAt(null);

                router.visit(`/calenote/calendar`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });
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

    }, [getDone, auth.user?.id, eventId]);

    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <div className="flex-1 flex px-5 gap-5 flex-row py-5">
                    <div className={`flex-1 flex flex-col gap-5`}>
                        <CalendarControlSection setFirstCenter={setFirstCenter} setIsHaveEvent={setIsHaveEvent} setMonths={setMonths} setTemporaryYear={setTemporaryYear} setTemporaryMonth={setTemporaryMonth} setTemporaryDay={setTemporaryDay} setIsDragging={setIsDragging} startAt={startAt} activeAt={activeAt} setActiveAt={setActiveAt} viewMode={viewMode} setViewMode={setViewMode} activeDay={activeDay} setActiveDay={setActiveDay}/>
                        {
                            viewMode === "month" && (
                                <MonthCalendarSection handleEventClick={handleEventClick} getActiveEventReminder={getActiveEventReminder} setEventParticipants={setEventParticipants} setEventReminder={setEventReminder} setEventIdChangeDone={setEventIdChangeDone} setIsHaveEvent={setIsHaveEvent} events={events} IsHaveEvent={IsHaveEvent} firstCenter={firstCenter} setFirstCenter={setFirstCenter} eventId={eventId} setEventId={setEventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} now={now} viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                            )
                        }
                        {
                            (viewMode === "week" || viewMode === "day") && (
                                <WeekAndDayCalendarSection handleEventClick={handleEventClick} events={events} setEventParticipants={setEventParticipants} setEventReminder={setEventReminder} eventId={eventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} viewMode={viewMode} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} activeAt={activeAt} setActiveAt={setActiveAt} activeDay={activeDay} setActiveDay={setActiveDay} />
                            )
                        }
                    </div>

                    <button onClick={() => {
                        setSideBarToggle(!sideBarToggle);
                    }} className={`fixed block sm:hidden bottom-0 duration-300 transition-[right] cursor-pointer ${sideBarToggle ? 'right-[250px]' : 'right-0'}  bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-10 rounded-full text-white font-semibold m-[25px] sm:m-[50px]`}>
                        <FontAwesomeIcon icon={sideBarToggle ? faAngleRight : faAngleLeft} />
                    </button>
                    <SideBarSection eventParticipants={eventParticipants} setEventParticipants={setEventParticipants} auth={auth} sideBarToggle={sideBarToggle} setSideBarToggle={setSideBarToggle} handleEventClick={handleEventClick} reminders={reminders} now={now} events={events} setEvents={setEvents} eventReminder={eventReminder} setEventReminder={setEventReminder} deleteEvent={deleteEvent} updateEvent={updateEvent} eventId={eventId} setEventId={setEventId} saveEvent={saveEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} eventColor={eventColor} setEventColor={setEventColor} eventTitle={eventTitle} setEventTitle={setEventTitle} viewMode={viewMode} sideBar={sideBar} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                </div>
            </div>
        </>
    );
}
