// 라이프 봇 채팅 영역

import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import MessageList from "./PlaroAiSection/MessageList";
import ChatInput from "./PlaroAiSection/ChatInput";
import FormModal from "../../../Components/Elements/FormModal";
import axios from "axios";
import { Dispatch, SetStateAction, RefObject } from 'react';
import { Categories, AuthUser, Message, Room} from "../../../Types/PlaroAiTypes";
import {AlertsData} from "../../../Components/Elements/ElementsData";
import {GlobalUIContext} from "../../../Providers/GlobalUIContext";
import {DateUtils} from "../../../Utils/dateUtils";

interface PlaroAiSectionProps {
    now: Date;
    getMessages: () => Promise<void>;
    handleDeleteChatCategories: (roomId: string) => Promise<void>;
    setNewChat: Dispatch<SetStateAction<boolean>>;
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
    roomPromptProfile: string;
    useHistory: boolean;
}

export default function PlaroAiSection({ now, getMessages, handleDeleteChatCategories, setNewChat, chatId, setChatId, setRooms, auth, roomId, setMessages, messages, prompt, setPrompt, roomCategories, setRoomCategories, roomPromptProfile, useHistory } : PlaroAiSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
        sideBar
    } = ui;

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
                const alertData:AlertsData = {
                    id: DateUtils.now(),
                    message: '메모장에 저장되었습니다.',
                    type: "success"
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [category]);

    const categorySubmit = useCallback(async (): Promise<false | undefined> => {
        if (!category) return false;

        const msg = { ...saveMsg, category };
        await handleNotepad(msg);

        setSaveMsg([]);
        setCategory("");

        return undefined;
    }, [category, saveMsg]);

    return (
        <main className="bg-gray-100 relative dark:bg-gray-950 flex-1 h-full">
            {categoryToggle && (
                <FormModal Submit={categorySubmit} toggle={categoryToggle} setToggle={setCategoryToggle} Title="메모장 저장" SubmitText="저장" Label="카테고리" Type="text" Name="category" Id="category" onChange={setCategory} Value={category}/>
            )}
            <MessageList chatId={chatId} messages={messages} handleNotepad={handleNotepad}/>
            <ChatInput now={now} getMessages={getMessages} roomCategories={roomCategories} setRoomCategories={setRoomCategories} handleDeleteChatCategories={handleDeleteChatCategories} auth={auth} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} roomId={roomId} chatId={chatId} setChatId={setChatId} setRooms={setRooms} setMessages={setMessages} messages={messages} handleNotepad={handleNotepad} roomPromptProfile={roomPromptProfile} useHistory={useHistory}/>
        </main>
    );
}
