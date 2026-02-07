// 라이프 봇 각 채팅마다 팔요로한 기능들 (복사, 매모장 저장)

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faClipboard } from "@fortawesome/free-solid-svg-icons";
import {Message, Notepad} from "../../../../../Types/LifeBotTypes";
import {Dispatch, SetStateAction} from "react";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";

interface MessageActionsProps {
    setAlerts: Dispatch<SetStateAction<AlertsData[]>>;
    msg: Message;
    handleNotepad: (notepad: Notepad) => Promise<void>;
}
export default function MessageActions({ setAlerts, msg, handleNotepad } : MessageActionsProps) {
    return (
        <div className="absolute h-[50px] bottom-[-50px] left-0 w-full flex justify-start items-center space-x-2">
            <button
                className="btn"
                title="복사"
                onClick={() => {
                    navigator.clipboard.writeText(msg.text);
                    const alertData:AlertsData = {
                        id: new Date(),
                        message: "복사가 완료되었습니다.",
                        type: "success"
                    }
                    setAlerts(pre => [...pre, alertData]);
                }}
            >
                <FontAwesomeIcon className="normal-text" icon={faCopy}/>
            </button>
            <button
                className="btn"
                title="메모장 저장"
                onClick={() => {
                    if (!msg.id) {
                        const alertData:AlertsData = {
                            id: new Date(),
                            message: "아이디가 존재하지 않아 저장할 수 없습니다.",
                            type: "danger"
                        }
                        setAlerts(pre => [...pre, alertData]);
                        return;
                    } else {
                        const notepad: Notepad = {
                            id: msg.id,
                            text: msg.text
                        };

                        handleNotepad(notepad);
                    }
                }}
            >
                <FontAwesomeIcon className="normal-text" icon={faClipboard}/>
            </button>
        </div>
    );
}
