import Header from '@/Components/Header/Header.jsx';
import Footer from '@/Components/Footer/Footer.jsx';
import Loading from '@/Components/Elements/Loading.jsx';
import Modal from '@/Components/Elements/Modal.jsx';
import { Head, router } from '@inertiajs/react';
import LifeBotSection from '@/Components/LifeBot/LifeBotSection.jsx';
import SideBarSection from '@/Components/LifeBot/SideBarSection.jsx';
import {useEffect, useState, useCallback, useRef} from "react";
import EditRoom from "@/Components/LifeBot/SideBarSection/RoomList/EditRoom.jsx";

export default function Lifebot({ auth, roomId }) {
    const [sideBar, setSideBar] = useState(() => (window.innerWidth <= 640 ? 0 : 250));
    const [saveWidth, setSaveWidth] = useState(250);
    const [loadingToggle, setLoading] = useState(false);
    const [chatId, setChatId] = useState(roomId || null);
    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [newChat, setNewChat] = useState(false);
    const [editId, setEditId] = useState("");

    const editRoomRef = useRef(null);
    const [baseTop, setBaseTop] = useState(0);
    const [baseScroll, setBaseScroll] = useState(0);

    const [editStatus, setEditStatus] = useState("");
    const [temporaryEditTitle, setTemporaryEditTitle] = useState("");

    const [modal, setModal] = useState(false);

    const [smRoomList, setSmRoomList] = useState(window.innerWidth <= 640);
    const [smRoomListToggle, setSmRoomListToggle] = useState(false);

    useEffect(() => {
        const smSideBar = () => {
            setSmRoomList(window.innerWidth <= 640);
            if (window.innerWidth <= 640) {
                setSmRoomListToggle(false);
                setEditId("");
                setEditStatus("");
                setModal(false);
            }
        };
        window.addEventListener('resize', smSideBar);
        return () => window.removeEventListener('resize', smSideBar);
    }, []);

    const handleResize = useCallback(() => {
        setSideBar((prev) => {
            if (window.innerWidth <= 640) {
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
        if (roomId) setChatId(roomId);
    }, [roomId]);

    const getMessages = useCallback(async () => {
        if (!chatId || newChat) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/messages/${chatId}`);
            const data = res.data;
            if(data.success) {
                setMessages([]);
                setPrompt("");
                setMessages(data.messages || []);
            } else {
                router.visit('/lifebot');
            }
        } catch (err) {
            console.error("메시지 불러오기 오류:", err);
        } finally {
            setLoading(false);
        }
    }, [chatId, newChat]);

    useEffect(() => {
        getMessages();
    }, [chatId]);

    const handleClickOutside = useCallback((e) => {
        if (!editId || modal) return;
        if (editRoomRef.current && !editRoomRef.current.contains(e.target)) {
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
            return;
        }

        const title = rooms.filter(item => item.room_id === editId)[0].title;
        setTemporaryEditTitle(title);
        setEditStatus("update");
    }, [editId, editStatus]);

    const deleteRoom = useCallback(() => {
        if(!editId) return;
        setEditStatus("delete");
        setModal(true);
    }, [editId]);

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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId, temporaryEditTitle, setRooms]);

    const handleDeleteRoom = useCallback( async () => {
        if(!editId) return;

        setLoading(true);

        try {
            const res = await axios.delete(`/api/rooms/${editId}`);
            if(res.data.success) {
                if(editId === chatId) {
                    router.visit('/lifebot');
                }
                setEditStatus("");
                setEditId("");
                setRooms((prevRooms) => prevRooms.filter(room => room.room_id !== editId));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId, setRooms]);

    return (
        <>
            <Head title="LifeBot" />
            <Header auth={auth} />
            <div className="relative overflow-hidden flex h-[calc(100vh-70px)] transition-[width] duration-300">
                <SideBarSection setSmRoomListToggle={setSmRoomListToggle} smRoomListToggle={smRoomListToggle} smRoomList={smRoomList} setSmRoomLis={setSmRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} baseScroll={baseScroll} setBaseScroll={setBaseScroll} baseTop={baseTop} setBaseTop={setBaseTop} editRoomRef={editRoomRef} editId={editId} setEditId={setEditId} messages={messages} setMessages={setMessages} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar} setSideBar={setSideBar} setLoading={setLoading}/>
                <LifeBotSection setSmRoomListToggle={setSmRoomListToggle} smRoomListToggle={smRoomListToggle} setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} messages={messages} setMessages={setMessages} auth={auth} roomId={roomId} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar} setLoading={setLoading}/>
                <EditRoom smRoomList={smRoomList} smRoomListToggle={smRoomListToggle} EditTitle={EditTitle} deleteRoom={deleteRoom} editRoomRef={editRoomRef} sideBar={sideBar} toggle={editId} />
            </div>
            {modal && <Modal Title="채팅방 삭제" onClickEvent={handleDeleteRoom} setModal={setModal} setEditId={setEditId} setEditStatus={setEditStatus} Text={editId && '"'+rooms.filter(item => item.room_id === editId)[0].title+'"' + " 채팅방을 정말 삭제 하시겠습니까?"} Position="top" CloseText="삭제" />}
            <Loading Toggle={loadingToggle} />
        </>
    );
}
