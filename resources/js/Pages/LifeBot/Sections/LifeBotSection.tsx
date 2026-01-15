// 라이프 봇 채팅 영역

import {useCallback, useEffect, useRef, useState} from "react";
import MessageList from "./LifeBotSection/MessageList";
import ChatInput from "./LifeBotSection/ChatInput";
import FormModal from "../../../Components/Elements/FormModal";
import axios from "axios";
import { Dispatch, SetStateAction, RefObject } from 'react';
import { Categories, AuthUser, Message, Room} from "../../../Types/LifeBotTypes";
import Alert from "../../../Components/Elements/Alert";

interface LifeBotSectionProps {
    now: Date;
    getMessages: () => Promise<void>;
    alertSwitch: boolean;
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    alertMessage: any;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    alertType: "success" | "danger" | "info" | "warning";
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
    handleDeleteChatCategories: (roomId: string) => Promise<void>;
    setNewChat: Dispatch<SetStateAction<boolean>>;
    sideBar: number;
    setLoading: Dispatch<SetStateAction<boolean>>;
    chatId: string | null;
    setChatId: Dispatch<SetStateAction<string | null>>;
    setRooms: Dispatch<SetStateAction<Room[]>>;
    auth: {
        user: AuthUser | null;
    };
    roomId: string | null;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
    prompt: string;
    setPrompt: Dispatch<SetStateAction<string>>;
    roomCategories: Categories[];
    setRoomCategories: Dispatch<SetStateAction<Categories[]>>;
}

export default function LifeBotSection({ now, getMessages, alertSwitch, setAlertSwitch, alertMessage, setAlertMessage, alertType, setAlertType, handleDeleteChatCategories, setNewChat, sideBar, setLoading, chatId, setChatId, setRooms, auth, roomId, setMessages, messages, prompt, setPrompt, roomCategories, setRoomCategories } : LifeBotSectionProps) {
    const [category, setCategory] = useState<string>("");
    const [categoryToggle, setCategoryToggle] = useState<boolean>(false);
    const [saveMsg, setSaveMsg] = useState<[]>([]);

    const handleNotepad = useCallback(async (msg: any) => {
        if (!msg?.text || !msg?.id) return;

        if(!msg?.category) {
            setCategoryToggle(true);
            setSaveMsg(msg);
            return;
        }

        setLoading(true);
        try {
            const content = msg.text;
            const chat_id = msg.id;
            const category = msg.category;

            if(!content || !chat_id) return;

            const res = await axios.post("/api/notepads", {
                content: content,
                chat_id: chat_id,
                category: category
            })
            if(res.data.success) {
                setAlertSwitch(true);
                setAlertType("success");
                setAlertMessage("메모장에 저장되었습니다.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [category]);

    const categorySubmit = useCallback(() => {
        if(!category) return;
        const msg = {...saveMsg, category};
        handleNotepad(msg);
        setSaveMsg([]);
        setCategory("");
    }, [category, saveMsg]);

    return (
        <main className="bg-gray-100 relative dark:bg-gray-950 transition-[width] duration-300" style={{width: `calc(100% - ${sideBar}px`}}>
            {alertSwitch && <Alert close={setAlertSwitch} message={alertMessage} type={alertType} width={sideBar}/>}
            {categoryToggle && (
                <FormModal Submit={categorySubmit} toggle={categoryToggle} setToggle={setCategoryToggle} Title="메모장 저장" SubmitText="저장" Label="카테고리" Type="text" Name="category" Id="category" onChange={setCategory} Value={category}/>
            )}
            <MessageList setAlertSwitch={setAlertSwitch} setAlertMessage={setAlertMessage} setAlertType={setAlertType} chatId={chatId} messages={messages} handleNotepad={handleNotepad}/>
            <ChatInput now={now} getMessages={getMessages} setAlertSwitch={setAlertSwitch} setAlertMessage={setAlertMessage} setAlertType={setAlertType} roomCategories={roomCategories} setRoomCategories={setRoomCategories} handleDeleteChatCategories={handleDeleteChatCategories} auth={auth} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} setLoading={setLoading} roomId={roomId} chatId={chatId} setChatId={setChatId} setRooms={setRooms} setMessages={setMessages} messages={messages} handleNotepad={handleNotepad}/>
        </main>
    );
}
