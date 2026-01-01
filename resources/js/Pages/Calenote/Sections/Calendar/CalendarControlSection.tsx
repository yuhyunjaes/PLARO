import {Dispatch, SetStateAction} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Mode {
    title: string;
    key: string;
}

interface CalendarControlSectionProps {
    setMonths: Dispatch<SetStateAction<Date[]>>;
    setTemporaryYear: Dispatch<SetStateAction<number | null>>;
    setTemporaryMonth: Dispatch<SetStateAction<number | null>>;
    setTemporaryDay: Dispatch<SetStateAction<number | null>>;
    setIsDragging: Dispatch<SetStateAction<boolean>>;
    startAt: null | Date;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>;
    activeAt: Date;
    setActiveAt: Dispatch<SetStateAction<Date>>;
    activeDay: number | null;
}

export default function CalendarControlSection({ setMonths, setTemporaryYear, setTemporaryMonth, setTemporaryDay, setIsDragging, startAt, viewMode, setViewMode, activeAt, setActiveAt, activeDay}: CalendarControlSectionProps) {
    const modes:Mode[] = [
        {
            title: "월",
            key: "month"
        },
        {
            title: "주",
            key: "week"
        },
        {
            title: "일",
            key: "day"
        }
    ];

    return(
        <div className="rounded-xl flex justify-between items-center px-5">
            <div className="normal-text text-2xl font-semibold user-select-none">
                {activeAt.getFullYear()}
                -
                {(activeAt.getMonth()+1 > 9) ? activeAt.getMonth()+1 : `0${activeAt.getMonth()+1}`}월
            </div>

            <div className="relative flex items-center">
                <select
                    name="category"
                    id="category"
                    className="self-select-control w-[80px] h-2/3 font-semibold user-select-none"
                    value={viewMode}
                    onChange={(e) => {
                        const value:string = e.target.value;
                        setIsDragging(false);

                        if (value === "month") {
                            setViewMode(value);
                            setTemporaryYear(activeAt.getFullYear());
                            setTemporaryMonth(activeAt.getMonth()+1)
                        } else if (value === "week" || value === "day") {
                            const year = startAt ? startAt.getFullYear() : activeAt.getFullYear();
                            const month = startAt ? startAt.getMonth() + 1 : activeAt.getMonth() + 1;
                            const day = startAt
                                ? startAt.getDate()
                                : activeDay
                                    ? activeDay
                                    : (activeAt.getMonth() === new Date().getMonth() && activeAt.getFullYear() === new Date().getFullYear())
                                        ? new Date().getDate()
                                        : 1;

                            setViewMode(value);
                            setTemporaryYear(year);
                            setTemporaryMonth(month);
                            setTemporaryDay(day);
                        }
                    }}
                >
                    {modes && (
                        modes.map((mode:any, index:number) => (
                            <option className="normal-text" key={index} value={mode.key}>
                                {mode.title}
                            </option>
                        ))
                    )}
                </select>
                <FontAwesomeIcon className="normal-text absolute end-0 pointer-events-none pe-2" icon={faChevronDown}/>
            </div>
        </div>
    );
}
