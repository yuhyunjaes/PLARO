// 라이프 봇 각 채팅마다 팔요로한 기능들 (복사, 매모장 저장)

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faClipboard } from "@fortawesome/free-solid-svg-icons";
import {Message, Notepad} from "../../../../../Types/LifeBotTypes";
import {Dispatch, SetStateAction} from "react";

interface MessageActionsProps {
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
    msg: Message;
    handleNotepad: (notepad: Notepad) => Promise<void>;
}
export default function MessageActions({ msg, handleNotepad, setAlertSwitch, setAlertMessage, setAlertType } : MessageActionsProps) {
    return (
        <div className="absolute h-[50px] bottom-[-50px] left-0 w-full flex justify-start items-center space-x-2">
            <button
                className="btn"
                title="복사"
                onClick={() => {
                    navigator.clipboard.writeText(msg.text);
                    setAlertSwitch(true);
                    setAlertType("success");
                    setAlertMessage("복사가 완료되었습니다.");
                }}
            >
                <FontAwesomeIcon className="normal-text" icon={faCopy}/>
            </button>
            <button
                className="btn"
                title="메모장 저장"
                onClick={() => {
                    if (!msg.id) {
                        setAlertSwitch(true);
                        setAlertType("danger");
                        setAlertMessage("아이디가 존재하지 않아 저장할 수 없습니다.");
                        return;
                    }

                    const notepad: Notepad = {
                        id: msg.id,
                        text: msg.text
                    };

                    handleNotepad(notepad);
                }}
            >
                <FontAwesomeIcon className="normal-text" icon={faClipboard}/>
            </button>
        </div>
    );
}
