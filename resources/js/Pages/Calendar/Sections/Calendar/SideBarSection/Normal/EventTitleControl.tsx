import { Dispatch, SetStateAction, useEffect, useRef } from "react";

interface EventTitleControlProps {
    disabled: boolean;
    updateEvent: () => Promise<void>;
    eventTitle: string;
    setEventTitle: Dispatch<SetStateAction<string>>;
}

export default function EventTitleControl({
disabled,
updateEvent,
eventTitle,
setEventTitle
                                          }: EventTitleControlProps) {
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);

        timer.current = window.setTimeout(() => {
            updateEvent();
        }, 500);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [eventTitle]);

    return (
        <div className="px-5">
            <input
                disabled={disabled}
                autoFocus
                type="text"
                id="eventTitle"
                className="border w-full border-gray-300 dark:border-gray-800 px-1 py-2 rounded bg-transparent text-xs font-semibold outline-none"
                placeholder="제목"
                value={eventTitle ? eventTitle : ""}
                onChange={(e) => setEventTitle(e.target.value)}
            />
        </div>
    );
}
