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
import {EventsData, ReminderData, ReminderEventsData} from "./Sections/CalenoteSectionsData";
import { useContext } from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight, faPlus} from "@fortawesome/free-solid-svg-icons";


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
        setAlertSwitch,
        setAlertMessage,
        setAlertType,
        setLoading,
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


    const [eventId, setEventId] = useState<string | null>(null);

    const [eventIdChangeDone, setEventIdChangeDone] = useState<boolean>(true);

    useEffect(() => {
        setEventId(event ? event : null);
        if(event) {
            setEventIdChangeDone(true);
        }
    }, [event]);

    const saveEvent:()=>Promise<void> = useCallback(async ():Promise<void> => {
        if(!startAt || !endAt || !eventColor || eventId) return;
        try {
            const res = await axios.post("/api/events", {
                eventSwitch: "normal",
                title: eventTitle,
                start_at: startAt,
                end_at: endAt,
                description: eventDescription,
                color: eventColor,
            });

            if(res.data.success) {
                const event = res.data.event;

                setEvents(pre => [...pre, event]);

                if(eventReminder.length > 0 && event.uuid) {
                    await saveEventReminder(event.uuid);
                }

                router.visit(`/calenote/calendar${event.uuid ? "/"+event.uuid : ""}`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });
            } else {
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventReminder]);

    const saveEventReminder = useCallback(async (eventUuid: string): Promise<void> => {
        if(!eventUuid) return;
        try {
            const res = await axios.post(`/api/event/${eventUuid}/reminders`, {
                seconds: eventReminder,
            });

            if(!res.data.success)  {
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
            } else {
                const currentReminder = res.data.reminders;
                setReminders(pre => [
                    ...pre.filter(item => item.event_id !== eventUuid),
                    ...currentReminder
                ]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventReminder]);

    const updateEvent:()=>Promise<void> = useCallback(async ():Promise<void> => {
        if(!startAt || !endAt || !eventColor || !eventId ) return;

        if(!eventIdChangeDone) {
            setEventIdChangeDone(true);
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
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId, eventIdChangeDone]);

    useEffect(() => {
        if (!isDragging) {
            updateEvent();
        }
    }, [eventColor, startAt, endAt, isDragging]);

    const updateEventReminder = useCallback(async () => {
        if(!eventId) return;

        if(!eventIdChangeDone) {
            setEventIdChangeDone(true);
            return;
        }

        await saveEventReminder(eventId);
    }, [eventIdChangeDone, eventReminder, eventId]);

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

                setReminders(pre => pre.filter(item => item.event_id !== eventId));

                setEvents(pre => pre.filter(item => item.uuid !== eventId));
                setEventId(null);
                setEventTitle("");
                setEventReminder([]);
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
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
            }
        } catch (err) {
            console.error(err);
        }
    }, [eventId]);

    const [firstCenter, setFirstCenter] = useState<boolean>(false);
    const [IsHaveEvent, setIsHaveEvent] = useState<boolean>(false);
    const [getDone, setGetDone] = useState<boolean>(false);

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
                const events = res.data.events;
                if(!events) return;

                await getActiveEventReminder(events.uuid);

                setEventTitle(events.title);
                const resStartAt = new Date(events.start_at);

                // startAt의 달을 기준으로 activeAt을 설정
                const newActiveAt = new Date(resStartAt.getFullYear(), resStartAt.getMonth(), 1);

                const IsSameActiveAt:boolean = newActiveAt.getTime() !== At.getTime();

                if(IsSameActiveAt) {
                    setIsHaveEvent(true);
                    setActiveAt(newActiveAt);
                }

                setStartAt(resStartAt);
                setEndAt(new Date(events.end_at));
                setEventDescription(events.description);
                setEventColor(events.color);

                // firstCenter를 true로 설정하여 MonthCalendarSection에서 center() 호출
                if(IsSameActiveAt) {
                    setFirstCenter(true);
                }
            } else {
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
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
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
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
                        prev.map(pre => pre.event_id === eventId
                                ? { ...pre, read: 0 }
                                : pre
                        )
                );
            } else {
                setAlertSwitch(true);
                setAlertType(res.data.type);
                setAlertMessage(res.data.message);
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

    const handleEventClick = async (Event: EventsData) => {
        if (Event.uuid === eventId) return;

        setLoading(true);
        setEventIdChangeDone(false);

        try {
            await getActiveEventReminder(Event.uuid);
            setEventId(Event.uuid);
            setEventTitle(Event.title);
            setEventDescription(Event.description);
            setEventColor(Event.color);
            setStartAt(new Date(Event.start_at));
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
    };

    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <div className="flex-1 flex px-5 gap-5 flex-row py-5">
                    <div className={`flex-1 flex flex-col gap-5`}>
                        <CalendarControlSection setFirstCenter={setFirstCenter} setIsHaveEvent={setIsHaveEvent} setMonths={setMonths} setTemporaryYear={setTemporaryYear} setTemporaryMonth={setTemporaryMonth} setTemporaryDay={setTemporaryDay} setIsDragging={setIsDragging} startAt={startAt} activeAt={activeAt} setActiveAt={setActiveAt} viewMode={viewMode} setViewMode={setViewMode} activeDay={activeDay} setActiveDay={setActiveDay}/>
                        {
                            viewMode === "month" && (
                                <MonthCalendarSection handleEventClick={handleEventClick} getActiveEventReminder={getActiveEventReminder} setEventReminder={setEventReminder} setEventIdChangeDone={setEventIdChangeDone} setIsHaveEvent={setIsHaveEvent} events={events} IsHaveEvent={IsHaveEvent} firstCenter={firstCenter} setFirstCenter={setFirstCenter} eventId={eventId} setEventId={setEventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} now={now} viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                            )
                        }
                        {
                            (viewMode === "week" || viewMode === "day") && (
                                <WeekAndDayCalendarSection handleEventClick={handleEventClick} events={events} setEventReminder={setEventReminder} eventId={eventId} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} viewMode={viewMode} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} activeAt={activeAt} setActiveAt={setActiveAt} activeDay={activeDay} setActiveDay={setActiveDay} />
                            )
                        }
                    </div>
                    {
                        sideBarToggle ? (
                            <button onClick={() => {
                                setSideBarToggle(false);
                            }} className="fixed block sm:hidden bottom-0 cursor-pointer right-[250px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-10 rounded-full text-white font-semibold m-[25px] sm:m-[50px]">
                                <FontAwesomeIcon icon={faAngleRight} />
                            </button>
                        ) : (
                            <button onClick={() => {
                                setSideBarToggle(true);
                            }} className="fixed block sm:hidden bottom-0 cursor-pointer right-0 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-10 rounded-full text-white font-semibold m-[25px] sm:m-[50px]">
                                <FontAwesomeIcon icon={faAngleLeft} />
                            </button>
                        )
                    }
                    <SideBarSection sideBarToggle={sideBarToggle} setSideBarToggle={setSideBarToggle} handleEventClick={handleEventClick} reminders={reminders} now={now} events={events} eventReminder={eventReminder} setEventReminder={setEventReminder} deleteEvent={deleteEvent} updateEvent={updateEvent} eventId={eventId} setEventId={setEventId} saveEvent={saveEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} eventColor={eventColor} setEventColor={setEventColor} eventTitle={eventTitle} setEventTitle={setEventTitle} viewMode={viewMode} sideBar={sideBar} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                </div>
            </div>
        </>
    );
}
