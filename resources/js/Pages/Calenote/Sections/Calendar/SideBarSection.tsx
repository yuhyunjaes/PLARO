import {Dispatch, SetStateAction, useEffect, useState} from "react";
import EventDateViewAndControl from "./SideBarSection/EventDateViewAndControl";
import EventTitleControl from "./SideBarSection/EventTitleControl";
import EventDescriptionControl from "./SideBarSection/EventDescriptionControl";
import EventColorControl from "./SideBarSection/EventColorControl";
import ReminderControl from "./SideBarSection/ReminderControl";
import {EventsData, ParticipantsData, ReminderData, ReminderEventsData} from "../CalenoteSectionsData";
import ReminderView from "./SideBarSection/ReminderView";
import ParticipantControl from "./SideBarSection/ParticipantControl";
import {AuthUser} from "../../../../Types/CalenoteTypes";
import {router} from "@inertiajs/react";

interface SideBarSectionProps {
    eventParticipants: ParticipantsData[];
    setEventParticipants: Dispatch<SetStateAction<ParticipantsData[]>>;
    auth: {
        user: AuthUser | null;
    };
    sideBarToggle: boolean;
    setSideBarToggle: Dispatch<SetStateAction<boolean>>;
    handleEventClick: (Event:EventsData) => Promise<void>;
    reminders: ReminderData[];
    now: Date;
    events: EventsData[];
    setEvents: Dispatch<SetStateAction<EventsData[]>>;
    eventReminder: number[];
    setEventReminder: Dispatch<SetStateAction<number[]>>;
    deleteEvent: () => Promise<void>;
    updateEvent: () => Promise<void>;
    eventId: string | null;
    setEventId: Dispatch<SetStateAction<string | null>>;
    saveEvent: ()=> Promise<string | undefined>;
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

export default function SideBarSection({ eventParticipants, setEventParticipants, auth, sideBarToggle, setSideBarToggle, handleEventClick, reminders, now, events, setEvents, eventReminder, setEventReminder, deleteEvent, updateEvent, eventId, setEventId, saveEvent, eventDescription, setEventDescription, eventColor, setEventColor, eventTitle, setEventTitle, viewMode, sideBar, startAt, setStartAt, endAt, setEndAt }:SideBarSectionProps) {
    const [onlyOneClick, setOnlyOneClick] = useState(false);
    useEffect(() => {
        if(eventId && onlyOneClick) {
            setOnlyOneClick(false);
        }
    }, [eventId]);

    const resetEvent = () => {
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
        setStartAt(null);
        setEndAt(null);
    }

    return (
        <div
            className={`w-[250px] duration-300 transition-[right] overflow-x-hidden overflow-y-auto ${sideBar <= 0 ? (sideBarToggle ? "fixed h-full right-5 pointer-events-auto" : "-right-[100%] fixed pointer-events-none h-full") : "sticky top-[1.25rem]"} border max-h-[calc(100vh-(70px+2.5rem))] bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-800 rounded-xl normal-text user-select-none space-y-5`}
        >
            {
                (() => {
                    const IsEditAuthority: "owner" | "editor" | "viewer" | null | undefined = eventParticipants.find(eventParticipant => eventParticipant.user_id === auth.user!.id)?.role;

                    return (
                        (eventId || (startAt && endAt)) ? (
                            <>
                                <EventTitleControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventTitle={eventTitle} setEventTitle={setEventTitle} />
                                <EventDateViewAndControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                                <ParticipantControl setEvents={setEvents} resetEvent={resetEvent} IsEditAuthority={IsEditAuthority} disabled={(!!eventId && !(IsEditAuthority === "owner"))} saveEvent={saveEvent} eventId={eventId} eventParticipants={eventParticipants} setEventParticipants={setEventParticipants} auth={auth} />
                                <EventDescriptionControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} />
                                <EventColorControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} eventColor={eventColor} setEventColor={setEventColor} />
                                <ReminderControl eventReminder={eventReminder} setEventReminder={setEventReminder} />
                                <div className="px-5 pb-5">
                                    {
                                        ((!eventId && !onlyOneClick)) ? (
                                            <button onClick={() => {
                                                saveEvent();
                                                setOnlyOneClick(true);
                                            }} className="btn text-xs bg-blue-500 text-white w-full">
                                                생성
                                            </button>
                                        ) : (IsEditAuthority === "owner" ? (<button onClick={() => {
                                            deleteEvent();
                                        }} className="btn text-xs bg-red-500 text-white w-full">
                                            삭제
                                        </button>) : ""
                                        )
                                    }
                                </div>
                            </>
                        ) : (
                            <div className="p-5 space-y-5 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
                                <ReminderView handleEventClick={handleEventClick} events={events} now={now} reminders={reminders} />
                            </div>
                        )
                    );
                })()
            }


        </div>
    );
}
