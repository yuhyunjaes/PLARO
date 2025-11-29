// 라이프 봇 채팅 영역

import {useCallback, useEffect, useRef, useState} from "react";
import MessageList from "./LifeBotSection/MessageList";
import ChatInput from "./LifeBotSection/ChatInput";
import FormModal from "../../../Components/Elements/FormModal";
import axios from "axios";
import { Dispatch, SetStateAction, RefObject } from 'react';
import {AuthUser, Message, Room} from "../../../Types/LifeBotTypes";

interface LifeBotSectionProps {
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
}

export default function LifeBotSection({ handleDeleteChatCategories, setNewChat, sideBar, setLoading, chatId, setChatId, setRooms, auth, roomId, setMessages, messages, prompt, setPrompt } : LifeBotSectionProps) {
    const [category, setCategory] = useState("");
    const [categoryToggle, setCategoryToggle] = useState(false);
    const [saveMsg, setSaveMsg] = useState([]);

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
            const data = res.data;
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
        <>
            <main className="bg-gray-100 relative dark:bg-gray-950 transition-[width] duration-300" style={{width: `calc(100% - ${sideBar}px`}}>
                {categoryToggle && (
                    <FormModal Submit={categorySubmit} toggle={categoryToggle} setToggle={setCategoryToggle} Title="메모장 저장" SubmitText="저장" Label="카테고리" Type="text" Name="category" Id="category" onChange={setCategory} Value={category}/>
                )}
                <MessageList chatId={chatId} messages={messages} handleNotepad={handleNotepad}/>
                <ChatInput handleDeleteChatCategories={handleDeleteChatCategories} auth={auth} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} setLoading={setLoading} roomId={roomId} chatId={chatId} setChatId={setChatId} setRooms={setRooms} setMessages={setMessages} messages={messages} handleNotepad={handleNotepad}/>
            </main>
        </>
    );
}
