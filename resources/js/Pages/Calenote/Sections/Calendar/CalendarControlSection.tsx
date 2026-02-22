import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faChevronDown, faEllipsisVertical} from "@fortawesome/free-solid-svg-icons";
import {DateUtils} from "../../../../Utils/dateUtils";

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

    const [contentChangeToggle, setContentChangeToggle] = useState<boolean>(false);
    const contentChangeAreaRef = useRef<HTMLDivElement | null>(null);
    const contentModeMeta: Record<"normal" | "challenge" | "dday", {label: string; mobileLabel: string; activeClass: string}> = {
        normal: {
            label: "일반 모드",
            mobileLabel: "일반",
            activeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        },
        challenge: {
            label: "챌린지 모드",
            mobileLabel: "챌린지",
            activeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        },
        dday: {
            label: "D-day 모드",
            mobileLabel: "D-day",
            activeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        }
    };

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contentChangeAreaRef.current && !contentChangeAreaRef.current.contains(e.target as Node)) {
                if(contentChangeToggle) {
                    setContentChangeToggle(false);
                }
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [contentChangeToggle]);

    return(
        <div className="rounded-xl flex justify-between items-center px-5 pt-5">
            <div className="flex items-center space-x-1">
                <h2 className="text-lg md:text-2xl normal-text font-semibold user-select-none">{activeAt.getFullYear()}
                    -
                    {(activeAt.getMonth()+1 > 9) ? activeAt.getMonth()+1 : `0${activeAt.getMonth()+1}`}월 </h2>

                {viewMode === "month" ? (
                    <>
                        <button onClick={() => {
                            setActiveAt(addOrSubOneMonth(activeAt, "sub"));

                            setFirstCenter(true);
                        }} className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
                            <FontAwesomeIcon icon={faAngleUp} />
                        </button>

                        <button onClick={() => {
                            setActiveAt(addOrSubOneMonth(activeAt, "add"));

                            setFirstCenter(true);
                        }}  className="text-gray-500 hover:text-gray-400 transition-colors duration-150 cursor-pointer text-base md:text-xl">
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
            </div>

            <div className="flex items-center relative">
                <div
                    className={`mr-1 rounded border px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold transition-colors ${contentModeMeta[contentMode].activeClass}`}
                    aria-live="polite"
                    title={`현재 ${contentModeMeta[contentMode].label}`}
                >
                    <span className="md:hidden">{contentModeMeta[contentMode].mobileLabel}</span>
                    <span className="hidden md:inline">{contentModeMeta[contentMode].label}</span>
                </div>
                <button onClick={activeAtToToday} className="px-3 py-1 mr-1 font-semibold rounded text-xs bg-gray-50 hover:bg-gray-200 dark:bg-gray-950 hover:dark:bg-gray-800 normal-text  transition-colors duration-150 cursor-pointer border border-gray-300 dark:border-gray-800">오늘</button>

                <div className="relative flex items-center mr-1">
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
                                        : (activeAt.getMonth() === DateUtils.now().getMonth() && activeAt.getFullYear() === DateUtils.now().getFullYear())
                                            ? DateUtils.now().getDate()
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
                </div>

                <button onClick={() => setContentChangeToggle(!contentChangeToggle)} className="flex items-center justify-center cursor-pointer">
                    <FontAwesomeIcon className="normal-text pointer-events-none pe-2 text-xs" icon={faEllipsisVertical}/>
                </button>

                {contentChangeToggle ? (
                    <div ref={contentChangeAreaRef} className="flex flex-col bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded p-1 space-y-1 user-select-none absolute top-6 z-[1] right-4">
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
                    </div>
                ) : ""}
            </div>
        </div>
    );
}
