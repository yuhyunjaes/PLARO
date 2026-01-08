import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import {ReminderData} from "../../Pages/Calenote/Sections/CalenoteSectionsData";
import axios from "axios";
interface ReminderProps {
    title: string;
    message: string;
    color: string | undefined;
    uuid: string;
    type: "reminder";
    url: string;
    arr: Dispatch<SetStateAction<any[]>>;
    id: number;
}

export default function Reminder({ title, message, color, uuid, type, url, arr, id }:ReminderProps) {
    const [timer, setTimer] = useState<number>(0);
    useEffect(() => {
        const duration = 5000;
        const intervalTime = 30;
        const increment = 100 / (duration / intervalTime);

        const interval = setInterval(() => {
            setTimer((prev) => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => clearInterval(interval);
    }, []);

    const updateReminder = async () => {
        try {
            const res = await axios.put(`/api/event/${uuid}/reminders/${id}`);
            if(res.data.success) {
                arr(prev =>
                    prev.map(pre =>
                        pre.id === id
                            ? { ...pre, read: 1 }
                            : pre
                    )
                );
            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if (timer < 100) return;
        setTimeout(async () => {
            await updateReminder();
        }, 500);
    }, [timer]);

    let icon:string;

    switch (type) {
        case "reminder":
            icon = "🔔";
            break;
    }

    let bodyColor = null;

    switch (color) {
        case "bg-red-500":
            bodyColor = "bg-red-500/40";
            break;
        case "bg-orange-500":
            bodyColor = "bg-orange-500/40";
            break;
        case "bg-yellow-500":
            bodyColor = "bg-yellow-500/40";
            break;
        case "bg-green-500":
            bodyColor = "bg-green-500/40";
            break;
        case "bg-blue-500":
            bodyColor = "bg-blue-500/40";
            break;
        case "bg-purple-500":
            bodyColor = "bg-purple-500/40";
            break;
        case "bg-gray-500":
            bodyColor = "bg-gray-500/40";
            break;
    }

    return (
        <div onClick={async () => {
            setTimer(100);
        }} className={`cursor-pointer w-[200px] sm:w-[250px] md:w-[300px] overflow-hidden h-[90px] backdrop-blur-sm rounded flex flex-row ${(timer >= 100) ? "animate-out-reminder" : "animate-in-reminder"} relative pointer-events-auto`}>
            <div className={`w-[7px] ${color}`}></div>
            <div className={`flex-1 flex ${bodyColor}`}>
                <div className="w-[20%] flex justify-center items-center">
                    <p className="text-2xl">{icon}</p>
                </div>
                <div className="w-[80%] flex items-center pr-[7px]">
                    <div className="space-y-2">
                        <div
                            className="text-white font-semibold"
                            dangerouslySetInnerHTML={{ __html: title }}
                        />
                        <p className="font-semibold hidden md:block text-sm text-white">{message}</p>
                    </div>
                </div>
            </div>
            <div className="absolute left-0 bottom-0 h-[5px] bg-white" style={{width: `${timer}%`}}></div>
        </div>
    );
}
