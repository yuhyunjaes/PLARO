// 라이프 봇 채팅 영역

import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import MessageList from "./PlaroAiSection/MessageList";
import ChatInput from "./PlaroAiSection/ChatInput";
import FormModal from "../../../Components/Elements/FormModal";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
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
    mdRoomList: boolean;
    mdRoomListToggle: boolean;
    setMdRoomListToggle: Dispatch<SetStateAction<boolean>>;
}

export default function PlaroAiSection({ now, getMessages, handleDeleteChatCategories, setNewChat, chatId, setChatId, setRooms, auth, roomId, setMessages, messages, prompt, setPrompt, roomCategories, setRoomCategories, roomPromptProfile, useHistory, mdRoomList, mdRoomListToggle, setMdRoomListToggle } : PlaroAiSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("GlobalProvider context is required");
    }

    const {
        setAlerts,
    } = ui;

    const [category, setCategory] = useState<string>("");
    const [categoryToggle, setCategoryToggle] = useState<boolean>(false);
    const [saveMsg, setSaveMsg] = useState<[]>([]);

    const normalizeNotepadMarkdown = useCallback((raw: string): string => {
        const text = (raw ?? "")
            .replace(/```(?:markdown|md)?\s*([\s\S]*?)```/gi, "$1")
            .replace(/\r\n/g, "\n")
            .trim();

        if (!text) return "";

        const hasMarkdownSyntax = /(^|\n)\s*(#{1,6}\s|[-*]\s|\d+\.\s|>\s|```|\|.+\||---|\*\*\*|\[[ xX]\])/m.test(text);
        if (hasMarkdownSyntax) {
            return text;
        }

        const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.length === 0) return "";

        const summaryItems: string[] = [];
        const detailItems: string[] = [];

        for (const line of lines) {
            if (/^[\-\*•]\s+/.test(line)) {
                summaryItems.push(`- ${line.replace(/^[\-\*•]\s+/, "")}`);
                continue;
            }

            const keyValue = line.match(/^([^:：]{1,30})\s*[:：]\s*(.+)$/);
            if (keyValue) {
                const key = keyValue[1] ?? "";
                const value = keyValue[2] ?? "";
                detailItems.push(`- **${key.trim()}**: ${value.trim()}`);
                continue;
            }

            detailItems.push(line);
        }

        if (summaryItems.length === 0 && detailItems.length > 0) {
            summaryItems.push(`- ${detailItems[0]}`);
        }

        const detailSection = detailItems
            .map((line) => (/^[-*]\s/.test(line) ? line : `- ${line}`))
            .join("\n");

        return [
            "## 핵심 요약",
            summaryItems.join("\n"),
            "",
            "## 상세 내용",
            detailSection,
            "",
            "## 다음 액션",
            "- [ ] 필요한 작업 정리",
        ].join("\n").trim();
    }, []);

    const handleNotepad = useCallback(async (msg: any) => {
        if (!msg?.text || !msg?.id) return;

        if(!msg?.category) {
            setCategoryToggle(true);
            setSaveMsg(msg);
            return;
        }

        try {
            const content = normalizeNotepadMarkdown(msg.text);
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
        }
    }, [category, normalizeNotepadMarkdown]);

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
            {mdRoomList && (
                <button
                    type="button"
                    onClick={() => setMdRoomListToggle(!mdRoomListToggle)}
                    className="md:hidden absolute top-3 left-3 z-[4] size-9 rounded border border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-950/95 text-gray-800 dark:text-gray-100"
                    aria-label="채팅방 목록 열기"
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            )}
            {categoryToggle && (
                <FormModal Submit={categorySubmit} toggle={categoryToggle} setToggle={setCategoryToggle} Title="메모장 저장" SubmitText="저장" Label="카테고리" Type="text" Name="category" Id="category" onChange={setCategory} Value={category}/>
            )}
            <MessageList chatId={chatId} messages={messages} handleNotepad={handleNotepad}/>
            <ChatInput now={now} getMessages={getMessages} roomCategories={roomCategories} setRoomCategories={setRoomCategories} handleDeleteChatCategories={handleDeleteChatCategories} auth={auth} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} roomId={roomId} chatId={chatId} setChatId={setChatId} setRooms={setRooms} setMessages={setMessages} messages={messages} handleNotepad={handleNotepad} roomPromptProfile={roomPromptProfile} useHistory={useHistory}/>
        </main>
    );
}
