// 라이프 봇 채팅방 read 영역

import {useCallback, useEffect, useState} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
export default function RoomList({ sideBar = false, auth, setLoading, setRooms, rooms, setChatId, chatId, setEditId, editRoomRef, setBaseTop, setBaseScroll, editId, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, smRoomList, smRoomListToggle, setSmRoomListToggle }) {
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
    }, [getRooms]);

    return (
        <>
            <div className={`my-3 ${(smRoomList || sideBar) ? "block" : "hidden"}`}>
                <p className="text-xs py-2 font-semibold mx-5 text-gray-950 dark:text-white">채팅</p>
                {rooms.map((room) => (
                    <div onClick={() => {
                        if(room.room_id === chatId) return;
                        if(smRoomListToggle) {
                            setSmRoomListToggle(false);
                        }
                        setChatId(room.room_id);
                        router.visit(`/lifebot/${room.room_id}`, {
                            method: "get",
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }} key={room.room_id} className={`btn group transition-colors duration-300 w-full text-gray-950 dark:text-white flex justify-between items-center py-2
                ${chatId === room.room_id ? "bg-blue-500 text-white" : "hover:bg-blue-500 hover:text-white"}
                `}>
                        {
                            (editStatus === "update" && editId === room.room_id) ?
                                (
                                    <input
                                        type="text"
                                        value={temporaryEditTitle}
                                        onChange={(e) => setTemporaryEditTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                if(temporaryEditTitle.trim().length <= 0) return;
                                                e.stopPropagation();
                                                handleEditRoom();
                                            }
                                        }}
                                        autoFocus
                                        className="border-0 bg-transparent outline-none flex-1 max-w-4/5"
                                    />

                                ) :
                                (
                                    <span className="m-0 block max-w-[80%] truncate">
                                      {room.title}
                                    </span>

                                )
                        }
                        <button
                            onClick={(e) => {
                                e.stopPropagation();

                                if(editId === room.room_id) return;
                                setEditId(room.room_id);
                                const sidebar = e.currentTarget.closest('.lifeBot-side-bar');
                                const scrollY = sidebar?.scrollTop || 0;

                                const y = e.currentTarget.getBoundingClientRect().top - (e.currentTarget.offsetHeight * 3);

                                setTimeout(() => {
                                    if (editRoomRef.current) {
                                        editRoomRef.current.style.top = `${y}px`;
                                    }
                                }, 0);

                                setBaseTop(y);
                                setBaseScroll(scrollY);
                            }}
                            className={`${(editId === room.room_id) ? "block" : "block md:hidden group-hover:block cursor-pointer"}`}
                        >
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </button>

                    </div>
                ))}
            </div>
        </>
    );
}
