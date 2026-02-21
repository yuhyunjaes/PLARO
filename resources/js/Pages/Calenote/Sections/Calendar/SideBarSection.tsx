import {Dispatch, RefObject, SetStateAction, useEffect, useRef, useState} from "react";
import EventDateViewAndControl from "./SideBarSection/Normal/EventDateViewAndControl";
import EventTitleControl from "./SideBarSection/Normal/EventTitleControl";
import EventDescriptionControl from "./SideBarSection/Normal/EventDescriptionControl";
import EventColorControl from "./SideBarSection/Normal/EventColorControl";
import ReminderControl from "./SideBarSection/Normal/ReminderControl";
import {
    ActiveChallengeData,
    ActiveDdayData,
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
import DdayActivePanel from "./SideBarSection/Dday/DdayActivePanel";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-solid-svg-icons";
import CalendarEventSearch from "./SideBarSection/Common/CalendarEventSearch";

interface SideBarSectionProps {
    participantControl: string;
    setParticipantControl: Dispatch<SetStateAction<string>>;
    challengeTemplateModal: {status: boolean, templateType: "mine" | "every" | null};
    setChallengeTemplateModal: Dispatch<SetStateAction<{status: boolean, templateType: "mine" | "every" | null}>>;
    setChallengeTemplateCreateModal?: Dispatch<SetStateAction<boolean>>;
    activeTemplate: string | null;
    activeChallenge: ActiveChallengeData | null;
    activeDday: ActiveDdayData | null;
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
    ddayLoading: boolean;
    ddayChecking: boolean;
    ddayRetrying: boolean;
    ddayExtending: boolean;
    ddayDeleting: boolean;
    startChallengeFromTemplate: () => Promise<void>;
    toggleChallengeTask: (taskId: number, isDone: boolean) => Promise<void>;
    saveChallengeDailyLog: (logDate: string, reviewText: string, difficultyScore: number | null) => Promise<void>;
    retryChallenge: () => Promise<void>;
    extendChallenge: () => Promise<void>;
    deleteChallenge: () => Promise<void>;
    summarizeChallengeWithAi: () => Promise<void>;
    toggleDdayTodayCheck: (nextDone: boolean) => Promise<void>;
    retryDday: () => Promise<void>;
    extendDday: () => Promise<void>;
    deleteDday: () => Promise<void>;

    contentMode: "normal" | "challenge" | "dday";
    resetEvent: () => void;
    eventUserControl: boolean;
    setEventUserControl: Dispatch<SetStateAction<boolean>>;
    setModalType: Dispatch<SetStateAction<"" | "delete" | "removeUser" | "deleteChallenge" | "deleteTemplate" | "deleteDday">>;
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
    activeDday,
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
    ddayLoading,
    ddayChecking,
    ddayRetrying,
    ddayExtending,
    ddayDeleting,
    startChallengeFromTemplate,
    toggleChallengeTask,
    saveChallengeDailyLog,
    retryChallenge,
    extendChallenge,
    deleteChallenge,
    summarizeChallengeWithAi,
    toggleDdayTodayCheck,
    retryDday,
    extendDday,
    deleteDday,
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
    const [normalSearchKeyword, setNormalSearchKeyword] = useState<string>("");
    const [challengeSearchKeyword, setChallengeSearchKeyword] = useState<string>("");
    const [ddaySearchKeyword, setDdaySearchKeyword] = useState<string>("");
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
    const ongoingNormalEvents = events
        .filter((event) => {
            if (event.type !== "normal") return false;
            if ((event.status ?? "active") !== "active") return false;
            const endAt = new Date(event.end_at);
            return !isNaN(endAt.getTime()) && endAt.getTime() >= todayStart.getTime();
        })
        .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime());
    const ongoingDdayEvents = events
        .filter((event) => {
            if (event.type !== "dday") return false;
            if ((event.status ?? "active") !== "active") return false;
            const endAt = new Date(event.end_at);
            return !isNaN(endAt.getTime()) && endAt.getTime() >= todayStart.getTime();
        })
        .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime());
    const filteredOngoingChallengeEvents = ongoingChallengeEvents.filter((event) =>
        (event.title ?? "").toLowerCase().includes(challengeSearchKeyword.trim().toLowerCase())
    );
    const filteredOngoingNormalEvents = ongoingNormalEvents.filter((event) =>
        (event.title ?? "").toLowerCase().includes(normalSearchKeyword.trim().toLowerCase())
    );
    const filteredOngoingDdayEvents = ongoingDdayEvents.filter((event) =>
        (event.title ?? "").toLowerCase().includes(ddaySearchKeyword.trim().toLowerCase())
    );
    const koreanDate: string[] = ["일", "월", "화", "수", "목", "금", "토"];
    const renderNowHeader = () => (
        <div className="px-5 py-5 text-xs font-semibold normal-text space-x-1 sticky top-0 z-[1] bg-white dark:bg-gray-950">
            <FontAwesomeIcon icon={faClock} />
            <span>
                {now.getFullYear()}.
                {(now.getMonth()+1 > 9) ? now.getMonth()+1 : `0${now.getMonth()+1}`}.
                {(now.getDate() > 9) ? now.getDate() : `0${now.getDate()}`}
                ({koreanDate[now.getDay()]})
            </span>
            <span>
                {(now.getHours() > 9) ? now.getHours() : `0${now.getHours()}`}:
                {(now.getMinutes() > 9) ? now.getMinutes() : `0${now.getMinutes()}`}
            </span>
        </div>
    );
    const formatDateTimeLabel = (date: Date): string => {
        const parsed = new Date(date);
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        const h = String(parsed.getHours()).padStart(2, "0");
        const min = String(parsed.getMinutes()).padStart(2, "0");
        return `${y}.${m}.${d}(${koreanDate[parsed.getDay()]}) ${h}:${min}`;
    };

    return (
        <div
            ref={sideBarRef}
            className={`w-[250px] z-[2] border-l overflow-y-auto overflow-x-hidden border-gray-300 dark:border-gray-800 duration-300 transition-[right] ${sideBar <= 0 ? (sideBarToggle ? "fixed h-full right-0 pointer-events-auto" : "-right-[100%] fixed pointer-events-none h-full") : "sticky top-0"} max-h-[calc(100vh-70px)] bg-white dark:bg-gray-950 normal-text user-select-none`}
        >
            {
                (contentMode === "normal") ? (
                    <div className="flex flex-col">
                        {renderNowHeader()}
                        {(eventId || (startAt && endAt)) ? (
                            <>
                                <div className="space-y-5">
                                    <EventTitleControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventTitle={eventTitle} setEventTitle={setEventTitle} />
                                    <EventDateViewAndControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} contentMode={contentMode} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                                    <ParticipantControl participantControl={participantControl} setParticipantControl={setParticipantControl} setModalType={setModalType} setModalTitle={setModalTitle} setModalMessage={setModalMessage} setModal={setModal} eventUserControl={eventUserControl} setEventUserControl={setEventUserControl} onlineParticipantIds={onlineParticipantIds} setEvents={setEvents} resetEvent={resetEvent} IsEditAuthority={IsEditAuthority} disabled={(!!eventId && !(IsEditAuthority === "owner"))} saveEvent={saveEvent} eventId={eventId} eventParticipants={eventParticipants} setEventParticipants={setEventParticipants} auth={auth} />
                                    <EventDescriptionControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} />
                                <div className="px-5">
                                    <EventColorControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} eventColor={eventColor} setEventColor={setEventColor} />
                                </div>
                                <ReminderControl eventReminder={eventReminder} addEventReminder={addEventReminder} removeEventReminder={removeEventReminder} />
                            </div>
                                <div className="bg-white dark:bg-gray-950 p-5 border-t border-gray-300 dark:border-gray-800 space-y-3">
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
                                    <CalendarEventSearch
                                        mode="normal"
                                        events={ongoingNormalEvents}
                                        eventId={eventId}
                                        onSelect={handleEventClick}
                                        showResults={false}
                                        keyword={normalSearchKeyword}
                                        onKeywordChange={setNormalSearchKeyword}
                                    />
                                    <div className="space-y-1 max-h-[240px] overflow-x-hidden overflow-y-auto hidden-scroll">
                                        {filteredOngoingNormalEvents.length <= 0 ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">진행중인 이벤트가 없습니다.</p>
                                        ) : (
                                            filteredOngoingNormalEvents.map((event) => (
                                                <div
                                                    key={`normal-ongoing-${event.uuid}`}
                                                    onClick={async () => {
                                                        await handleEventClick(event);
                                                    }}
                                                    className="flex flex-row py-2 bg-transparent transition-colors duration-300 cursor-pointer hover:bg-gray-200/40 dark:hover:bg-gray-800/40 rounded"
                                                >
                                                    <div className={`w-[4px] ${event.color} rounded shrink-0`}></div>
                                                    <div className="flex-1 pl-2">
                                                        <p className={`text-sm font-semibold ${(event.title || "").trim().length > 0 ? "normal-text" : "text-gray-500"} truncate`}>
                                                            {event.title || "이벤트 제목"}
                                                        </p>
                                                        <p className="text-gray-500 text-xs font-semibold">
                                                            {formatDateTimeLabel(new Date(event.start_at))}
                                                            <br />
                                                            {formatDateTimeLabel(new Date(event.end_at))}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="px-5 flex-1 pb-5 overflow-y-auto overflow-x-hidden relative flex flex-col space-y-5">
                                <ReminderView handleEventClick={handleEventClick} events={events} eventId={eventId} now={now} reminders={reminders} />
                                <p className="text-xs text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                                    일반 모드: 날짜를 선택해 이벤트를 만들고, 진행중 목록에서 원하는 이벤트를 바로 열어 수정할 수 있어요.
                                </p>
                            </div>
                        )}
                    </div>
                ) : ""
            }

            {
                contentMode === "challenge" ? (
                    <>
                        {renderNowHeader()}
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
                                <div className="px-5 pb-5 space-y-2">
                                    <CalendarEventSearch
                                        mode="challenge"
                                        events={ongoingChallengeEvents}
                                        eventId={eventId}
                                        loading={challengeLoading}
                                        onSelect={handleEventClick}
                                        showResults={false}
                                        keyword={challengeSearchKeyword}
                                        onKeywordChange={setChallengeSearchKeyword}
                                    />
                                    <OngoingChallengeList
                                        challengeEvents={filteredOngoingChallengeEvents}
                                        eventId={eventId}
                                        loading={challengeLoading}
                                        onSelect={handleEventClick}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-5 pb-5 px-5">
                                    <div className="space-y-2">
                                        <CalendarEventSearch
                                            mode="challenge"
                                            events={ongoingChallengeEvents}
                                            eventId={eventId}
                                            loading={challengeLoading}
                                            onSelect={handleEventClick}
                                            showResults={false}
                                            keyword={challengeSearchKeyword}
                                            onKeywordChange={setChallengeSearchKeyword}
                                        />
                                        <OngoingChallengeList
                                            challengeEvents={filteredOngoingChallengeEvents}
                                            eventId={eventId}
                                            loading={challengeLoading}
                                            onSelect={handleEventClick}
                                        />
                                    </div>

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

                                    <p className="text-xs text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                                        챌린지 모드: 템플릿으로 챌린지를 시작하고, 오늘 일차 미션 체크와 일지 기록으로 진행 상황을 관리해요.
                                    </p>
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

            {contentMode === "dday" ? (
                <>
                    {renderNowHeader()}
                    {activeDday ? (
                        <div className="space-y-5">

                            <EventTitleControl
                                disabled={(!!eventId && !(IsEditAuthority === "owner" || IsEditAuthority === "editor"))}
                                updateEvent={updateEvent}
                                eventTitle={eventTitle}
                                setEventTitle={setEventTitle}
                            />
                            <EventDescriptionControl
                                disabled={(!!eventId && !(IsEditAuthority === "owner" || IsEditAuthority === "editor"))}
                                updateEvent={updateEvent}
                                eventDescription={eventDescription}
                                setEventDescription={setEventDescription}
                            />
                            <div className="px-5">
                                <EventColorControl
                                    disabled={(!!eventId && !(IsEditAuthority === "owner" || IsEditAuthority === "editor"))}
                                    eventColor={eventColor}
                                    setEventColor={setEventColor}
                                />
                            </div>
                            <DdayActivePanel
                                dday={activeDday}
                                loading={ddayLoading}
                                checking={ddayChecking}
                                retrying={ddayRetrying}
                                extending={ddayExtending}
                                deleting={ddayDeleting}
                                onToggleTodayCheck={toggleDdayTodayCheck}
                                onRetryDday={retryDday}
                                onExtendDday={extendDday}
                                onDeleteDday={deleteDday}
                            />
                            <div className="px-5 pb-5 space-y-2">
                                <CalendarEventSearch
                                    mode="dday"
                                    events={ongoingDdayEvents}
                                    eventId={eventId}
                                    loading={ddayLoading}
                                    onSelect={handleEventClick}
                                    showResults={false}
                                    keyword={ddaySearchKeyword}
                                    onKeywordChange={setDdaySearchKeyword}
                                />
                                <div className="rounded-xl">
                                <OngoingChallengeList
                                    challengeEvents={filteredOngoingDdayEvents}
                                    eventId={eventId}
                                    loading={ddayLoading}
                                    onSelect={handleEventClick}
                                    sectionTitle="진행중 D-day"
                                    emptyMessage="진행중인 D-day가 없습니다."
                                    fallbackTitle="D-day 이벤트"
                                    dateLabel="목표일"
                                />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {(eventId || (startAt && endAt)) ? (
                                <>
                                    <div className="space-y-5">
                                        <EventTitleControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventTitle={eventTitle} setEventTitle={setEventTitle} />
                                        <EventDateViewAndControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} contentMode={contentMode} startAt={startAt} setStartAt={setStartAt} endAt={endAt} setEndAt={setEndAt} />
                                        <EventDescriptionControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} updateEvent={updateEvent} eventDescription={eventDescription} setEventDescription={setEventDescription} />
                                        <div className="px-5 mb-5">
                                            <EventColorControl disabled={(!!eventId &&!(IsEditAuthority === "owner" || IsEditAuthority === "editor"))} eventColor={eventColor} setEventColor={setEventColor} />
                                        </div>
                                    </div>
                                    <div className="sticky bottom-0 bg-white dark:bg-gray-950 p-5 border-t border-gray-300 dark:border-gray-800">
                                        {!eventId ? (
                                            <button
                                                onClick={async () => {
                                                    const data = await saveEvent();
                                                    if (data !== undefined) {
                                                        setOnlyOneClick(true);
                                                    }
                                                }}
                                                className="btn text-xs bg-blue-500 text-white w-full"
                                            >
                                                D-day 생성
                                            </button>
                                        ) : ""}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-5 px-5 pb-5">
                                    <div className="space-y-2">
                                        <CalendarEventSearch
                                            mode="dday"
                                            events={ongoingDdayEvents}
                                            eventId={eventId}
                                            loading={ddayLoading}
                                            onSelect={handleEventClick}
                                            showResults={false}
                                            keyword={ddaySearchKeyword}
                                            onKeywordChange={setDdaySearchKeyword}
                                        />
                                        <OngoingChallengeList
                                            challengeEvents={filteredOngoingDdayEvents}
                                            eventId={eventId}
                                            loading={ddayLoading}
                                            onSelect={handleEventClick}
                                            sectionTitle="진행중 D-day"
                                            emptyMessage="진행중인 D-day가 없습니다."
                                            fallbackTitle="D-day 이벤트"
                                            dateLabel="목표일"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                                        D-day 모드: 시작일·목표일을 설정해 생성한 뒤, 매일 수행 체크를 누적해 목표일까지 이어가요.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : ""}
        </div>
    );
}
