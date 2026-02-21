import {Dispatch, RefObject, SetStateAction, useEffect, useRef, useState} from "react";
import EventDateViewAndControl from "./SideBarSection/Normal/EventDateViewAndControl";
import EventTitleControl from "./SideBarSection/Normal/EventTitleControl";
import EventDescriptionControl from "./SideBarSection/Normal/EventDescriptionControl";
import EventColorControl from "./SideBarSection/Normal/EventColorControl";
import ReminderControl from "./SideBarSection/Normal/ReminderControl";
import {
    ActiveChallengeData,
    EventReminderItem,
    EventsData,
    ParticipantsData,
    ReminderData
} from "../CalenoteSectionsData";
import ReminderView from "./SideBarSection/Normal/ReminderView";
import ParticipantControl from "./SideBarSection/Normal/ParticipantControl";
import {AuthUser} from "../../../../Types/CalenoteTypes";
import TemplateSelect from "./SideBarSection/Challenge/TemplateSelect";
import ChallengeActivePanel from "./SideBarSection/Challenge/ChallengeActivePanel";
import OngoingChallengeList from "./SideBarSection/Challenge/OngoingChallengeList";

interface SideBarSectionProps {
    participantControl: string;
    setParticipantControl: Dispatch<SetStateAction<string>>;
    challengeTemplateModal: {status: boolean, templateType: "mine" | "every" | null};
    setChallengeTemplateModal: Dispatch<SetStateAction<{status: boolean, templateType: "mine" | "every" | null}>>;
    setChallengeTemplateCreateModal?: Dispatch<SetStateAction<boolean>>;
    activeTemplate: string | null;
    activeChallenge: ActiveChallengeData | null;
    challengeLoading: boolean;
    challengeStarting: boolean;
    challengeTaskUpdating: boolean;
    challengeLogSaving: boolean;
    challengeRetrying: boolean;
    challengeExtending: boolean;
    challengeDeleting: boolean;
    challengeColorUpdating: boolean;
    challengeAiSummarizing: boolean;
    challengeAiSummary: string;
    startChallengeFromTemplate: () => Promise<void>;
    toggleChallengeTask: (taskId: number, isDone: boolean) => Promise<void>;
    saveChallengeDailyLog: (logDate: string, reviewText: string, difficultyScore: number | null) => Promise<void>;
    retryChallenge: () => Promise<void>;
    extendChallenge: () => Promise<void>;
    deleteChallenge: () => Promise<void>;
    summarizeChallengeWithAi: () => Promise<void>;

