import {useMemo, useState} from "react";
import {EventsData, ReminderData} from "../../../CalenoteSectionsData";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-solid-svg-icons";
import {DateUtils} from "../../../../../../Utils/dateUtils";
import CalendarEventSearch from "../Common/CalendarEventSearch";

interface ReminderViewProps {
    handleEventClick: (Event:EventsData) => Promise<void>;
    events: EventsData[];
    eventId: string | null;
    now: Date;
    reminders: ReminderData[];
}
export default function ReminderView({ handleEventClick, events, eventId, now, reminders }:ReminderViewProps) {
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const koreanDate:String[] = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
    ];

    const afterNowEvents: EventsData[] = events.filter(event => {
        const eventDate = DateUtils.parseServerDate(event.end_at);
        return eventDate.getTime() >= now.getTime();
    });
    const filteredAfterNowEvents: EventsData[] = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        if (!keyword) return afterNowEvents;
        return afterNowEvents.filter((event) => (event.title ?? "").toLowerCase().includes(keyword));
    }, [afterNowEvents, searchKeyword]);

    return (
        <>
            <div className="space-y-2">
                <CalendarEventSearch
                    mode="normal"
                    events={events}
                    eventId={eventId}
                    onSelect={handleEventClick}
                    showResults={false}
                    keyword={searchKeyword}
                    onKeywordChange={setSearchKeyword}
                />

                <div className="h-[260px] overflow-x-hidden overflow-y-auto hidden-scroll space-y-5 relative">
                    {filteredAfterNowEvents.length <= 0 ? (
                        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold w-full text-center">진행중인 이벤트가 없어요.</p>
                    ) : ""}
                    {(() => {
                        const eventStartAtDates: Date[] = filteredAfterNowEvents
                            .map(e => DateUtils.parseServerDate(e.start_at))
                            .filter((date, index, self) =>
                                    index === self.findIndex(d =>
                                        d.getFullYear() === date.getFullYear() &&
                                        d.getMonth() === date.getMonth() &&
                                        d.getDate() === date.getDate()
                                    )
                            )
                            .sort((a, b) => a.getTime() - b.getTime());

                        return(
                            eventStartAtDates.map((eventStartAtDate, index) => {
                                const today = eventStartAtDate.getFullYear() === now.getFullYear() &&
                                    eventStartAtDate.getMonth() === now.getMonth() &&
                                    eventStartAtDate.getDate() === now.getDate();

                                const sameYear = eventStartAtDate.getFullYear() === now.getFullYear();

                                const eventStartIncludeAfterNowEvents:EventsData[] = filteredAfterNowEvents.filter(afterNowEvent => {
                                    const startAt = DateUtils.parseServerDate(afterNowEvent.start_at);

                                    startAt.setHours(0, 0, 0, 0);
                                    const eventDate = new Date(eventStartAtDate);
                                    eventDate.setHours(0, 0, 0, 0);

                                    return startAt.getTime() === eventDate.getTime();
                                })

                                return(
                                    <div key={index} className="space-y-2">
                                        <p className="text-xs font-semibold normal-text">{today ? "오늘" : (sameYear ? `${(eventStartAtDate.getMonth()+1 > 9) ? eventStartAtDate.getMonth()+1 : `0${eventStartAtDate.getMonth()+1}`} ${(eventStartAtDate.getDate() > 9) ? eventStartAtDate.getDate() : `0${eventStartAtDate.getDate()}`}(${koreanDate[eventStartAtDate.getDay()]})` : `${eventStartAtDate.getFullYear()} ${(eventStartAtDate.getMonth()+1 > 9) ? eventStartAtDate.getMonth()+1 : `0${eventStartAtDate.getMonth()+1}`} ${(eventStartAtDate.getDate() > 9) ? eventStartAtDate.getDate() : `0${eventStartAtDate.getDate()}`}`)}</p>
                                        {eventStartIncludeAfterNowEvents.map((eventStartIncludeAfterNowEvent, index) => {
                                            const startAt = DateUtils.parseServerDate(eventStartIncludeAfterNowEvent.start_at);
                                            const endAt = DateUtils.parseServerDate(eventStartIncludeAfterNowEvent.end_at);

                                            const eventStartIncludeAfterNowEventReminder:ReminderData[] = reminders.filter(reminder => reminder.event_uuid === eventStartIncludeAfterNowEvent.uuid).sort((a, b) => b.seconds - a.seconds);

                                            return(
                                                <div onClick={async () => {
                                                    await handleEventClick(eventStartIncludeAfterNowEvent);
                                                }} key={index} className="flex flex-row py-2 bg-transparent transition-colors duration-300 cursor-pointer hover:bg-gray-200/40 dark:hover:bg-gray-800/40 rounded">
                                                    <div className={`w-[4px] ${eventStartIncludeAfterNowEvent.color} rounded shrink-0`}></div>
                                                    <div className="flex-1 pl-2 flex flex-row gap-2">
                                                        <div className="flex-1">
                                                            <p
                                                                className={`text-sm font-semibold ${
                                                                    eventStartIncludeAfterNowEvent.title ? "normal-text" : "text-gray-500"
                                                                } truncate`}
                                                            >
                                                                {eventStartIncludeAfterNowEvent.title
                                                                    ? eventStartIncludeAfterNowEvent.title
                                                                    : "이벤트 제목"}
                                                            </p>
                                                            <p className="text-gray-500 text-xs font-semibold">
                                                        <span>
                                                            {startAt.getFullYear()}.
                                                            {(startAt.getMonth()+1 > 9) ? startAt.getMonth()+1 : `0${startAt.getMonth()+1}`}.
                                                            {(startAt.getDate() > 9) ? startAt.getDate() : `0${startAt.getDate()}`}
                                                            ({koreanDate[startAt.getDay()]})

                                                            {(startAt.getHours() > 9) ? startAt.getHours() : `0${startAt.getHours()}`}:
                                                            {(startAt.getMinutes() > 9) ? startAt.getMinutes() : `0${startAt.getMinutes()}`}
                                                        </span>
                                                                ~ <br/>
                                                                <span>
                                                            {endAt.getFullYear()}.
                                                                    {(endAt.getMonth()+1 > 9) ? endAt.getMonth()+1 : `0${endAt.getMonth()+1}`}.
                                                                    {(endAt.getDate() > 9) ? endAt.getDate() : `0${endAt.getDate()}`}
                                                                    ({koreanDate[endAt.getDay()]})

                                                                    {(endAt.getHours() > 9) ? endAt.getHours() : `0${endAt.getHours()}`}:
                                                                    {(endAt.getMinutes() > 9) ? endAt.getMinutes() : `0${endAt.getMinutes()}`}
                                                        </span>
                                                            </p>
                                                        </div>
                                                        <div className="w-[60px]">

                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        );
                    })()}
                </div>
            </div>
        </>
    );
}
