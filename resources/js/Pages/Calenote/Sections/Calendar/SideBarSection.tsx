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
    const eventStartAt =
        startAt && endAt ? startAt : null;
    const add15Minutes = (date: Date) => {
        // 23:45 이상이면 하루 끝으로 고정
        if (
            date.getHours() === 23 &&
            date.getMinutes() >= 45
        ) {
            return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                23,
                59,
                59,
                999
            );
        }

        const newDate = new Date(date.getTime());
        newDate.setMinutes(newDate.getMinutes() + 15);
        return newDate;
    };


    const isEndOfDay = (date: Date) =>
        date.getHours() === 23 &&
        date.getMinutes() === 59 &&
        date.getSeconds() === 59;

    const toEndOfDay = (date: Date) =>
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23,
            59,
            59,
            999
        );

    const eventEndAt =
        startAt && endAt
            ? isEndOfDay(endAt)
                ? toEndOfDay(endAt)
                : add15Minutes(endAt)
            : null;


    return (
        <div className={`${sideBar <= 0 ? "hidden" : ""} border max-h-[calc(100vh-(70px+2.5rem))] sticky top-[1.25rem]   bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-800 rounded-xl normal-text user-select-none`} style={{width: `${sideBar}px`}}>
            <div className="pt-17 px-5 text-xs flex justify-between items-center font-semibold">
                {(eventStartAt && eventEndAt) ? (
                    <>
                        <p>{eventStartAt.getFullYear()}-{eventStartAt.getMonth()+1}-{eventStartAt.getDate()}</p>

                        <p>{eventEndAt.getFullYear()}-{eventEndAt.getMonth()+1}-{eventEndAt.getDate()}</p>
                    </>
                ) : ""}
            </div>
            <div className="p-5 text-xs flex justify-between items-center font-semibold">
                {(eventStartAt && eventEndAt) ? (() => {
                    const startTime = new Date(eventStartAt.getTime()).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    const endTime = new Date(eventEndAt.getTime()).toLocaleTimeString('ko-KR', {
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
