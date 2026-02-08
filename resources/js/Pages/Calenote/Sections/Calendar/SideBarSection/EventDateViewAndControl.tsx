import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {faFloppyDisk} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

interface EventDateViewProps {
    disabled: boolean;
    startAt: Date | null;
    setStartAt: Dispatch<SetStateAction<Date | null>>;
    endAt: Date | null;
    setEndAt: Dispatch<SetStateAction<Date | null>>;
}

function formatDate(date: Date): string {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, '0') + "-" +
        String(date.getDate()).padStart(2, '0');
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export default function EventDateViewAndControl({ disabled, startAt, setStartAt, endAt, setEndAt }:EventDateViewProps) {
    const [editType, setEditType] = useState<"startDate" | "startTime" | "endDate" | "endTime" | null>(null);
    const EditDateAreaRef = useRef<HTMLDivElement>(null);

    const [startAtDate, setStartAtDate] = useState((startAt && endAt) ? formatDate(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
    const [startAtTime, setStartAtTime] = useState((startAt && endAt) ? formatTime(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
    const [endAtDate, setEndAtDate] = useState((startAt && endAt) ? formatDate(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");
    const [endAtTime, setEndAtTime] = useState((startAt && endAt) ? formatTime(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");

    useEffect(() => {
        setStartAtDate((startAt && endAt) ? formatDate(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
        setStartAtTime((startAt && endAt) ? formatTime(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
        setEndAtDate((startAt && endAt) ? formatDate(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");
        setEndAtTime((startAt && endAt) ? formatTime(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");
    }, [startAt, endAt]);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (!editType) return;

        if (EditDateAreaRef.current && !EditDateAreaRef.current.contains(e.target as Node)) {
            setEditType(null);
            resetDates();
        }
    }, [editType]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    const editEventAt = useCallback((type: "startDate" | "startTime" | "endDate" | "endTime" | null) => {
        if(!type || !startAt || !endAt) return;

        const eventDataMap = {
            startDate: startAtDate,
            startTime: startAtTime,
            endDate: endAtDate,
            endTime: endAtTime
        };

        const selectedData = eventDataMap[type];

        if(!selectedData) return;

        if(type.includes("Date")) {
            let [year, month, day] = selectedData.split("-").map(Number);

            if(!year || !month || !day) {
                resetDates();
                return;
            }

            if(year < 2015) {
                year = 2015;
            } else if(year > 5000) {
                year = 5000;
            }

            if(month < 1) {
                month = 1;
            } else if(month > 12) {
                month = 12;
            }

            const lastDayOfMonth = new Date(year, month - 1, 0).getDate();

            if(day < 1) {
                day = 1;
            } else if(day > lastDayOfMonth) {
                day = lastDayOfMonth;
            }

            const isStartDate = type.includes("start");
            const sourceDate = isStartDate ? startAt : endAt;

            const newDate = new Date(
                year,
                month - 1,
                day,
                sourceDate.getHours(),
                sourceDate.getMinutes(),
                sourceDate.getSeconds(),
            );

            if(!newDate) return;

            isStartDate ? setStartAt(newDate) : setEndAt(newDate);
            setEditType(null);

        } else if(type.includes("Time")) {
            const parts = selectedData.split(":").map(Number);
            let hour = parts[0] ?? 0;
            let minute = parts[1] ?? 0;

            if(isNaN(hour) || isNaN(minute)) {
                resetDates();
                return;
            }

            if(hour < 0) {
                hour = 0;
            } else if(hour > 23) {
                hour = 23;
            }

            if(minute < 0) {
                minute = 0;
            } else if(minute > 59) {
                minute = 59;
            }

            const isStartTime = type.includes("start");
            const sourceDate = isStartTime ? startAt : endAt;

            const newDate = new Date(sourceDate);
            newDate.setHours(hour, minute, 0);

            if(!newDate) return;

            isStartTime ? setStartAt(newDate) : setEndAt(newDate);

            setEditType(null);
        }

    }, [startAtDate, startAtTime, endAtDate, endAtTime, startAt, endAt]);

    const resetDates = useCallback(() => {
        setStartAtDate((startAt && endAt) ? formatDate(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
        setStartAtTime((startAt && endAt) ? formatTime(new Date(Math.min(startAt.getTime(), endAt.getTime()))) : "");
        setEndAtDate((startAt && endAt) ? formatDate(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");
        setEndAtTime((startAt && endAt) ? formatTime(new Date(Math.max(startAt.getTime(), endAt.getTime()))) : "");
    }, [startAt, endAt]);

    return (
        <>
            {
                (startAt && endAt) ? (
                    <div className="space-y-2 px-5">
                        <div className="flex">
                            <div className="w-1/2">
                                <p className="normal-text text-xs font-semibold">시작일</p>
                            </div>
                            <div className="w-1/2">
                                <p className="normal-text text-xs font-semibold">종료일</p>
                            </div>
                        </div>
                        <div ref={EditDateAreaRef} className="flex space-x-1">
                            <div className="w-1/2 flex flex-col space-y-1">
                                {
                                    (editType === "startDate" && !disabled) ? (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold flex items-center justify-between">
                                            <input autoFocus={true} type="text" className="truncate max-w-[75%] border-none outline-none" onKeyDown={(e) => {
                                                if(e.key === "Enter") {
                                                    editEventAt("startDate");
                                                    setEditType(null);
                                                }
                                            }} onChange={(e) => setStartAtDate(e.target.value)} value={startAtDate}/>

                                            <button onClick={() => {
                                                editEventAt("startDate");
                                                setEditType(null);
                                            }} className="size-4 rounded bg-green-500 text-white cursor-pointer">
                                                <FontAwesomeIcon icon={faFloppyDisk} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold cursor-pointer" onClick={() => {setEditType("startDate")}}>{formatDate(startAt)}</div>
                                    )
                                }

                                {
                                    (editType === "startTime" && !disabled) ? (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold flex items-center">
                                            <input autoFocus={true} type="text" className="truncate max-w-[75%] border-none outline-none" onKeyDown={(e) => {
                                            if(e.key === "Enter") {
                                                editEventAt("startTime");
                                                setEditType(null);
                                            }
                                        }} onChange={(e) => setStartAtTime(e.target.value)} value={startAtTime}/>
                                            <button onClick={() => {
                                                editEventAt("startTime");
                                                setEditType(null);
                                            }} className="size-4 rounded bg-green-500 text-white cursor-pointer">
                                                <FontAwesomeIcon icon={faFloppyDisk} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold cursor-pointer" onClick={() => {setEditType("startTime")}}>{formatTime(startAt)}</div>
                                    )
                                }
                            </div>

                            <div className="w-1/2 flex flex-col space-y-1">
                                {
                                    (editType === "endDate" && !disabled) ? (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold flex items-center">
                                            <input autoFocus={true} type="text" className="truncate max-w-[75%] border-none outline-none" onKeyDown={(e) => {
                                            if(e.key === "Enter") {
                                                editEventAt("endDate");
                                                setEditType(null);
                                            }
                                        }} onChange={(e) => setEndAtDate(e.target.value)} value={endAtDate}/>
                                            <button onClick={() => {
                                                editEventAt("endDate");
                                                setEditType(null);
                                            }} className="size-4 rounded bg-green-500 text-white cursor-pointer">
                                                <FontAwesomeIcon icon={faFloppyDisk} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold cursor-pointer" onClick={() => {setEditType("endDate")}}>{formatDate(endAt)}</div>
                                    )
                                }

                                {
                                    (editType === "endTime" && !disabled) ? (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold flex items-center">
                                            <input autoFocus={true} type="text" className="truncate max-w-[75%] border-none outline-none" onKeyDown={(e) => {
                                            if(e.key === "Enter") {
                                                editEventAt("endTime");
                                                setEditType(null);
                                            }
                                        }} onChange={(e) => setEndAtTime(e.target.value)} value={endAtTime}/>
                                            <button onClick={() => {
                                                editEventAt("endTime");
                                                setEditType(null);
                                            }} className="size-4 rounded bg-green-500 text-white cursor-pointer">
                                                <FontAwesomeIcon icon={faFloppyDisk} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-300 dark:border-gray-800 p-1 rounded bg-transparent text-xs font-semibold cursor-pointer" onClick={() => {setEditType("endTime")}}>{formatTime(endAt)}</div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="ps-5 text-xs font-semibold">이벤트 날짜를 선택 해 주세요.</p>
                )
            }
        </>
    );
}
