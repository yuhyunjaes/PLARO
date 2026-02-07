import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faX} from "@fortawesome/free-solid-svg-icons";
import {AlertsData} from "./ElementsData";

interface AlertProps {
    setAlerts: Dispatch<SetStateAction<AlertsData[]>>;
    type: "success" | "danger" | "info" | "warning";
    message: string;
    width?: number;
}

export default function Alert({ setAlerts, type, message, width = 0 }: AlertProps) {
    const [timer, setTimer] = useState<number>(0);

    const alertStyles: Record<
        "success" | "danger" | "info" | "warning",
        { background: string; color: string }
    > = {
        success: { background: "bg-green-500/80", color: "text-green-50" },
        danger: { background: "bg-red-500/80", color: "text-red-50" },
        info: { background: "bg-sky-500/80", color: "text-sky-50" },
        warning: { background: "bg-yellow-500/80", color: "text-yellow-50" }
    };

    const style:{ background: string; color: string } = alertStyles[type];

    useEffect(() => {
        const duration = 3000;
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

    useEffect(() => {
        if (timer < 100) return;
        setTimeout(() => {
            setAlerts(prev => prev.slice(1));
        }, 500);
    }, [timer]);

    return (
        <div
            className={`fixed flex duration-300 transition-[width] justify-between items-center z-[5] right-0 ${style.background} ${style.color} p-5 shadow-lg ${(timer >= 100) ? "animate-out-modal" : "animate-in-modal"}`}
            style={{width: `calc(100% - ${width}px)`}}
        >
            {message}

            <button className="cursor-pointer" onClick={() => {setTimer(100)}}>
                <FontAwesomeIcon icon={faX} />
            </button>
            <div className="absolute left-0 bottom-0 h-[5px] bg-white" style={{width: `${timer}%`}}></div>
        </div>
    );
}
