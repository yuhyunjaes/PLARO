// 라이프 봇 프롬프트 전송 및 받기, 채팅에 필요한 영역

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState, KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { prompts } from "../../../../../../config/prompt";


import { router } from "@inertiajs/react";
import {Room, Message, AuthUser, Notepad, Categories} from "../../../../Types/LifeBotTypes";
import axios from "axios";

interface ChatInputProps {
    getMessages: () => Promise<void>;
    setAlertSwitch: Dispatch<SetStateAction<boolean>>;
    setAlertMessage: Dispatch<SetStateAction<any>>;
    setAlertType: Dispatch<SetStateAction<"success" | "danger" | "info" | "warning">>;
    roomCategories: Categories[];
    setRoomCategories: Dispatch<SetStateAction<Categories[]>>;
    handleDeleteChatCategories: (roomId: string) => Promise<void>;
    chatId: string | null;
    setChatId: Dispatch<SetStateAction<string | null>>;
    setRooms: Dispatch<SetStateAction<Room[]>>;
    setMessages: Dispatch<SetStateAction<Message[]>>;
    messages: Message[];
    handleNotepad: (notepad: Notepad) => Promise<void>;
    roomId: string | null;
    setLoading: Dispatch<SetStateAction<boolean>>;
    prompt: string;
    setPrompt: Dispatch<SetStateAction<string>>;
    setNewChat: Dispatch<SetStateAction<boolean>>;
    auth: {
        user: AuthUser | null;
    };
}

