// 라이프 봇 메인 영역

import { Head, router } from '@inertiajs/react';
import {useEffect, useState, useCallback, useRef, useContext} from "react";
import EditRoom from "./Sections/SideBarSection/RoomList/EditRoom";
import axios from 'axios';
import { Categories, AuthUser, Message, Room } from "../../Types/PlaroAiTypes";
import SideBarSection from "./Sections/SideBarSection";
import PlaroAiSection from "./Sections/PlaroAiSection";
import Modal from "../../Components/Elements/Modal";
import Loading from "../../Components/Elements/Loading";
import Header from "../../Components/Header/Header";
import {AlertsData} from "../../Components/Elements/ElementsData";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";

interface PlaroAiProps {
    auth: {
        user: AuthUser | null;
    };
    roomId: string | null;
    now: Date;
}


export default function PlaroAi({ auth, roomId, now }: PlaroAiProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        setAlerts,
        loading,
        setLoading,
        sideBar,
        setSideBar,
        saveWidth,
        setSaveWidth,
        sideBarToggle,
        setSideBarToggle
    } = ui;

    const [chatId, setChatId] = useState<string | null>(roomId || null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState<string>("");
    const [newChat, setNewChat] = useState<boolean>(false);
    const [editId, setEditId] = useState<string>("");
    const [roomCategories, setRoomCategories] = useState<Categories[]>([]);

    const editRoomRef = useRef<HTMLDivElement>(null);
    const [baseTop, setBaseTop] = useState<number>(0);
    const [baseScroll, setBaseScroll] = useState<number>(0);

    const [editStatus, setEditStatus] = useState<string>("");
    const [temporaryEditTitle, setTemporaryEditTitle] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [settingsModal, setSettingsModal] = useState<boolean>(false);
    const [summaryModal, setSummaryModal] = useState<boolean>(false);
    const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
    const [summaryText, setSummaryText] = useState<string>("");
    const [roomPromptProfile, setRoomPromptProfile] = useState<string>("");
    const [useHistory, setUseHistory] = useState<boolean>(true);

    const [mdRoomList, setMdRoomList] = useState<boolean>(window.innerWidth <= 767);
    const canUseRoomActions = Boolean(chatId);

    // 사이드바 사이즈 조절
    useEffect(() => {
        const mdSideBar = () => {
            setMdRoomList(window.innerWidth <= 767);
            if (window.innerWidth <= 767) {
                setSideBarToggle(false);
                setEditId("");
                setEditStatus("");
                setModal(false);
            }
        };
        window.addEventListener('resize', mdSideBar);
        return () => window.removeEventListener('resize', mdSideBar);
    }, [setSideBarToggle]);

    const handleResize = useCallback(() => {
        const isMobile = window.innerWidth <= 767;
        if (isMobile) {
            setSideBar(0);
            return;
        }

        setSideBar(prev => (prev === 0 ? saveWidth : prev));
    }, [saveWidth, setSideBar]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (sideBar > 0) {
            setSaveWidth(sideBar);
        }
    }, [sideBar, setSaveWidth]);

    useEffect(() => {
        if (roomId) setChatId(roomId ? roomId : null);
    }, [roomId]);

    useEffect(() => {
        setRoomCategories([]);
    }, [chatId]);

    const getRoomSettings = useCallback(async () => {
        if (!chatId) {
            setRoomPromptProfile("");
            setUseHistory(true);
            return;
        }

        try {
            const res = await axios.get(`/api/rooms/${chatId}/settings`);
            if (res.data.success) {
                const settings = res.data.settings;
                setRoomPromptProfile(settings.prompt_profile ?? "");
                setUseHistory(settings.use_history ?? true);
            }
        } catch (err) {
            console.error(err);
        }
    }, [chatId]);

    useEffect(() => {
        getRoomSettings();
    }, [getRoomSettings]);

    const saveRoomSettings = useCallback(async () => {
        if (!chatId) return;

        setLoading(true);
        try {
            const res = await axios.put(`/api/rooms/${chatId}/settings`, {
                prompt_profile: roomPromptProfile,
                use_history: useHistory,
            });

            if (res.data.success) {
                const alertData: AlertsData = {
                    id: new Date(),
                    message: res.data.message ?? "대화 설정이 저장되었습니다.",
                    type: "success"
                };
                setAlerts(prev => [...prev, alertData]);
                setSettingsModal(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [chatId, roomPromptProfile, useHistory]);

    const generateSummary = useCallback(async () => {
        if (messages.length <= 0) {
            setSummaryText("요약할 대화가 없습니다.");
            return;
        }

        setSummaryLoading(true);
        try {
            const historyText = JSON.stringify(messages)
                .replace(/\\/g, "\\\\")
                .replace(/`/g, "\\`");

            const res = await axios.post("/api/plaroai/chat", {
                model_name: import.meta.env.VITE_GEMINI_API_MODEL || "models/gemini-2.5-flash",
                parts: [
                    { text: "너는 대화 요약 도우미다. 한국어로 핵심만 짧고 명확하게 정리한다." },
                    { text: "출력 형식: 1) 핵심 요약 3줄 2) 결정사항 3) 다음 할 일(체크리스트)" },
                    { text: `HISTORY-JSON***${historyText}***` },
                ],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
            });

            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            setSummaryText(text || "요약을 생성하지 못했습니다.");
        } catch (err) {
            console.error(err);
            setSummaryText("요약 생성 중 오류가 발생했습니다.");
        } finally {
            setSummaryLoading(false);
        }
    }, [messages]);

    const getMessages = useCallback(async () => {
        if (!chatId || newChat) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${chatId}`);
            const data = res.data;
            if(data.success) {
                setMessages([]);
                setMessages(data.messages || []);
            } else {
                router.visit('/plaroai', {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });
                setChatId(null);
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error("메시지 불러오기 오류:", err);
        } finally {
            setLoading(false);
        }
    }, [chatId, newChat]);

    useEffect(() => {
        getMessages();
    }, [getMessages]);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (!editId || modal) return;
        if (editRoomRef.current && !editRoomRef.current.contains(e.target as Node)) {
            setEditId("");
            setEditStatus("");
        }
    }, [editId, modal])

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    const EditTitle = useCallback(() => {
        if(!editId) return;

        if(editId && editStatus === "update") {
            setEditStatus("");
            setEditId("");
            setTemporaryEditTitle("");
            return;
        }

        const room = rooms.find(item => item.room_id === editId);
        if (room) {
            setTemporaryEditTitle(room.title);
            setEditStatus("update");
        }
    }, [editId, editStatus, rooms]);

    const deleteRoom = useCallback(() => {
        if(!editId) return;
        if(temporaryEditTitle) {
            setTemporaryEditTitle("");
        }
        setEditStatus("delete");
        setModal(true);
    }, [editId, temporaryEditTitle]);

    const handleEditRoom = useCallback(async () => {
        if (!editId || !temporaryEditTitle.trim()) return;
        setLoading(true);

        try {
            const res = await axios.put(`/api/rooms/${editId}`, {
                title: temporaryEditTitle.trim(),
            });

            if (res.data.success) {
                setRooms((prevRooms) =>
                    prevRooms.map((room) =>
                        room.room_id === editId
                            ? { ...room, title: temporaryEditTitle.trim() }
                            : room
                    )
                );

                setEditId("");
                setEditStatus("");
                setTemporaryEditTitle("");
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId, temporaryEditTitle]);

    const handleDeleteChatCategories = async (roomId: string) => {
        if(!roomId) return;
        try {
            const res = await axios.delete(`/api/rooms/${roomId}/categories`);
            if(res.data.success) {
                setRoomCategories([]);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const handleDeleteRoom = useCallback( async () => {
        if(!editId) return;

        setLoading(true);

        try {
            const res = await axios.delete(`/api/rooms/${editId}`);
            if(res.data.success) {
                await handleDeleteChatCategories(editId);
                if(editId === chatId) {
                    router.visit(`/plaroai`, {
                        method: "get",
                        preserveState: true,
                        preserveScroll: true,
                    });
                    setChatId(null);
                }
                setEditStatus("");
                setEditId("");
                setRooms((prevRooms) => prevRooms.filter(room => room.room_id !== editId));
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId, chatId]);

    return (
        <>
            <Head title="PlaroAi" />
            <div className="relative overflow-hidden flex h-[calc(100vh-70px)]">
                <SideBarSection setMdRoomListToggle={setSideBarToggle} mdRoomListToggle={sideBarToggle} mdRoomList={mdRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} baseScroll={baseScroll} setBaseScroll={setBaseScroll} baseTop={baseTop} setBaseTop={setBaseTop} editRoomRef={editRoomRef} editId={editId} setEditId={setEditId} setMessages={setMessages} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId}/>
                <div className="flex-1 relative h-full">
                    <div className="absolute top-3 right-3 z-[2] flex items-center gap-2">
                        <div className="relative group">
                            <button
                                disabled={!canUseRoomActions}
                                onClick={async () => {
                                    if (!canUseRoomActions) return;
                                    setSummaryModal(true);
                                    await generateSummary();
                                }}
                                className={`btn text-xs border normal-text ${
                                    canUseRoomActions
                                        ? "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900"
                                        : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                대화 요약
                            </button>
                            {!canUseRoomActions && (
                                <span className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                    채팅방 선택 후 사용 가능
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <button
                                disabled={!canUseRoomActions}
                                onClick={() => {
                                    if (!canUseRoomActions) return;
                                    setSettingsModal(true);
                                }}
                                className={`btn text-xs border normal-text ${
                                    canUseRoomActions
                                        ? "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900"
                                        : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                대화 설정
                            </button>
                            {!canUseRoomActions && (
                                <span className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                    채팅방 선택 후 사용 가능
                                </span>
                            )}
                        </div>
                    </div>
                    <PlaroAiSection now={now} getMessages={getMessages} roomCategories={roomCategories} setRoomCategories={setRoomCategories} handleDeleteChatCategories={handleDeleteChatCategories} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} messages={messages} setMessages={setMessages} auth={auth} roomId={roomId} setRooms={setRooms} chatId={chatId} setChatId={setChatId} roomPromptProfile={roomPromptProfile} useHistory={useHistory}/>
                </div>
                <EditRoom temporaryEditTitle={temporaryEditTitle} handleEditRoom={handleEditRoom} editStatus={editStatus} mdRoomList={mdRoomList} mdRoomListToggle={sideBarToggle} EditTitle={EditTitle} deleteRoom={deleteRoom} editRoomRef={editRoomRef} toggle={editId} />
            </div>
            {settingsModal && (
                <div className="fixed inset-0 z-[999] bg-black/30 flex justify-center items-center px-5" onClick={() => setSettingsModal(false)}>
                    <div className="w-full max-w-[560px] rounded bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="normal-text text-lg font-semibold">대화 설정</h2>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-600 dark:text-gray-300 block">대화 설명 (사용자 맞춤 지시)</label>
                            <textarea
                                value={roomPromptProfile}
                                onChange={(e) => setRoomPromptProfile(e.target.value)}
                                placeholder="예: 답변은 핵심만"
                                className="w-full min-h-[140px] resize-y bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded p-3 text-sm normal-text"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm normal-text">
                                <input
                                    type="checkbox"
                                    checked={useHistory}
                                    onChange={(e) => setUseHistory(e.target.checked)}
                                />
                                이전 대화를 기억
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 ">
                                켜면 맥락을 더 잘 이어가지만 응답이 조금 느려질 수 있고, 끄면 빠르지만 이전 맥락 반영이 줄어듭니다.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSettingsModal(false)} className="btn text-sm text-white bg-gray-700 hover:bg-gray-800">닫기</button>
                            <button onClick={saveRoomSettings} className="btn text-sm text-white bg-blue-500 hover:bg-blue-600">저장</button>
                        </div>
                    </div>
                </div>
            )}
            {summaryModal && (
                <div className="fixed inset-0 z-[999] bg-black/30 flex justify-center items-center px-5" onClick={() => setSummaryModal(false)}>
                    <div className="w-full max-w-[640px] rounded bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="normal-text text-lg font-semibold">대화 요약</h2>
                            <button onClick={generateSummary} className="btn text-xs bg-blue-500 hover:bg-blue-600 text-white">다시 생성</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded p-3">
                            {summaryLoading ? (
                                <p className="text-sm text-gray-500">요약 생성 중...</p>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap normal-text">{summaryText || "요약 결과가 없습니다."}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSummaryModal(false)} className="btn text-sm text-white bg-gray-700 hover:bg-gray-800">닫기</button>
                        </div>
                    </div>
                </div>
            )}
            {modal && <Modal Title="채팅방 삭제" onClickEvent={handleDeleteRoom} setModal={setModal} setEditId={setEditId} setEditStatus={setEditStatus} Text={editId ? '"'+rooms.find(item => item.room_id === editId)?.title+'"' + " 채팅방을 정말 삭제 하시겠습니까?" : undefined} Position="top" CloseText="삭제" />}
        </>
    );
}
