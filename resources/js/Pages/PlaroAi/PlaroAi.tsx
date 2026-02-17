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
        setSaveWidth
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

    const [mdRoomList, setMdRoomList] = useState<boolean>(window.innerWidth <= 768);
    const [mdRoomListToggle, setMdRoomListToggle] = useState<boolean>(false);

    // 사이드바 사이즈 조절
    useEffect(() => {
        const mdSideBar = () => {
            setMdRoomList(window.innerWidth <= 768);
            if (window.innerWidth <= 768) {
                setMdRoomListToggle(false);
                setEditId("");
                setEditStatus("");
                setModal(false);
            }
        };
        window.addEventListener('resize', mdSideBar);
        return () => window.removeEventListener('resize', mdSideBar);
    }, []);

    const handleResize = useCallback(() => {
        setSideBar((prev) => {
            if (window.innerWidth <= 768) {
                return 0;
            } else {
                return prev === 0 ? saveWidth : prev;
            }
        });
    }, [saveWidth]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (sideBar > 0) {
            setSaveWidth(sideBar);
        }
    }, [sideBar]);

    useEffect(() => {
        if (roomId) setChatId(roomId ? roomId : null);
    }, [roomId]);

    useEffect(() => {
        setRoomCategories([]);
    }, [chatId]);

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
                setMessages([]);
            }
            const alertData:AlertsData = {
                id: new Date(),
                message: res.data.message,
                type: res.data.type
            }
            setAlerts(pre => [...pre, alertData]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId, chatId]);

    return (
        <>
            <Head title="PlaroAi" />
            <Header auth={auth} setToggle={setMdRoomListToggle} toggle={mdRoomListToggle} check={mdRoomList} />
            <div className="relative overflow-hidden flex h-[calc(100vh-70px)] transition-[width] duration-300">
                <SideBarSection setMdRoomListToggle={setMdRoomListToggle} mdRoomListToggle={mdRoomListToggle} mdRoomList={mdRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} baseScroll={baseScroll} setBaseScroll={setBaseScroll} baseTop={baseTop} setBaseTop={setBaseTop} editRoomRef={editRoomRef} editId={editId} setEditId={setEditId} setMessages={setMessages} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar} setSideBar={setSideBar}/>
                <PlaroAiSection now={now} getMessages={getMessages} roomCategories={roomCategories} setRoomCategories={setRoomCategories} handleDeleteChatCategories={handleDeleteChatCategories} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} messages={messages} setMessages={setMessages} auth={auth} roomId={roomId} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar}/>
                <EditRoom temporaryEditTitle={temporaryEditTitle} handleEditRoom={handleEditRoom} editStatus={editStatus} mdRoomList={mdRoomList} mdRoomListToggle={mdRoomListToggle} EditTitle={EditTitle} deleteRoom={deleteRoom} editRoomRef={editRoomRef} sideBar={sideBar} toggle={editId} />
            </div>
            {modal && <Modal Title="채팅방 삭제" onClickEvent={handleDeleteRoom} setModal={setModal} setEditId={setEditId} setEditStatus={setEditStatus} Text={editId ? '"'+rooms.find(item => item.room_id === editId)?.title+'"' + " 채팅방을 정말 삭제 하시겠습니까?" : undefined} Position="top" CloseText="삭제" />}
        </>
    );
}
