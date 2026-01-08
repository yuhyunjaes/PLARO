import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faX} from "@fortawesome/free-solid-svg-icons";
import {CalendarAtData} from "../../CalenoteSectionsData";
import {router} from "@inertiajs/react";

interface ReminderControlProps {
    eventReminder: number[];
    setEventReminder: Dispatch<SetStateAction<number[]>>;
}

export default function ReminderControl({ eventReminder, setEventReminder }:ReminderControlProps) {
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

    return (
        <div className="px-5 flex flex-wrap">
            <label
                htmlFor="eventReminder"
                className="text-xs font-semibold mb-2"
            >
                리마인더
            </label>

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
                    placeholder="리마인더"
                />

                {reminderSelector ?
                    <div className="absolute w-[200px] top-0 right-[calc(100%+0.5rem)] rounded bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800">


                        {(() => {
                            const reminderSwitch:boolean = reminderControlArr.length > 0;
                            const reminders:number[] = reminderSwitch ?  reminderControlArr : reminderOptions;

                            return(
                                reminders.map((reminder:number) => (
                                    <button onMouseDown={() => {
                                        if(!eventReminder.includes(reminder)) {
                                            setEventReminder(pre => [...pre, reminder]);
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
            <div className="mt-2 max-h-[150px] overflow-x-hidden overflow-y-auto space-y-2 bg-transparent rounded outline-none border-gray-300 w-full dark:border-gray-800 font-semibold text-xs">
                {eventReminder.map((reminder, index) => (
                    <div className="border border-gray-200 dark:border-gray-800 group p-2 w-full rounded hover:bg-gray-950/10 dark:hover:bg-gray-600 flex items-center justify-between" key={index}>
                        {reminderChangeKorean(reminder)}
                        <button onClick={() => {
                            setEventReminder(pre => pre.filter(item => item !== reminder));
                        }} className="text-[10px] hidden group-hover:block">
                            <FontAwesomeIcon icon={faX} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