    contentMode: "normal" | "challenge" | "dday";
    resetEvent: () => void;
    eventUserControl: boolean;
    setEventUserControl: Dispatch<SetStateAction<boolean>>;
    setModalType: Dispatch<SetStateAction<"" | "delete" | "removeUser" | "deleteChallenge" | "deleteTemplate">>;
    setModalTitle: Dispatch<SetStateAction<string>>;
    setModalMessage: Dispatch<SetStateAction<string>>;
    setModal: Dispatch<SetStateAction<boolean>>;
    sideBarToggleRef:  RefObject<HTMLButtonElement | null>;
    onlineParticipantIds: number[];
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
    eventReminder: EventReminderItem[];
    setEventReminder: Dispatch<SetStateAction<EventReminderItem[]>>;
    addEventReminder: (seconds: number) => Promise<void>;
    removeEventReminder: (reminder: EventReminderItem) => Promise<void>;
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

export default function SideBarSection({
    participantControl,
    setParticipantControl,
    challengeTemplateModal,
    setChallengeTemplateModal,
    setChallengeTemplateCreateModal,
    activeTemplate,
    activeChallenge,
    challengeLoading,
    challengeStarting,
    challengeTaskUpdating,
    challengeLogSaving,
    challengeRetrying,
    challengeExtending,
    challengeDeleting,
    challengeColorUpdating,
    challengeAiSummarizing,
    challengeAiSummary,
    startChallengeFromTemplate,
    toggleChallengeTask,
    saveChallengeDailyLog,
    retryChallenge,
    extendChallenge,
    deleteChallenge,
    summarizeChallengeWithAi,
    contentMode,
    resetEvent,
    eventUserControl,
    setEventUserControl,
    setModalType,
    setModalTitle,
    setModalMessage,
    setModal,
    sideBarToggleRef,
    onlineParticipantIds,
    eventParticipants,
    setEventParticipants,
    auth,
    sideBarToggle,
    setSideBarToggle,
    handleEventClick,
    reminders,
    now,
    events,
    setEvents,
    eventReminder,
    setEventReminder,
    addEventReminder,
    removeEventReminder,
    updateEvent,
    eventId,
    setEventId,
    saveEvent,
    eventDescription,
    setEventDescription,
    eventColor,
    setEventColor,
    eventTitle,
    setEventTitle,
    viewMode,
    sideBar,
    startAt,
    setStartAt,
    endAt,
    setEndAt
}:SideBarSectionProps) {
    const [onlyOneClick, setOnlyOneClick] = useState(false);
    const sideBarRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if(eventId && onlyOneClick) {
            setOnlyOneClick(false);
        }
    }, [eventId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element | null;
            if (!target) return;

            const clickedInsideSidebar = !!sideBarRef.current?.contains(target);
            const clickedToggleButton = !!sideBarToggleRef.current?.contains(target);
            const clickedEventElement = !!target.closest("[data-event='true']");

            if (!clickedInsideSidebar && !clickedToggleButton && !clickedEventElement) {
                setSideBarToggle(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const IsEditAuthority: "owner" | "editor" | "viewer" | null | undefined = eventParticipants.find(eventParticipant => eventParticipant.user_id === auth.user!.id)?.role;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ongoingChallengeEvents = events
        .filter((event) => {
            if (event.type !== "challenge") return false;
            if ((event.status ?? "active") !== "active") return false;
            const endAt = new Date(event.end_at);
            return !isNaN(endAt.getTime()) && endAt.getTime() >= todayStart.getTime();
        })
        .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime());

    return (
        <div
            ref={sideBarRef}
            className={`w-[250px] z-[2] border-l overflow-y-auto overflow-x-hidden border-gray-300 dark:border-gray-800 duration-300 transition-[right] ${sideBar <= 0 ? (sideBarToggle ? "fixed h-full right-0 pointer-events-auto" : "-right-[100%] fixed pointer-events-none h-full") : "sticky top-0"} max-h-[calc(100vh-70px)] bg-white dark:bg-gray-950 normal-text user-select-none`}
        >
            {
                (contentMode === "normal") ? (
                    (eventId || (startAt && endAt)) ? (
                        <>
                            <div className="space-y-5">
                                <EventTitleControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventTitle={eventTitle} setEventTitle={setEventTitle} />
                                <EventDateViewAndControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                                <ParticipantControl participantControl={participantControl} setParticipantControl={setParticipantControl} setModalType={setModalType} setModalTitle={setModalTitle} setModalMessage={setModalMessage} setModal={setModal} eventUserControl={eventUserControl} setEventUserControl={setEventUserControl} onlineParticipantIds={onlineParticipantIds} setEvents={setEvents} resetEvent={resetEvent} IsEditAuthority={IsEditAuthority} disabled={(!!eventId && !(IsEditAuthority === "owner"))} saveEvent={saveEvent} eventId={eventId} eventParticipants={eventParticipants} setEventParticipants={setEventParticipants} auth={auth} />
                                <EventDescriptionControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} />
                                <div className="px-5">
                                    <EventColorControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} eventColor={eventColor} setEventColor={setEventColor} />
                                </div>
                                <ReminderControl eventReminder={eventReminder} addEventReminder={addEventReminder} removeEventReminder={removeEventReminder} />
                            </div>
                            <div className="sticky bottom-0 bg-white dark:bg-gray-950 p-5 border-t border-gray-300 dark:border-gray-800">
                                {
                                    ((!eventId && !onlyOneClick)) ? (
                                        <button onClick={async () => {
                                            const data = await saveEvent();

                                            if(data !== undefined) {
                                                setOnlyOneClick(true);
                                            }
                                        }} className="btn text-xs bg-blue-500 text-white w-full">
                                            생성
                                        </button>
                                    ) : (IsEditAuthority === "owner" ? (<button onClick={() => {
                                            setModalType("delete");
                                            setModalTitle("이벤트 삭제");
                                            setModalMessage("이벤트를 정말 삭제 하시겠습니까?");
                                            setModal(true);
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
                ) : ""
            }

            {
                contentMode === "challenge" ? (
                    <>
                        {activeChallenge ? (
                            <div className="space-y-5">
                                <ChallengeActivePanel
                                    challenge={activeChallenge}
                                    loading={challengeLoading}
                                    taskUpdating={challengeTaskUpdating}
                                    logSaving={challengeLogSaving}
                                    retrying={challengeRetrying}
                                    extending={challengeExtending}
                                    deleting={challengeDeleting}
                                    challengeColorUpdating={challengeColorUpdating}
                                    aiSummarizing={challengeAiSummarizing}
                                    aiSummary={challengeAiSummary}
                                    eventColor={eventColor}
                                    setEventColor={setEventColor}
                                    onToggleTask={toggleChallengeTask}
                                    onSaveDailyLog={saveChallengeDailyLog}
                                    onRetryChallenge={retryChallenge}
                                    onExtendChallenge={extendChallenge}
                                    onSummarizeWithAi={summarizeChallengeWithAi}
                                    onDeleteChallenge={deleteChallenge}
                                />
                                <div className="px-5 pb-5">
                                    <OngoingChallengeList
                                        challengeEvents={ongoingChallengeEvents}
                                        eventId={eventId}
                                        loading={challengeLoading}
                                        onSelect={handleEventClick}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-5 p-5">
                                    <OngoingChallengeList
                                        challengeEvents={ongoingChallengeEvents}
                                        eventId={eventId}
                                        loading={challengeLoading}
                                        onSelect={handleEventClick}
                                    />

                                    <TemplateSelect
                                        challengeTemplateModal={challengeTemplateModal}
                                        setChallengeTemplateModal={setChallengeTemplateModal}
                                        setChallengeTemplateCreateModal={setChallengeTemplateCreateModal ?? (() => undefined)}
                                    />

                                    <EventColorControl
                                        disabled={challengeStarting}
                                        eventColor={eventColor}
                                        setEventColor={setEventColor}
                                    />
                                </div>
                                <div className="sticky bottom-0 bg-white dark:bg-gray-950 p-5 border-t border-gray-300 dark:border-gray-800">
                                    <button
                                        type="button"
                                        disabled={!activeTemplate || challengeStarting}
                                        onClick={startChallengeFromTemplate}
                                        className="btn text-xs bg-blue-500 text-white w-full disabled:opacity-60"
                                    >
                                        {challengeStarting ? "챌린지 생성 중..." : "선택한 템플릿으로 챌린지 생성"}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                ) : ""
            }
        </div>
    );
}
