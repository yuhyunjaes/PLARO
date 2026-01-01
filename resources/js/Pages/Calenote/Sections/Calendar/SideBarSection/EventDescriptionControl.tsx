import { Dispatch, SetStateAction, useEffect, useRef } from "react";

interface EventDescriptionControlProps {
    updateEvent: () => Promise<void>;
    eventDescription: string;
    setEventDescription: Dispatch<SetStateAction<string>>;
}

export default function EventDescriptionControl({
    updateEvent,
    eventDescription,
    setEventDescription
}: EventDescriptionControlProps) {
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);

        timer.current = window.setTimeout(() => {
            updateEvent();
        }, 500);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [eventDescription]);

    return (
        <div className="px-5 flex flex-wrap">
            <label
                htmlFor="eventDescription"
                className="text-xs font-semibold mb-1"
            >
                설명
            </label>
            <textarea
                id="eventDescription"
                className="border bg-transparent rounded outline-none border-gray-300 w-full dark:border-gray-800 font-semibold text-xs min-h-[70px] max-h-[150px] p-1"
                placeholder="설명"
                value={eventDescription ? eventDescription : ""}
                onChange={(e) => setEventDescription(e.target.value)}
            />
        </div>
    );
}
