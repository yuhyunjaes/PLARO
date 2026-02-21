import {Dispatch, SetStateAction} from "react";

interface EventColorControlProps {
    disabled: boolean;
    eventColor: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    setEventColor: Dispatch<SetStateAction<"bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500">>;
}

export default function EventColorControl({ disabled, eventColor, setEventColor }:EventColorControlProps) {
    type ColorsArr = {
        title: string;
        color: "bg-red-500" | "bg-orange-500" | "bg-yellow-500" | "bg-green-500" | "bg-blue-500" | "bg-purple-500" | "bg-gray-500";
    }[];

    const colors:ColorsArr = [
        {
            title: "빨간색",
            color: "bg-red-500",
        },
        {
            title: "주황색",
            color: "bg-orange-500",
        },
        {
            title: "노란색",
            color: "bg-yellow-500",
        },
        {
            title: "초록색",
            color: "bg-green-500",
        },
        {
            title: "파랑색",
            color: "bg-blue-500",
        },
        {
            title: "보라색",
            color: "bg-purple-500",
        },
        {
            title: "회색",
            color: "bg-gray-500"
        }
    ];

    return (
        <div className="flex flex-wrap">
            <div className="grid grid-cols-7 gap-2 w-full">
                {colors.map((item) => (
                    <label key={item.color} className="relative cursor-pointer size-4">
                        <input
                            disabled={disabled}
                            type="radio"
                            name="eventColor"
                            value={item.color}
                            checked={eventColor === item.color}
                            onChange={() => setEventColor(item.color)}
                            className="peer hidden"
                        />

                        <div
                            className={`
                size-full rounded
                ${item.color}
                peer-checked:ring-2
                peer-checked:ring-black
                peer-checked:ring-offset-2
            `}
                            title={item.title}
                        />
                    </label>
                ))}

            </div>
        </div>
    );
}
