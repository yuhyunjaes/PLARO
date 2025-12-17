import {Dispatch, SetStateAction, useEffect, useState} from "react";

interface SideBarSectionProps {

    viewMode: "month" | "week" | "day";
    sideBar: number;
    startAt: Date | null;
    setStartAt: Dispatch<SetStateAction<Date | null>>;
    endAt: Date | null;
    setEndAt: Dispatch<SetStateAction<Date | null>>;
}

export default function SideBarSection({  viewMode, sideBar, startAt, setStartAt, endAt, setEndAt }:SideBarSectionProps) {
    return (
        <div className={`${sideBar <= 0 ? "hidden" : ""} border max-h-[calc(100vh-(70px+2.5rem))] sticky top-[1.25rem]   bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-800 rounded-xl normal-text user-select-none`} style={{width: `${sideBar}px`}}>
            <div className="pt-17 px-5 text-xs flex justify-between items-center font-semibold">
                {(startAt && endAt) ? (
                    <>
                        <p>{startAt.getFullYear()}-{startAt.getMonth()+1}-{startAt.getDate()}</p>

                        <p>{endAt.getFullYear()}-{endAt.getMonth()+1}-{endAt.getDate()}</p>
                    </>
                ) : ""}
            </div>
            <div className="p-5 text-xs flex justify-between items-center font-semibold">
                {(startAt && endAt) ? (() => {
                    const startTime = new Date(startAt.getTime()).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    const endTime = new Date(endAt.getTime()).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    return(
                        <>
                            <p>{startTime}</p>
                            <p>{endTime}</p>
                        </>
                    );
                })() : ""}
            </div>
        </div>
    );
}
