import axios from "axios";
import React, {ReactNode, useEffect, useState, cloneElement, ReactElement, useContext} from "react";
import { usePage } from "@inertiajs/react";
import {EventsData, ReminderData} from "./Pages/Calenote/Sections/CalenoteSectionsData";
import Reminder from "./Components/Elements/Reminder";
import Alert from "./Components/Elements/Alert";
import {GlobalUIContext} from "./Providers/GlobalUIContext";
import Header from "./Components/Header/Header";
import {DateUtils} from "./Utils/dateUtils";

interface RootProps {
    auth: any;
    children: ReactNode;
    [key: string]: any;
}

export default function Root({ auth, children, ...props }: RootProps) {
    const { url, component } = usePage();
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        alerts,
        setAlerts,
        sideBar,
        sideBarToggle,
        setSideBarToggle
    } = ui;
    const path = url.split("?")[0] ?? "";
    const isAuthPage = path === "/login" || path === "/register";
    const isCalenoteOrPlaroAi = component.startsWith("Calenote/") || component.startsWith("PlaroAi/");

    const [reminderEvents, setReminderEvents] = useState<EventsData[]>([]);
    const [reminders, setReminders] = useState<ReminderData[]>([]);
    const [now, setNow] = useState(DateUtils.now());
    useEffect(() => {
        DateUtils.setUserTimezone(auth?.user?.timezone);
        const timer = setInterval(() => {
            setNow(DateUtils.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [auth?.user?.timezone]);

    useEffect(() => {
        if(!auth.user || !isCalenoteOrPlaroAi) {
            setReminderEvents([]);
            setReminders([]);
        } else {
            getReminderEvents();
            getEventReminders();
        }
    }, [auth, isCalenoteOrPlaroAi]);

    const getReminderEvents:()=>Promise<void> = async ():Promise<void> => {
        if(!auth.user) return;
        try {
            const res = await axios.get("/api/events");
            if(res.data.success) {
                const currentEvents = (res.data.events as EventsData[]).map((event) => ({
                    ...event,
                    start_at: DateUtils.parseServerDate(event.start_at),
                    end_at: DateUtils.parseServerDate(event.end_at),
                }));
                if(currentEvents.length <= 0) return;
                setReminderEvents(currentEvents);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getEventReminders:()=>Promise<void> = async ():Promise<void> => {
        if(!auth.user) return;
        try {
            const res = await axios.get("/api/event/reminders");
            if(res.data.success) {
                setReminders(res.data.reminders);
            }
        } catch (err) {
            console.error(err);
        }
    }


    const sharedProps = {
        auth,
        reminderEvents,
        setReminderEvents,
        reminders,
        setReminders,
        now,
        setNow,
        ...props
    };

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const reminderChangeKorean = (seconds: number) => {
        if (seconds === 0) return " 시작되었습니다.";

        const MINUTE = 60;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;

        let remaining = seconds;
        const weeks = Math.floor(remaining / WEEK);
        remaining %= WEEK;
        const days = Math.floor(remaining / DAY);
        remaining %= DAY;
        const hours = Math.floor(remaining / HOUR);
        remaining %= HOUR;
        const minutes = Math.floor(remaining / MINUTE);

        let text = "";
        if (weeks) text += `${weeks}주 `;
        if (days) text += `${days}일 `;
        if (hours) text += `${hours}시간 `;
        if (minutes) text += `${minutes}분`;

        return `${text.trim()} 전 입니다.`;
    };

    const updateReminder = async (reminder: ReminderData): Promise<void> => {
        if (!reminder) return;
        try {
            const res = await axios.put(`/api/event/reminders/${reminder.id}`);
            if (res.data.success) {
                setReminders(prev =>
                    prev.map(pre =>
                        pre.id === reminder.id
                            ? { ...pre, read: 1 }
                            : pre
                    )
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    function formatDateKey(date: Date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        const ms = String(date.getMilliseconds()).padStart(3, "0");

        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
    }

    return (
        <>
            {(() => {
                if (!isCalenoteOrPlaroAi) return;
                if(reminders.length <= 0) return;

                const excludedReminders: ReminderData[] = [];

                const filterReminders = reminders
                    .filter(reminder => {
                        const event = reminderEvents.find(event => event.uuid === reminder.event_uuid);
                        if (!event) return false;
                        if (reminder.read) return false;

                        const nowMin = Math.floor(now.getTime() / 60000);
                        const startAtMin = Math.floor(DateUtils.parseServerDate(event.start_at).getTime() / 60000);
                        const remindAtMin = startAtMin - Math.floor(reminder.seconds / 60);

                        return nowMin >= remindAtMin && nowMin <= startAtMin;
                    })
                    .reduce((acc: ReminderData[], cur) => {
                        const existing = acc.find(r => r.event_id === cur.event_id);
                        if (!existing) {
                            acc.push(cur);
                        } else if (cur.seconds < existing.seconds) {
                            const index = acc.findIndex(r => r.event_id === cur.event_id);
                            if (acc[index]) {
                                excludedReminders.push(acc[index]);
                                acc[index] = cur;
                            }
                        } else {
                            excludedReminders.push(cur);
                        }
                        return acc;
                    }, [])
                    .slice(0, 5); // 최대 5개

                if (excludedReminders.length > 0) {
                    excludedReminders.forEach(r => updateReminder(r));
                }

                return (
                    <>
                        <div className="fixed pointer-events-none right-5 top-[calc(70px+1.25rem)] z-[5] w-[200px] sm:w-[250px] md:w-[300px] space-y-2">
                            {filterReminders.map((reminder) => {
                                const event = reminderEvents.find(event => event.uuid === reminder.event_uuid);
                                if (!event) return null;

                                const title = `${event.title ? (event.title.length > 3 ? event.title.substring(0, 12)+"..." : event.title) : ""}${event.title ? "<br>" : ""}이벤트 시작 ${reminderChangeKorean(reminder.seconds)}`;

                                const startDate = formatDate(DateUtils.parseServerDate(event.start_at));
                                const endDate = formatDate(DateUtils.parseServerDate(event.end_at));

                                const message =
                                    startDate === endDate
                                        ? startDate
                                        : `${startDate} ~ ${endDate}`;

                                return (
                                    <Reminder
                                        key={reminder.id}
                                        title={title}
                                        message={message}
                                        type="reminder"
                                        uuid={event.uuid}
                                        color={event.color}
                                        url="/calenote/calendar"
                                        arr={setReminders}
                                        id={reminder.id}
                                    />
                                );
                            })}
                        </div>

                        {alerts.length > 0 && (
                            <Alert
                                key={formatDateKey(alerts[0]!.id)}
                                setAlerts={setAlerts}
                                type={alerts[0]!.type}
                                message={alerts[0]!.message}
                                width={sideBar}
                            />
                        )}
                    </>
                );
            })()}
            {!isAuthPage && (
                <Header
                    auth={auth}
                    {...(isCalenoteOrPlaroAi && {
                        toggle: sideBarToggle,
                        setToggle: setSideBarToggle,
                        check: sideBar < 230
                    })}
                />
            )}
            {React.isValidElement(children)
                ? cloneElement(children as ReactElement, sharedProps)
                : children}
        </>
    );
}
