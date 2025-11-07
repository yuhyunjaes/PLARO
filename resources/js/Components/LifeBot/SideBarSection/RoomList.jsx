import {useCallback, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

export default function RoomList({ sideBar = false, auth, setLoading, setRooms, rooms, setChatId, chatId, editId, setEditId, editRoomRef }) {
    const getRooms = useCallback(async () => {
        if(!auth.user) return;
        setLoading(true);
        try {
            const res = await axios.get("/api/rooms");
            const data = res.data;
            setRooms(data.rooms);
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false);
        }
    }, [auth])

    useEffect(() => {
        getRooms();
    }, []);

    return (
        <>
            <div className={`my-3 ${sideBar ? "block" : "hidden"}`}>
                <p className="text-xs py-2 font-semibold mx-5 text-gray-950 dark:text-white">채팅</p>
                {rooms.map((room) => (
                    <div onClick={() => {
                        if(room.room_id === chatId) return;
                        setChatId(room.room_id);
                        router.visit(`/lifebot/${room.room_id}`, {
                            method: "get",
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }} key={room.room_id} className={`btn group transition-colors duration-300 w-full text-gray-950 dark:text-white flex justify-between items-center py-2
                ${chatId === room.room_id ? "bg-gray-200 dark:bg-gray-600" : "hover:bg-gray-200 dark:hover:bg-gray-600"}
                `}>
                        <span className="m-0">{room.title}</span>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            setEditId(room.room_id);
                            editRoomRef.current.
                        }} className="hidden group-[:hover]:block cursor-pointer">
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}