export default function ChatInput({
    getMessages,
    setAlertSwitch,
    setAlertMessage,
    setAlertType,
    roomCategories,
    setRoomCategories,
    handleDeleteChatCategories,
    chatId,
    setChatId,
    setRooms,
    setMessages,
    messages,
    handleNotepad,
    setLoading,
    prompt,
    setPrompt,
    setNewChat,
    auth
}: ChatInputProps) {
    const [load, setLoad] = useState<boolean>(false);

    const categoryCandidates = async (roomId: string | null, arr: string[]) => {
        if(!roomId || arr.length <= 0) return;

        if(arr.length > 10) {
            arr = arr.slice(0, 10);
        }

        try {
            const res = await axios.post(`/api/rooms/${roomId}/categories`, {arr});
            if(res.data.success) {
                setRoomCategories(res.data.categories);
            } else {
                setRoomCategories([]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const getCategoryCandidates = useCallback(async () => {
        if (!chatId) return;
        try {
            const res = await axios.get(`/api/rooms/${chatId}/categories`);
            if(res.data.success) {
                setRoomCategories(res.data.categories);
            } else {
                setRoomCategories([]);
            }
        } catch (err) {
            console.log(err);
        }
    }, [chatId])

    useEffect(() => {
        getCategoryCandidates();
    }, [getCategoryCandidates]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const inputSize = useCallback(() => {
        if (!chatId) return;
        setPrompt("");
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "40px";
        }
    }, [chatId, setPrompt]);

    useEffect(() => {
        inputSize();
    }, [inputSize]);

    const handleSubmit = useCallback(async (value: string = "") => {
        const START_API = import.meta.env.VITE_GEMINI_API_START;
        const END_API = import.meta.env.VITE_GEMINI_API_END;
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        const MODEL_NAME = import.meta.env.VITE_GEMINI_API_MODEL;

        const text = value ? value : prompt;
        if (!text.trim()) return;
        setLoad(true);
        const titlePrompt = `USER_TEXT***${text}***${prompts.TITLE_PROMPT}`;
        let newChat = false;

        try {
            let currentRoomId: string | null = chatId ? chatId : null;

            if (!chatId && !currentRoomId) {
                newChat = true;
                setNewChat(true);

                try {
                    const titleRes = await axios.post("/api/lifebot/title", {
                        model_name: MODEL_NAME,
                        prompt: titlePrompt,
                    });

                    const title = titleRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text.trim();
                    const roomRes = await axios.post("/api/rooms", { title, model_name: MODEL_NAME });
                    const roomData = roomRes.data;

                    if (roomData.success) {
                        currentRoomId = roomData.room_id;
                        setChatId(roomData.room_id);

                        const newRoom: Room = { room_id: roomData.room_id, title: roomData.title };
                        setRooms((prev) => [newRoom, ...prev]);

                        router.visit(`/lifebot/${roomData.room_id}`, {
                            method: "get",
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            setMessages((prev) => [
                ...prev,
                { id: null, role: "user", text: text },
                { id: null, role: "model", text: "" },
            ]);

            setPrompt("");
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = "40px";
            }

            const historyText =
                messages && messages.length > 0
                    ? JSON.stringify(messages)
                        .replace(/\\/g, "\\\\")
                        .replace(/`/g, "\\`")
                    : "empty-message";

            // Gemini API 호출
            const response = await fetch(`${START_API}${MODEL_NAME}${END_API}${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompts.DEFAULT_PROMPT },
                                { text: prompts.HISTORY_PROMPT },
                                { text: `HISTORY-JSON***${historyText}***` },
                                { text: `USER-TEXT***${text}***` },
                            ],
                        },
                    ],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 5120 },
                }),
            });

            if (!response.body) {
                throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let aiCode = "";
            let catMatch: RegExpMatchArray | null = null;
            let combined: string = "";
            let fullText: string = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk
                    .split("\n")
                    .filter((line) => line.trim().startsWith("data: "));

                for (const line of lines) {
                    if (line.includes("[DONE]")) continue;

                    try {
                        const json = JSON.parse(line.replace(/^data: /, ""));
                        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

                        if (text) {
                            combined += text;

                            const match = combined.match(/<<<\[([\s\S]*?)\]>>>/);
                            if (match) {
                                catMatch = match; // 마지막 매칭 저장
                                combined = combined.replace(match[0], "");
                            }

                            if (combined.includes('***{')) {
                                const jsonStart = combined.indexOf('***{');
                                fullText = combined.slice(0, jsonStart).trim();
                            } else {
                                fullText = combined.trim();
                            }

                            const aiMatch = fullText.match(/\*\*\*({[\s\S]*?})\*\*\*/);
                            if (aiMatch) fullText = fullText.replace(aiMatch[0], "").trim();

                            setMessages((prev) => {
                                if (!prev.length) return prev;
                                return prev.map((msg, i) =>
                                    i === prev.length - 1
                                        ? { ...msg, text: fullText }
                                        : msg
                                );
                            });
                        }
                    } catch (err) {
                        console.warn("파싱 오류:", err);
                    }
                }
            }

            if (catMatch && currentRoomId) {
                try {
                    const arr = JSON.parse("[" + catMatch[1] + "]");
                    if (arr.length > 0) {
                        await categoryCandidates(currentRoomId, arr);
                    }
                } catch (err) {
                    console.warn("카테고리 배열 파싱 실패:", err);
                }
            } else if (!catMatch && currentRoomId) {
                await handleDeleteChatCategories(currentRoomId);
            }

            const match = combined.match(/\*\*\*({[\s\S]*?})\*\*\*/);
            if (match && match[1]) {
                aiCode = match[1].trim();
                fullText = combined.replace(match[0], "").trim();
            }

            if (fullText.trim().length === 0) {
                setLoad(false);
                setPrompt("");
                setLoading(false);

                if (newChat) {
                    try {
                        const res = await axios.delete(`/api/rooms/${currentRoomId}`);
                        if (res.data.success) {
                            if(currentRoomId) {
                                await handleDeleteChatCategories(currentRoomId);
                            }
                            router.visit(`/lifebot`, {
                                method: "get",
                                preserveState: true,
                                preserveScroll: true,
                            });
                            setAlertSwitch(true);
                            setAlertType("danger");
                            setAlertMessage("연결이 원활하지 않습니다.");

                        }
                    } catch (err) {
                        console.error(err);
                    }
                    return;
                }

                setMessages([]);

                router.visit(`/lifebot${currentRoomId ? "/" + currentRoomId : ""}`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });

                setAlertSwitch(true);
                setAlertType("danger");
                setAlertMessage("연결이 원활하지 않습니다.");

                await getMessages();
                return;
            }

            let aiArr: any[] = [];
            if (aiCode) {
                try {
                    const parsed = JSON.parse(aiCode);
                    aiArr = [parsed];
                    if (aiArr[0]?.chat_id) {
                        aiArr = aiArr.map((obj: any) => {
                            const { chat_id, ...rest } = obj;
                            return { id: chat_id, ...rest };
                        });
                    }
                } catch {
                    console.warn("AI JSON 파싱 실패:", aiCode);
                }
            }

            // DB 저장
            if (aiArr.length > 0) {
                if (aiArr[0]?.id) {
                    await handleNotepad(aiArr[0]);
                }
                await saveMessageToDB(currentRoomId, text, fullText, !aiArr[0]?.id ? aiArr : []);
            } else {
                await saveMessageToDB(currentRoomId, text, fullText, []);
            }

        } catch (err) {
            console.error("Chat submit error:", err);
        } finally {
            if (newChat) setNewChat(false);
            setLoad(false);
            setPrompt("");
        }
    }, [
        prompt,
        chatId,
        messages,
        handleNotepad,
        setChatId,
        setMessages,
        setNewChat,
        setPrompt,
        setRooms,
        setLoading,
    ]);

    const saveMessageToDB = async (roomId: string | null, userText: string, aiText: string, arr: any[]) => {
        try {
            const res = await axios.post("/api/messages", {
                room_id: roomId,
                user_message: userText,
                ai_message: aiText,
            });

            const data = res.data;
            if (data.success) {
                if (arr.length > 0) {
                    arr[0].id = data.ai_id;
                    await handleNotepad(arr[0]);
                }

                setMessages((prev) => {
                    return prev.map((msg, i) => {
                        if (i === prev.length - 2) {
                            return { ...msg, id: data.user_id };
                        }
                        if (i === prev.length - 1) {
                            return { ...msg, id: data.ai_id };
                        }
                        return msg;
                    });
                });

                setRooms((prevRooms) => {
                    const filtered = prevRooms.filter(r => r.room_id !== roomId);
                    const current = prevRooms.find(r => r.room_id === roomId);
                    if (current) return [current, ...filtered];
                    return prevRooms;
                });
            }
        } catch (err) {
            console.error("메시지 저장 오류:", err);
        }
    };

    // Enter 전송
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey && !load) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit, load]
    );

    return (
        <div className="w-full h-[80px]">
            <div
                className={`w-full flex justify-center items-end absolute ${chatId ? "bottom-0 left-0" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"} mb-3 px-5`}
            >
                {!chatId && auth.user && (
                    <h1 className="normal-text flex absolute top-[-150%] text-2xl sm:text-4xl font-semibold">
                        <p className="hidden md:block">{auth.user.name.slice(1)},&nbsp;</p>
                        새로운 대화를 시작해요.
                    </h1>
                )}
                <div className="w-full max-w-3xl bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800 rounded-[2rem] shadow-sm p-2 flex items-end relative">
                    {(roomCategories.length > 0) && (
                        <div className="space-x-2 h-[40px] top-[-40px] left-0 absolute flex justify-start overflow-x-auto scrollbar-thin">
                            {roomCategories.map((item, index) => (
                                <div
                                    onClick={() => {
                                        if (!load) {
                                            handleSubmit(item.category);
                                            setRoomCategories([]);
                                        }
                                    }}
                                    key={index}
                                    className="flex-shrink-0 px-3 h-[80%] cursor-pointer bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 normal-text font-semibold flex justify-center items-center rounded-2xl text-sm sm:text-base"
                                >
                                    {item.category}
                                </div>
                            ))}
                        </div>
                    )}
                    <textarea
                        autoFocus
                        ref={textareaRef}
                        className="
                            prompt-form
                            leading-[40px] ms-2 min-h-[40px] max-h-[150px] font-semibold
                            placeholder-gray-950 dark:placeholder-white focus:bg-transparent border-0
                            text-gray-950 dark:text-white bg-transparent flex-grow overflow-y-auto
                            overflow-x-hidden resize-none outline-none
                            text-xs sm:text-base
                        "
                        placeholder="AI에게 물어볼 내용을 입력하세요"
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={1}
                        disabled={load}
                    />

                    <button
                        onClick={() => {
                            handleSubmit();
                        }}
                        className="w-[40px] h-[40px] bg-gray-950 dark:bg-white border rounded-full px-3 ml-2 flex justify-center items-center cursor-pointer"
                    >
                        {load ? (
                            <div className="animate-spin m-0 p-0 w-[1rem] text-white dark:text-gray-950 h-[1rem] flex justify-center items-center">
                                <FontAwesomeIcon icon={faSpinner} />
                            </div>
                        ) : (
                            <FontAwesomeIcon icon={faArrowUp} className="text-white dark:text-gray-950" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
