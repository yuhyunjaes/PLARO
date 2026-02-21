// 라이프 봇 채팅방 read 영역

import {Dispatch, SetStateAction, useCallback, useContext, useEffect} from "react";
import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import {AuthUser, Room } from "../../../../Types/PlaroAiTypes";
import axios from "axios";
import {GlobalUIContext} from "../../../../Providers/GlobalUIContext";

interface RoomListProps {
    sideBar?: boolean;
    auth: {
        user: AuthUser | null;
    };
    rooms: Room[];
    setRooms: Dispatch<SetStateAction<Room[]>>;
    setChatId: Dispatch<SetStateAction<string | null>>;
    chatId: string | null;
    setEditId: Dispatch<SetStateAction<string>>;
    editRoomRef: React.RefObject<HTMLDivElement | null>;
    setBaseTop: Dispatch<SetStateAction<number>>;
    setBaseScroll: Dispatch<SetStateAction<number>>;
    editId: string  | null;
    editStatus: string;
    temporaryEditTitle: string;
    setTemporaryEditTitle: Dispatch<SetStateAction<string>>;
    handleEditRoom: () => Promise<void>;
    mdRoomList: boolean;
    mdRoomListToggle: boolean;
    setMdRoomListToggle: Dispatch<SetStateAction<boolean>>;
}

export default function RoomList({ sideBar, auth, setRooms, rooms, setChatId, chatId, setEditId, editRoomRef, setBaseTop, setBaseScroll, editId, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, mdRoomList, mdRoomListToggle, setMdRoomListToggle } : RoomListProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        setLoading
    } = ui;

    const getRooms = useCallback(async () => {
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
            <div className={`p-2 ${(mdRoomList || sideBar) ? "block" : "hidden"}`}>
                <p className="text-[11px] py-2 font-semibold px-3 text-gray-500 dark:text-gray-400">채팅</p>
                {rooms.map((room) => (
                    <div onClick={() => {
                        if(room.room_id === chatId) return;
                        if(mdRoomListToggle) {
                            setMdRoomListToggle(false);
                        }
                        setChatId(room.room_id);
                        router.visit(`/plaroai/${room.room_id}`, {
                            method: "get",
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }} key={room.room_id} className={`group transition-colors duration-150 w-full text-gray-800 dark:text-gray-100 flex justify-between items-center py-2 px-3 rounded text-sm font-semibold
                ${chatId === room.room_id ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
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
                                const rect = e.currentTarget.getBoundingClientRect();
                                const margin = 8;
                                const menuWidth = 180;
                                const gap = 6;

                                // align menu top with ellipsis button top
                                const y = rect.top;

                                // place menu to the right of ellipsis button
                                const x = Math.max(
                                    margin,
                                    Math.min(rect.right + gap, window.innerWidth - menuWidth - margin)
                                );

                                if (editRoomRef.current) {
                                    editRoomRef.current.style.top = `${y}px`;
                                    editRoomRef.current.style.left = `${x}px`;
                                }

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
