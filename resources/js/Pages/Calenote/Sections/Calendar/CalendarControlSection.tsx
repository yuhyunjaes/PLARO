import {Dispatch, SetStateAction, useCallback} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faChevronDown} from "@fortawesome/free-solid-svg-icons";

interface Mode {
    title: string;
    key: string;
}

interface CalendarControlSectionProps {
    setFirstCenter: Dispatch<SetStateAction<boolean>>;
    setIsHaveEvent: Dispatch<SetStateAction<boolean>>;
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
    setActiveDay: Dispatch<SetStateAction<number | null>>;
}

export default function CalendarControlSection({ setFirstCenter, setIsHaveEvent, setMonths, setTemporaryYear, setTemporaryMonth, setTemporaryDay, setIsDragging, startAt, viewMode, setViewMode, activeAt, setActiveAt, activeDay, setActiveDay}: CalendarControlSectionProps) {
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

    function addOrSubOneMonth(date:Date, status:"add" | "sub") {
        const newDate = new Date(date);
        newDate.setMonth(status === "add" ? newDate.getMonth() + 1 : newDate.getMonth() - 1);
        return newDate;
    }

    const moveDay = useCallback((baseMonth: Date, day: number, type: "add" | "sub") => {
        const date = new Date(
            baseMonth.getFullYear(),
            baseMonth.getMonth(),
            day
        );

        date.setDate(type === "add"
            ? (viewMode === "week" ? date.getDate() + 7 : date.getDate() + 1)
            : (viewMode === "week" ? date.getDate() - 7 : date.getDate() - 1)
        );

        return {
            newActiveAt: new Date(date.getFullYear(), date.getMonth(), 1),
            newActiveDay: date.getDate(),
        };
    }, [viewMode])



    return(
        <div className="rounded-xl flex justify-between items-center px-5">
            <div className="normal-text text-2xl font-semibold user-select-none">
                {activeAt.getFullYear()}
                -
                {(activeAt.getMonth()+1 > 9) ? activeAt.getMonth()+1 : `0${activeAt.getMonth()+1}`}월
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                    <select
                        name="category"
                        id="category"
                        className="self-select-control w-[60px] h-2/3 font-semibold user-select-none text-xs"
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
                    <FontAwesomeIcon className="normal-text absolute end-0 pointer-events-none pe-2 text-xs" icon={faChevronDown}/>
                </div>

                 <div className="space-x-2">
                     {viewMode === "month" ? (
                         <>
                             <button onClick={() => {
                                 setIsHaveEvent(true);
                                 setActiveAt(addOrSubOneMonth(activeAt, "sub"));

                                 setFirstCenter(true);
                             }} className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer">
                                 <FontAwesomeIcon icon={faAngleUp} />
                             </button>

                             <button onClick={() => {
                                 setIsHaveEvent(true);
                                 setActiveAt(addOrSubOneMonth(activeAt, "add"));

                                 setFirstCenter(true);
                             }}  className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer">
                                 <FontAwesomeIcon icon={faAngleDown} />
                             </button>
                         </>
                     ) : (
                         <>
                             <button
                                 onClick={() => {
                                     if (!activeDay) return;

                                     const { newActiveAt, newActiveDay } = moveDay(
                                         activeAt,
                                         activeDay,
                                         "sub"
                                     );

                                     setActiveAt(newActiveAt);
                                     setActiveDay(newActiveDay);
                                 }}
                                 className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer"
                             >
                                 <FontAwesomeIcon icon={faAngleLeft} />
                             </button>


                             <button
                                 onClick={() => {
                                     if (!activeDay) return;

                                     const { newActiveAt, newActiveDay } = moveDay(
                                         activeAt,
                                         activeDay,
                                         "add"
                                     );

                                     setActiveAt(newActiveAt);
                                     setActiveDay(newActiveDay);
                                 }}
                                 className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer"
                             >
                                 <FontAwesomeIcon icon={faAngleRight} />
                             </button>

                         </>
                     )}
                 </div>
            </div>
        </div>
    );
}
