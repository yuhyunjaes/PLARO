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

interface CalendarProps {
    event: string | null;
    auth: {
        user: AuthUser | null;
    };
    mode: "month" | "week" | "day";
    year: number | null;
    month: number | null;
    day:  number | null;
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
}

export default function Calendar({ event, auth, mode, year, month, day, setAlertSwitch, setAlertMessage, setAlertType } : CalendarProps) {
    const [sideBar, setSideBar] = useState<number>((): 0 | 250 => (window.innerWidth <= 640 ? 0 : 250));
    const [sideBarToggle, setSideBarToggle] = useState<boolean>(false);

    const [mobileView, setMobileView] = useState<boolean>(():boolean => (window.innerWidth <= 640));

    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<"month" | "week" | "day">(mode ? mode : "month");

    const [temporaryYear, setTemporaryYear] = useState<number | null>(year);
    const [temporaryMonth, setTemporaryMonth] = useState<number | null>(month);
    const [temporaryDay, setTemporaryDay] = useState<number | null>(day);

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const At:Date = (temporaryYear && temporaryMonth) ? new Date(temporaryYear, temporaryMonth-1, 1) : today;
    const [activeAt, setActiveAt] = useState<Date>(At);

    useEffect(() => {
        setActiveAt((temporaryYear && temporaryMonth) ? new Date(temporaryYear, temporaryMonth-1, 1) : new Date(today.getFullYear(), today.getMonth(), 1));
    }, [temporaryYear, temporaryMonth]);

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
    const [eventReminder, setEventReminder] = useState<"5min" | "10min" | "15min" | "30min" | "1day" | "2day" | "3day" | "start">("30min");


    const [eventId, setEventId] = useState<string | null>(null);

    useEffect(() => {
        setEventId(event ? event : null);
    }, [event]);

    // useEffect(() => {
    //     console.log(eventId)
    // }, [eventId]);

    const [events, setEvents] = useState([]);

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
                router.visit(`/calenote/calendar${res.data.uuid ? "/"+res.data.uuid : ""}`, {
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
            console.log(err);
        }
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId]);

    const updateEvent:()=>Promise<void> = useCallback(async ():Promise<void> => {
        if(!startAt || !endAt || !eventColor || !eventId ) return;
        try {
            const res = await axios.put(`/api/events/${eventId}`, {
                title: eventTitle,
                start_at: startAt,
                end_at: endAt,
                description: eventDescription,
                color: eventColor,
            });

            if(res.data.success) {
                console.log('success')
            }
        } catch (err) {
            console.log(err);
        }
    }, [eventTitle, eventDescription, eventColor, startAt, endAt, eventId]);

    useEffect(() => {
        updateEvent();
    }, [eventColor, startAt, endAt]);

    const getEvent:()=>Promise<void> = useCallback(async ():Promise<void> => {
        if(!eventId) return;
        console.log(eventId)
    }, [eventId]);

    // 여기까지 함.

    useEffect(() => {
        getEvent();
    }, [getEvent]);

    useEffect(() => {

    }, []);

    // 이벤트 아이디가 있을시 이벤트 일을 새로 선택하면 초기화 시키고 싶지만 뜻 대로 돼지 않음
    // useEffect(() => {
    //     if(!startAt && !endAt && eventId) {
    //         router.visit(`/calenote/calendar`, {
    //             method: "get",
    //             preserveState: true,
    //             preserveScroll: true,
    //         });
    //     }
    // }, [startAt, endAt, eventId]);

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
            setStartAt(endAt)
            setEndAt(startAt);
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

    return (
        <>
            <Head title="Calendar"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                <div className="flex-1 flex px-5 gap-5 flex-row py-5">
                    <div className="flex-1 flex flex-col gap-5">
                        <CalendarControlSection setTemporaryYear={setTemporaryYear} setTemporaryMonth={setTemporaryMonth} setTemporaryDay={setTemporaryDay} setIsDragging={setIsDragging} startAt={startAt} activeAt={activeAt} setActiveAt={setActiveAt} viewMode={viewMode} setViewMode={setViewMode} activeDay={activeDay}/>
                        {
                            viewMode === "month" && (
                                <MonthCalendarSection setEventReminder={setEventReminder} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} months={months} setMonths={setMonths} activeAt={activeAt} setActiveAt={setActiveAt} today={today} viewMode={viewMode} setViewMode={setViewMode} sideBar={sideBar} />
                            )
                        }
                        {
                            (viewMode === "week" || viewMode === "day") && (
                                <WeekAndDayCalendarSection setEventReminder={setEventReminder} setEventDescription={setEventDescription} setEventColor={setEventColor} setEventTitle={setEventTitle} mobileView={mobileView} viewMode={viewMode} isDragging={isDragging} setIsDragging={setIsDragging} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} activeAt={activeAt} setActiveAt={setActiveAt} activeDay={activeDay} setActiveDay={setActiveDay} />
                            )
                        }
                    </div>
                    <SideBarSection updateEvent={updateEvent} eventId={eventId} setEventId={setEventId} saveEvent={saveEvent} eventReminder={eventReminder} setEventReminder={setEventReminder} eventDescription={eventDescription} setEventDescription={setEventDescription} eventColor={eventColor} setEventColor={setEventColor} eventTitle={eventTitle} setEventTitle={setEventTitle} viewMode={viewMode} sideBar={sideBar} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                </div>
            </div>
        </>
    );
}
