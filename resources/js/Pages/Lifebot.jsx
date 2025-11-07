import Header from '@/Components/Header/Header.jsx';
import Footer from '@/Components/Footer/Footer.jsx';
import Loading from '@/Components/Elements/Loading.jsx';
import { Head, router } from '@inertiajs/react';
import LifeBotSection from '@/Components/LifeBot/LifeBotSection.jsx';
import SideBarSection from '@/Components/LifeBot/SideBarSection.jsx';
import {useEffect, useState, useCallback, useRef} from "react";
import EditRoom from "@/Components/LifeBot/SideBarSection/RoomList/EditRoom.jsx";

export default function Lifebot({ auth, roomId }) {
    const [sideBar, setSideBar] = useState(() => (window.innerWidth <= 640 ? 0 : 250));
    const [saveWidth, setSaveWidth] = useState(250);
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(roomId || null);
    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [newChat, setNewChat] = useState(false);
    const [editId, setEditId] = useState("");

    const editRoomRef = useRef(null);

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
        if (!editId) return;
        if (editRoomRef.current && !editRoomRef.current.contains(e.target)) {
            setEditId("");
        }
    }, [editId])

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <>
            <Head title="LifeBot" />
            <Header auth={auth} />
            <div className="flex h-[calc(100vh-70px)] transition-[width] duration-300">
                <SideBarSection editRoomRef={editRoomRef} editId={editId} setEditId={setEditId} messages={messages} setMessages={setMessages} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar} setSideBar={setSideBar} setLoading={setLoading}/>
                <LifeBotSection setNewChat={setNewChat} prompt={prompt} setPrompt={setPrompt} messages={messages} setMessages={setMessages} auth={auth} roomId={roomId} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={sideBar} setLoading={setLoading}/>
            </div>
            {editId && <EditRoom editRoomRef={editRoomRef} sideBar={sideBar} />}
            {loading && <Loading />}
        </>
    );
}
