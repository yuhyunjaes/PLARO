import {Dispatch, SetStateAction} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Mode {
    title: string;
    key: string;
}

interface CalendarControlSectionProps {
    viewMode: "month" | "week" | "day";
    setViewMode: Dispatch<SetStateAction<"month" | "week" | "day">>
}

export default function CalendarControlSection({viewMode, setViewMode}: CalendarControlSectionProps) {
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
        <div className="h-[70px] border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950  rounded-xl flex justify-between items-center px-5">
            <div className="normal-text">

            </div>

            <div className="relative flex items-center">
                <select
                    name="category"
                    id="category"
                    className="self-select-control w-[80px] h-2/3"
                    value={viewMode}
                    onChange={(e) => {
                        const value:string = e.target.value;
                        if (value === "month" || value === "week" || value === "day") {
                            router.visit(`/calenote/calendar/${value}`, {
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
