import {useCallback, useRef, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faSpinner } from "@fortawesome/free-solid-svg-icons";
import {DEFAULT_PROMPT, HISTORY_PROMPT, TITLE_PROMPT} from "../../../../../config/prompt.js";
import {router} from "@inertiajs/react";
export default function ChatInput({ chatId, setChatId, setRooms, setMessages, messages, handleNotepad, roomId, setLoading, prompt, setPrompt, setNewChat, auth }) {
    const [load, setLoad] = useState(false);
    const textareaRef = useRef(null);
    const START_API = import.meta.env.VITE_GEMINI_API_START;
    const END_API = import.meta.env.VITE_GEMINI_API_END;
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const MODEL_NAME = import.meta.env.VITE_GEMINI_API_MODEL;

    const handleSubmit = useCallback(async () => {
        if (!prompt.trim()) return;
        setLoad(true);
        const titlePrompt = `USER_TEXT***${prompt}***${TITLE_PROMPT}`;
        let newChat = false;
        try {
            let currentRoomId = chatId;
            if (!chatId && !currentRoomId) {
                newChat = true;
                setNewChat(true);
                try {
                    const titleRes = await axios.post("/api/lifebot/title", {
                        model_name: MODEL_NAME,
                        prompt: titlePrompt,
                    });
                    const title = titleRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt.trim();

                    const roomRes = await axios.post("/api/rooms", {
                        title,
                        model_name: MODEL_NAME,
                    });

                    const roomData = roomRes.data;
                    if (roomData.success) {
                        currentRoomId = roomData.room_id;
                        setChatId(roomData.room_id);

                        const newRoom = { room_id: roomData.room_id, title: roomData.title };
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
                { role: "user", text: prompt },
                { role: "model", text: "" },
            ]);
            setPrompt("");
            if (textareaRef.current) textareaRef.current.style.height = "40px";

            const historyText =
                messages && messages.length > 0
                    ? JSON.stringify(messages)
                        .replace(/\\/g, "\\\\")
                        .replace(/`/g, "\\`")
                    : "empty-message";

            const response = await fetch(`${START_API}${MODEL_NAME}${END_API}${API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: DEFAULT_PROMPT },
                                { text: HISTORY_PROMPT },
                                { text: `HISTORY-JSON***${historyText}***` },
                                { text: `USER-TEXT***${prompt}***` },
                            ],
                        },
                    ],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 5120 },
                }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let fullText = "";
            let aiCode = "";
            let combined = "";

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

                            const patternStart = combined.indexOf("***{");
                            const patternEnd = combined.lastIndexOf("}***");
                            let cleaned = combined;

                            if (patternStart !== -1 && patternEnd !== -1 && patternEnd > patternStart) {
                                cleaned = combined.slice(0, patternStart) + combined.slice(patternEnd + 4);
                            }

                            fullText = cleaned.trim();
                            if (fullText.includes("***{")) break;

                            setMessages((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1].text = fullText;
                                return updated;
                            });
                        }
                    } catch (err) {
                        console.warn("파싱 오류:", err);
                    }
                }
            }

            const startIdx = combined.indexOf("***{");
            const endIdx = combined.lastIndexOf("}***");

            if (startIdx !== -1 && endIdx !== -1) {
                aiCode = combined.slice(startIdx + 3, endIdx + 1).trim();
                fullText = (combined.slice(0, startIdx) + combined.slice(endIdx + 4)).trim();
            }

            if (fullText.trim().length === 0) {
                alert("AI 응답이 비어있습니다.");
                setLoad(false);
                setPrompt("");
                setLoading(false);
                return;
            }

            let aiArr = [];

            if (aiCode) {
                try {
                    aiArr = [JSON.parse(aiCode)];

                    if (aiArr[0].chat_id) {
                        aiArr = aiArr.map(obj => {
                            const { chat_id, ...rest } = obj;
                            return { id: chat_id, ...rest };
                        });
                    }
                } catch {
                    console.warn("AI JSON 파싱 실패:", aiCode);
                }
            }


            if (aiArr.length > 0) {
                if (aiArr[0].id) {
                    await handleNotepad(aiArr[0]);
                }
                await saveMessageToDB(currentRoomId, prompt, fullText, !aiArr[0].id ? aiArr : '');
            } else {
                await saveMessageToDB(currentRoomId, prompt, fullText, '');
            }

        } catch (err) {
            console.error("Chat submit error:", err);
        } finally {
            if(newChat) {
                setNewChat(false);
            }
            setLoad(false);
            setPrompt("");
        }
    }, [prompt, chatId, MODEL_NAME, roomId]);

    const saveMessageToDB = async (roomId, userText, aiText, arr) => {
        try {
            const res = await axios.post("/api/messages", {
                room_id: roomId,
                user_message: userText,
                ai_message: aiText,
            });

            const data = res.data;
            if (data.success) {
                if (arr) {
                    arr[0].id = data.ai_id;
                    await handleNotepad(arr[0]);
                }

                setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[updated.length - 2]) updated[updated.length - 2].id = data.user_id;
                    if (updated[updated.length - 1]) updated[updated.length - 1].id = data.ai_id;
                    return updated;
                });

                setRooms((prevRooms) => {
                    const filtered = prevRooms.filter(r => r.room_id !== roomId);
                    const current = prevRooms.find(r => r.room_id === roomId);
                    if (current) {
                        return [current, ...filtered];
                    }
                    return prevRooms;
                });
            }
        } catch (err) {
            console.error("메시지 저장 오류:", err);
        }
    };

    const handleKeyDown = useCallback(
        (e) => {
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
                {!chatId && (
                    <h1 className="normal-text flex absolute top-[-150%] text-2xl sm:text-4xl font-semibold">
                        <p className="hidden md:block">{auth.user.name.slice(1)},&nbsp;</p>
                        새로운 대화를 시작해요.
                    </h1>
                )}
                <div className="w-full max-w-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-[2rem] shadow-sm p-2 flex items-end overflow-hidden">
                            <textarea
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
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows="1"
                                disabled={load}
                            />

                    <button
                        onClick={handleSubmit}
                        className="w-[40px] h-[40px] bg-gray-950 dark:bg-white border rounded-full px-3 ml-2 flex justify-center items-center"
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
