import {Dispatch, SetStateAction} from "react";
import {router} from "@inertiajs/react";

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
        <div className="h-[70px] border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950  rounded-2xl flex justify-between items-center px-5">
            <div className="normal-text">
                {viewMode}
            </div>

            <select
                name="category"
                id="category"
                className="select-control h-2/3"
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
                        <option key={index} value={mode.key}>{mode.title}</option>
                    ))
                )}
            </select>
        </div>
    );
}
