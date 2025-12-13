import {Dispatch, SetStateAction} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Mode {
    title: string;
    key: string;
}

interface CalendarControlSectionProps {
    startAt: null | Date;
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>;
    activeAt: Date;
}

export default function CalendarControlSection({startAt, viewMode, setViewMode, activeAt}: CalendarControlSectionProps) {
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
        <div className="bg-white dark:bg-gray-950  rounded-xl flex justify-between items-center px-5">
            <div className="normal-text text-xl font-semibold">
                {activeAt.getFullYear()}
                -
                {(activeAt.getMonth()+1 > 9) ? activeAt.getMonth()+1 : `0${activeAt.getMonth()+1}`}월
            </div>

            <div className="relative flex items-center">
                <select
                    name="category"
                    id="category"
                    className="self-select-control w-[80px] h-2/3 font-semibold"
                    value={viewMode}
                    onChange={(e) => {
                        const value:string = e.target.value;
                        if (value === "month") {
                            router.visit(`/calenote/calendar/${value}/${activeAt.getFullYear()}/${activeAt.getMonth()+1}`, {
                                method: "get",
                                preserveState: true,
                                preserveScroll: true,
                            });
                        } else if (value === "week" || value === "day") {
                            router.visit(`/calenote/calendar/${value}/${startAt ? startAt.getFullYear() : activeAt.getFullYear()}/${startAt ? startAt.getMonth()+1 : activeAt.getMonth()+1}${startAt ? ("/"+startAt.getDate()) : "/1"}`, {
                                method: "get",
                                preserveState: true,
                                preserveScroll: true,
                            });
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
