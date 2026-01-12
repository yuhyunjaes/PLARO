import axios from "axios";
import React, {ReactNode, useEffect, useState, cloneElement, ReactElement} from "react";
import {EventsData, ReminderData} from "./Pages/Calenote/Sections/CalenoteSectionsData";
import Reminder from "./Components/Elements/Reminder";

interface RootProps {
    auth: any;
    children: ReactNode;
    [key: string]: any;
}

export default function Root({ auth, children, ...props }: RootProps) {
    const [events, setEvents] = useState<EventsData[]>([]);
    const [reminders, setReminders] = useState<ReminderData[]>([]);
    const [getEventDone, setGetEventDone] = useState<boolean>(false);
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if(!auth.user) {
            setEvents([]);
            setReminders([]);
            setGetEventDone(false);
        } else {
            getEvents();
            getEventReminders();
        }
    }, [auth]);

    const getEvents:()=>Promise<void> = async ():Promise<void> => {
        if(!auth.user) return;
        try {
            const res = await axios.get("/api/events");
            if(res.data.success) {
                const currentEvents = res.data.events;
                if(currentEvents.length <= 0) return;
                setEvents(currentEvents);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGetEventDone(true);
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
        events,
        setEvents,
        reminders,
        setReminders,
        getEventDone,
        setGetEventDone,
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
            const res = await axios.put(`/api/event/${reminder.event_id}/reminders/${reminder.id}`);
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

    return (
        <>
            {React.isValidElement(children)
                ? cloneElement(children as ReactElement, sharedProps)
                : children}

            {(() => {
                if(reminders.length <= 0) return;

                const excludedReminders: ReminderData[] = [];

                const filterReminders = reminders
                    .filter(reminder => {
                        const event = events.find(event => event.uuid === reminder.event_id);
                        if (!event) return false;
                        if (reminder.read) return false;

                        const nowMin = Math.floor(now.getTime() / 60000);
                        const startAtMin = Math.floor(new Date(event.start_at).getTime() / 60000);
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
                    <div className="fixed pointer-events-none right-5 top-[calc(70px+1.25rem)] z-[1] w-[200px] sm:w-[250px] md:w-[300px] space-y-2">
                        {filterReminders.map((reminder) => {
                            const event = events.find(event => event.uuid === reminder.event_id);
                            if (!event) return null;

                            const title = `${event.title ? (event.title.length > 3 ? event.title.substring(0, 12)+"..." : event.title) : ""}${event.title ? "<br>" : ""}이벤트 시작 ${reminderChangeKorean(reminder.seconds)}`;

                            const startDate = formatDate(new Date(event.start_at));
                            const endDate = formatDate(new Date(event.end_at));

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
                );
            })()}
        </>
    );
}
