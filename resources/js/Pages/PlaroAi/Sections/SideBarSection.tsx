// 라이프 봇 사이드바 영역

import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenSquare, faX } from "@fortawesome/free-solid-svg-icons";
import { faSquareCaretLeft, faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import { Dispatch, SetStateAction, RefObject } from 'react';
import RoomList from "./SideBarSection/RoomList";
import {AuthUser, Room, Message} from "../../../Types/PlaroAiTypes";

interface SideBarSectionProps {
    auth: {
        user: AuthUser | null;
    };
    rooms: Room[];
    setRooms: Dispatch<SetStateAction<Room[]>>;
    chatId: string | null;
    setChatId: Dispatch<SetStateAction<string | null>>;
    sideBar: number;
    setSideBar: Dispatch<SetStateAction<number>>;
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

export default function SideBarSection({ auth, rooms, setRooms, chatId, setChatId, sideBar, setSideBar, setMessages, editId, setEditId,  editRoomRef, baseTop, setBaseTop, baseScroll, setBaseScroll, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, mdRoomList, mdRoomListToggle, setMdRoomListToggle }: SideBarSectionProps) {
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

    return (
        <>
            <aside className={`bg-white border-r transition-none md:transition-[width] duration-300 border-gray-300 dark:border-gray-800 dark:bg-gray-950 overflow-x-hidden overflow-y-auto ${(mdRoomListToggle && mdRoomList) ? "fixed inset-0 z-10 top-[70px]" : "relative"}`} style={(mdRoomListToggle && mdRoomList) ? {width: "100%"} : {width: sideBar+'px'}} onScroll={(e) => {
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
                <div className="sticky bottom-0 h-[200px] sm:h-[70px] bg-white dark:bg-gray-950 border-t border-gray-300 dark:border-gray-700 flex justify-center items-center">
                    {(mdRoomList && mdRoomListToggle) && (
                        <button className="size-12 rounded-full cursor-pointer shadow bg-blue-500 text-white" onClick={() => {
                            setMdRoomListToggle(false);
                        }}>
                            <FontAwesomeIcon icon={faX} />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
