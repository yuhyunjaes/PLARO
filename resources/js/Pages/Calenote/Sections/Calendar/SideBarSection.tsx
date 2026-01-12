import {Dispatch, SetStateAction, useEffect, useState} from "react";
import EventDateViewAndControl from "./SideBarSection/EventDateViewAndControl";
import EventTitleControl from "./SideBarSection/EventTitleControl";
import EventDescriptionControl from "./SideBarSection/EventDescriptionControl";
import EventColorControl from "./SideBarSection/EventColorControl";
import ReminderControl from "./SideBarSection/ReminderControl";
import {router} from "@inertiajs/react";
import {EventsData, ReminderData, ReminderEventsData} from "../CalenoteSectionsData";
import ReminderView from "./SideBarSection/ReminderView";

interface SideBarSectionProps {
    sideBarToggle: boolean;
    setSideBarToggle: Dispatch<SetStateAction<boolean>>;
    handleEventClick: (Event:EventsData) => Promise<void>;
    reminders: ReminderData[];
    now: Date;
    events: EventsData[];
    eventReminder: number[];
    setEventReminder: Dispatch<SetStateAction<number[]>>;
    deleteEvent: () => Promise<void>;
    updateEvent: () => Promise<void>;
    eventId: string | null;
    setEventId: Dispatch<SetStateAction<string | null>>;
    saveEvent: ()=> Promise<void>;
    eventDescription: string;
    setEventDescription: Dispatch<SetStateAction<string>>;
    eventColor: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
    eventTitle: string;
    setEventTitle: Dispatch<SetStateAction<string>>;
    viewMode: "month" | "week" | "day";
    sideBar: number;
    startAt: Date | null;
    setStartAt: Dispatch<SetStateAction<Date | null>>;
    endAt: Date | null;
    setEndAt: Dispatch<SetStateAction<Date | null>>;
}

export default function SideBarSection({ sideBarToggle, setSideBarToggle, handleEventClick, reminders, now, events, eventReminder, setEventReminder, deleteEvent, updateEvent, eventId, setEventId, saveEvent, eventDescription, setEventDescription, eventColor, setEventColor, eventTitle, setEventTitle, viewMode, sideBar, startAt, setStartAt, endAt, setEndAt }:SideBarSectionProps) {
    const [onlyOneClick, setOnlyOneClick] = useState(false);
    useEffect(() => {
        if(eventId && onlyOneClick) {
            setOnlyOneClick(false);
        }
    }, [eventId]);

    return (
        <div
            className={`w-[250px] ${sideBar <= 0 ? (sideBarToggle ? "fixed overflow-x-hidden overflow-y-auto right-5 pointer-events-auto opacity-100 duration-300 transition-all" : "duration-300 transition-all opacity-0 -right-[100%] fixed pointer-events-none") : "sticky top-[1.25rem]"} border max-h-[calc(100vh-(70px+2.5rem))] bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-800 rounded-xl normal-text user-select-none space-y-5`}
        >
            {(eventId || (startAt && endAt)) ? (
                    <>
                        <EventTitleControl updateEvent={updateEvent} eventTitle={eventTitle} setEventTitle={setEventTitle} />
                        <EventDateViewAndControl startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                        <EventDescriptionControl updateEvent={updateEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} />
                        <EventColorControl eventColor={eventColor} setEventColor={setEventColor} />
                        <ReminderControl eventReminder={eventReminder} setEventReminder={setEventReminder} />
                        <div className="px-5 pb-5">
                        {
                            (!eventId && !onlyOneClick) ? (
                                <button onClick={() => {
                                    saveEvent();
                                    setOnlyOneClick(true);
                                }} className="btn text-xs bg-blue-500 text-white w-full">
                                    생성
                                </button>
                            ) : <button onClick={() => {
                                deleteEvent();
                            }} className="btn text-xs bg-red-500 text-white w-full">
                                삭제
                            </button>
                        }
                        </div>
                    </>
                ) : (
                    <div className="p-5 space-y-5 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
                        <ReminderView handleEventClick={handleEventClick} events={events} now={now} reminders={reminders} />
                    </div>
            )}


        </div>
    );
}
