// 라이프 봇 채팅 위치, 컬러 기능

import MessageActions from "./MessageActions";
import { Message, Notepad } from "../../../../../Types/LifeBotTypes";
import {Dispatch, SetStateAction} from "react";

interface MessageBubbleProps {
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
    msg: Message;
    handleNotepad: (notepad: Notepad) => Promise<void>;
}


export default function MessageBubble({ msg, handleNotepad, setAlertSwitch, setAlertMessage, setAlertType } : MessageBubbleProps) {
    const isUser = msg.role === "user";

    return (
        <div
            className={`flex chat-item mb-[100px] transition-opacity duration-300 ${
                isUser ? "justify-end" : "justify-start relative"
            }`}
        >
            <div
                className={`p-3 mx-0 rounded-[0.75rem] shadow-sm max-w-[70%] whitespace-pre-wrap break-words font-semibold ${
                    isUser ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-200 dark:border-gray-800"
                }`}
            >
                {msg.text}
            </div>

            {!isUser && msg.id && <MessageActions msg={msg} handleNotepad={handleNotepad} setAlertSwitch={setAlertSwitch} setAlertMessage={setAlertMessage} setAlertType={setAlertType} />}
        </div>
    );
}
