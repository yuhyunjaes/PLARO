import {useCallback, useEffect, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faX} from "@fortawesome/free-solid-svg-icons";
import {EventReminderItem} from "../../../CalenoteSectionsData";

interface ReminderControlProps {
    eventReminder: EventReminderItem[];
    addEventReminder: (seconds: number) => Promise<void> | void;
    removeEventReminder: (reminder: EventReminderItem) => Promise<void> | void;
}

export default function ReminderControl({ eventReminder, addEventReminder, removeEventReminder }:ReminderControlProps) {
    const reminderOptions: number[] = [
        0,
        300,
        600,
        900,
        1800,
        86400,
        172800,
        259200
    ];

    const [reminderSelector, setReminderSelector] = useState<boolean>(false);
    const [reminderControl, setReminderControl] = useState<string>("");
    const [reminderControlArr, setReminderControlArr] = useState<number[]>([]);

    const reminderChangeKorean = (reminder: number): string | undefined => {
        if (reminder < 0) return;
        if (reminder === 0) return "이벤트 시작시";

        // reminder = 초
        const MINUTE = 60;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MAX_SECONDS = 4 * WEEK; // 4주

        let seconds = reminder;

        // 최대 4주 제한
        if (seconds > MAX_SECONDS) {
            seconds = MAX_SECONDS;
        }

        const weeks = Math.floor(seconds / WEEK);
        const afterWeeks = seconds % WEEK;

        const days = Math.floor(afterWeeks / DAY);
        const afterDays = afterWeeks % DAY;

        const hours = Math.floor(afterDays / HOUR);
        const afterHours = afterDays % HOUR;

        const minutes = Math.floor(afterHours / MINUTE);

        let text = "";
        if (weeks > 0) text += `${weeks}주 `;
        if (days > 0) text += `${days}일 `;
        if (hours > 0) text += `${hours}시간 `;
        if (minutes > 0) text += `${minutes}분`;

        return `${text.trim()} 전`;
    };


    const reminderControlToArr = useCallback(() => {
        if (!reminderControl || reminderControl.trim().length <= 0) {
            setReminderControlArr([]);
            return;
        }

        let n = Number(reminderControl);
        if (isNaN(n) || n <= 0) {
            setReminderControlArr([]);
            return;
        }

        const MINUTE = 60;
        const HOUR = 60 * 60;
        const DAY = 60 * 60 * 24;
        const WEEK = DAY * 7;
        const MAX_SECONDS = 4 * WEEK; // 4주

        const result: number[] = [];

        // 1. n분 전
        const minutesValue = n * MINUTE;
        if (minutesValue <= MAX_SECONDS) {
            result.push(minutesValue);
        }

        // 2. n시간 전
        const hoursValue = n * HOUR;
        if (hoursValue <= MAX_SECONDS && hoursValue !== minutesValue) {
            result.push(hoursValue);
        }

        // 3. n일 전
        const daysValue = n * DAY;
        if (daysValue <= MAX_SECONDS && daysValue !== minutesValue && daysValue !== hoursValue) {
            result.push(daysValue);
        }

        // 4. n주 전 (n이 4 이하일 때만)
        if (n <= 4) {
            const weeksValue = n * WEEK;
            if (weeksValue <= MAX_SECONDS &&
                weeksValue !== minutesValue &&
                weeksValue !== hoursValue &&
                weeksValue !== daysValue) {
                result.push(weeksValue);
            }
        }

        setReminderControlArr(result);
    }, [reminderControl]);

    useEffect(() => {
        reminderControlToArr();
    }, [reminderControlToArr]);

    useEffect(() => {
        if(eventReminder.length >= 5) {
            setReminderSelector(false);
        }
    }, [eventReminder]);

    return (
        <div className="px-5 mb-5 flex flex-wrap">
            <div className="w-full relative">
                <input
                    onFocus={() => { setReminderSelector(true); }}
                    onBlur={() => { setReminderSelector(false); }}
                    type="number"
                    id="eventReminder"
                    value={reminderControl}
                    onChange={(e) => { setReminderControl(e.target.value); }}
                    max={40320}
                    className="border w-full border-gray-300 dark:border-gray-800 px-1 py-2 rounded bg-transparent text-xs font-semibold outline-none"
                    placeholder={`리마인더 ${eventReminder.length >= 5 ? "(최대 5 개)" : ""}`}
                    disabled={eventReminder.length >= 5}
                />

                {(reminderSelector && eventReminder.length < 5) ?
                    <div className="absolute w-full top-[34px] z-[1]  rounded bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800">


                        {(() => {
                            const reminderSwitch:boolean = reminderControlArr.length > 0;
                            const reminders:number[] = reminderSwitch ?  reminderControlArr : reminderOptions;

                            return(
                                reminders.map((reminder:number) => (
                                    <button onMouseDown={async () => {
                                        const hasReminder = eventReminder.some(item => item.seconds === reminder);
                                        if(!hasReminder && eventReminder.length < 5) {
                                            await addEventReminder(reminder);
                                            setReminderControl("");
                                        }
                                    }} key={reminder} className="p-2 w-full text-xs text-left hover:bg-gray-950/10 dark:hover:bg-gray-600 rounded">
                                        {reminderChangeKorean(reminder)}
                                    </button>
                                ))
                            );
                        })()}
                    </div> : ""}
            </div>
            <div className="mt-2 rounded outline-none border-gray-300 w-full dark:border-gray-800 font-semibold text-xs">
                <details className="space-y-2 mt-2">
                    <summary className="text-gray-500">리마인더 {eventReminder.length > 0 ? `${eventReminder.length}개 ` : '0개 '} 모두 보기</summary>
                    {eventReminder.map((reminder) => (
                        <div className="border border-gray-300 dark:border-gray-800 group p-2 w-full rounded hover:bg-gray-950/10 dark:hover:bg-gray-600 flex items-center justify-between" key={`${reminder.id ?? "new"}-${reminder.seconds}`}>
                            {reminderChangeKorean(reminder.seconds)}
                            <button onClick={async () => {
                                await removeEventReminder(reminder);
                            }} className="text-[10px] block md:hidden group-hover:block cursor-pointer">
                                <FontAwesomeIcon icon={faX} />
                            </button>
                        </div>
                    ))}
                </details>
            </div>
        </div>
    );
}
