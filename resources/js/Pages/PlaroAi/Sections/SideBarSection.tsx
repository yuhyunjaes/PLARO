// 라이프 봇 사이드바 영역

import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenSquare, faX } from "@fortawesome/free-solid-svg-icons";
import { faSquareCaretLeft, faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import {Dispatch, SetStateAction, RefObject, useRef, useEffect, useContext} from 'react';
import RoomList from "./SideBarSection/RoomList";
import {AuthUser, Room, Message} from "../../../Types/PlaroAiTypes";
import {GlobalUIContext} from "../../../Providers/GlobalUIContext";

interface SideBarSectionProps {
    auth: {
        user: AuthUser | null;
    };
    rooms: Room[];
    setRooms: Dispatch<SetStateAction<Room[]>>;
    chatId: string | null;
    setChatId: Dispatch<SetStateAction<string | null>>;
    setMessages: Dispatch<SetStateAction<Message[]>>;
    editId: string | null;
    setEditId: Dispatch<SetStateAction<string>>;
    editRoomRef: RefObject<HTMLDivElement | null>;
    baseTop: number;
    setBaseTop: Dispatch<SetStateAction<number>>;
    baseScroll: number;
    setBaseScroll: Dispatch<SetStateAction<number>>;
    editStatus: string;
    temporaryEditTitle: string;
    setTemporaryEditTitle: Dispatch<SetStateAction<string>>;
    handleEditRoom: () => Promise<void>;
    mdRoomList: boolean;
    mdRoomListToggle: boolean;
    setMdRoomListToggle: Dispatch<SetStateAction<boolean>>;
}

export default function SideBarSection({ auth, rooms, setRooms, chatId, setChatId, setMessages, editId, setEditId,  editRoomRef, baseTop, setBaseTop, baseScroll, setBaseScroll, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, mdRoomList, mdRoomListToggle, setMdRoomListToggle }: SideBarSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("CalenoteLayout must be used within GlobalProvider");
    }

    const {
        sideBar,
        setSideBar,
    } = ui;

    const resetRoom = () => {
        setChatId(null);
        setMessages([]);
        setRooms([]);
        router.visit('/plaroai', {
            method: "get",
            preserveState: true,
            preserveScroll: true,
        });
    };

    const sidebarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside= (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && editRoomRef.current && !editRoomRef.current.contains(e.target as Node)) {
                if(!mdRoomListToggle) return;
                setMdRoomListToggle(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [mdRoomListToggle]);

    return (
        <>
            <aside ref={sidebarRef} className={`bg-white border-r border-gray-300 dark:border-gray-800 dark:bg-gray-950 overflow-x-hidden overflow-y-auto transition-transform duration-150 md:transition-[width] ${mdRoomList ? "fixed top-[70px] left-0 z-10 h-[calc(100vh-70px)]" : "relative"} ${mdRoomList ? (mdRoomListToggle ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none") : "translate-x-0 pointer-events-auto"}`} style={mdRoomList ? {width: "230px"} : {width: sideBar+'px'}} onScroll={(e) => {
                if (!editRoomRef.current) return;
                if (mdRoomList) return;
                const target = e.target as HTMLElement;
                const delta = target.scrollTop - baseScroll;
                editRoomRef.current.style.top = `${baseTop - delta}px`;
            }}
            >
                <div className="sticky top-0 bg-white dark:bg-gray-950">
                    {(!mdRoomListToggle || !mdRoomList) && (
                        <div className={`px-5 w-full text-gray-950 dark:text-white flex ${(sideBar > 50) ? "justify-end" : "justify-center"} items-center py-2 border-b border-gray-300 dark:border-gray-800`}>
                            <button className="m-0 cursor-pointer" onClick={() => {
                                (sideBar > 50) ? setSideBar(50) : setSideBar(230)
                            }}>
                                {(sideBar > 50) ? <FontAwesomeIcon icon={faSquareCaretLeft} className="text-xl"/> : <FontAwesomeIcon icon={faSquareCaretRight} className="text-xl"/>}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={resetRoom}
                        className={`btn transition-colors duration-300 w-full text-gray-950 dark:text-white flex ${(sideBar > 50 || mdRoomListToggle) ? "justify-start" : "justify-center"} items-center px-0 py-2 hover:bg-blue-500/80 hover:text-white`}
                    >
                        <FontAwesomeIcon icon={faPenSquare} className="m-0 text-xl"/>
                        {(sideBar > 50 || mdRoomListToggle)&& (
                            <span className="ml-1">새 채팅</span>
                        )}
                    </button>
                </div>
                <RoomList setMdRoomListToggle={setMdRoomListToggle} mdRoomListToggle={mdRoomListToggle} mdRoomList={mdRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} setBaseScroll={setBaseScroll} setBaseTop={setBaseTop} editRoomRef={editRoomRef} setEditId={setEditId} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={(sideBar > 50)} editId={editId}/>
            </aside>
        </>
    );
}
