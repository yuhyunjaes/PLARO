import {Dispatch, SetStateAction, useCallback} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faChevronDown} from "@fortawesome/free-solid-svg-icons";

interface Mode {
    title: string;
    key: string;
}

interface CalendarControlSectionProps {
    getWeekWednesday: (date:Date) => Date;
    activeAtToToday: () => void;
    contentMode: "normal" | "challenge" | "dday";
    setContentMode: Dispatch<SetStateAction<"normal" | "challenge" | "dday">>;
    setFirstCenter: Dispatch<SetStateAction<boolean>>;
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

export default function CalendarControlSection({ getWeekWednesday, activeAtToToday, contentMode, setContentMode, setFirstCenter, setMonths, setTemporaryYear, setTemporaryMonth, setTemporaryDay, setIsDragging, startAt, viewMode, setViewMode, activeAt, setActiveAt, activeDay, setActiveDay}: CalendarControlSectionProps) {
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
        <div className="rounded-xl flex justify-between items-center px-5 pt-5">
            <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 w-full flex justify-start items-center">
                    <h2 className="text-lg md:text-2xl normal-text font-semibold user-select-none">{activeAt.getFullYear()}
                        -
                        {(activeAt.getMonth()+1 > 9) ? activeAt.getMonth()+1 : `0${activeAt.getMonth()+1}`}월 </h2>
                </div>
                    <div className="flex flex-row items-center gap-1 ">
                        {viewMode === "month" ? (
                            <>
                                <button onClick={() => {
                                    setActiveAt(addOrSubOneMonth(activeAt, "sub"));

                                    setFirstCenter(true);
                                }} className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
                                    <FontAwesomeIcon icon={contentMode === "normal" ? faAngleUp : faAngleLeft} />
                                </button>

                                <button onClick={() => {
                                    setActiveAt(addOrSubOneMonth(activeAt, "add"));

                                    setFirstCenter(true);
                                }}  className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
                                    <FontAwesomeIcon icon={contentMode === "normal" ? faAngleDown : faAngleRight} />
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
                                    className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl"
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
                                    className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl"
                                >
                                    <FontAwesomeIcon icon={faAngleRight} />
                                </button>

                            </>
                        )}
                        <button onClick={activeAtToToday} className="px-3 py-1 font-semibold rounded text-xs bg-gray-50 hover:bg-gray-200 dark:bg-gray-950 hover:dark:bg-gray-800 normal-text  transition-colors duration-150 cursor-pointer border border-gray-300 dark:border-gray-800">오늘</button>
                    </div>
            </div>

            <div className={`flex flex-col gap-2 items-center`}>
                <div className="flex items-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-1 space-x-1 transition-[width] duration-150 user-select-none">
                    <button
                        type="button"
                        onClick={() => setContentMode("normal")}
                        className={`px-1 md:px-2 py-1 text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                            contentMode === "normal"
                                ? "bg-blue-500 text-white"
                                : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                    >
                        일반
                    </button>
                    <button
                        type="button"
                        onClick={() => setContentMode("challenge")}
                        className={`px-1 md:px-2 py-1 text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                            contentMode === "challenge"
                                ? "bg-blue-500 text-white"
                                : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                    >
                        챌린지
                    </button>
                    <button
                        type="button"
                        onClick={() => setContentMode("dday")}
                        className={`px-1 md:px-2 py-1 text-xs font-semibold rounded transition-colors duration-150 cursor-pointer ${
                            contentMode === "dday"
                                ? "bg-blue-500 text-white"
                                : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                    >
                        D-day
                    </button>

                    {contentMode === "normal" ? (<div className="relative flex items-center">
                        <select
                            name="category"
                            id="category"
                            className="self-select-control w-[50px] h-2/3 font-semibold user-select-none text-xs"
                            value={viewMode}
                            onChange={(e) => {
                                const value: string = e.target.value;
                                setIsDragging(false);

                                if (value === "month") {
                                    setViewMode("month");
                                    setTemporaryYear(activeAt.getFullYear());
                                    setTemporaryMonth(activeAt.getMonth() + 1);
                                    return;
                                }

                                if (value === "week" || value === "day") {
                                    const baseYear = startAt ? startAt.getFullYear() : activeAt.getFullYear();
                                    const baseMonth = startAt ? startAt.getMonth() + 1 : activeAt.getMonth() + 1;
                                    const baseDay = startAt
                                        ? startAt.getDate()
                                        : activeDay
                                            ? activeDay
                                            : (activeAt.getMonth() === new Date().getMonth() && activeAt.getFullYear() === new Date().getFullYear())
                                                ? new Date().getDate()
                                                : 1;

                                    const baseDate = new Date(baseYear, baseMonth - 1, baseDay);

                                    setViewMode(value as "week" | "day");

                                    if (value === "week") {
                                        const weekWednesday = getWeekWednesday(baseDate);

                                        setTemporaryYear(weekWednesday.getFullYear());
                                        setTemporaryMonth(weekWednesday.getMonth() + 1);
                                        setTemporaryDay(weekWednesday.getDate());
                                    } else {
                                        setTemporaryYear(baseYear);
                                        setTemporaryMonth(baseMonth);
                                        setTemporaryDay(baseDay);
                                    }
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
                    </div>) : ""}
                </div>
            </div>
        </div>
    );
}
