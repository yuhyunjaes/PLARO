// 라이프 봇 사이드바 영역

import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenSquare } from "@fortawesome/free-solid-svg-icons";
import { faSquareCaretLeft, faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import {Dispatch, SetStateAction, RefObject} from 'react';
import RoomList from "./SideBarSection/RoomList";
import {AuthUser, Room, Message} from "../../../Types/PlaroAiTypes";

interface SideBarSectionProps {
    sideBar: number;
    setSideBar: Dispatch<SetStateAction<number>>;
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

export default function SideBarSection({ sideBar, setSideBar, auth, rooms, setRooms, chatId, setChatId, setMessages, editId, setEditId,  editRoomRef, baseTop, setBaseTop, baseScroll, setBaseScroll, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, mdRoomList, mdRoomListToggle, setMdRoomListToggle }: SideBarSectionProps) {
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
            {mdRoomList && mdRoomListToggle && (
                <div
                    className="fixed inset-0 top-0 md:top-[70px] z-[8] bg-black/40 md:hidden"
                    onClick={() => setMdRoomListToggle(false)}
                />
            )}
            <aside className={`lifeBot-side-bar bg-white border-r border-gray-300 dark:border-gray-800 dark:bg-gray-950/95 overflow-x-hidden overflow-y-auto transition-transform duration-150 md:transition-[width] backdrop-blur md:rounded-r md:shadow-sm md:shadow-gray-200/60 md:dark:shadow-black/30 ${mdRoomList ? "fixed top-0 md:top-[70px] left-0 z-[9] h-[calc(100%-64px)] md:h-[calc(100%-70px)] w-[230px]" : "relative"} ${mdRoomList ? (mdRoomListToggle ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none") : "translate-x-0 pointer-events-auto"}`} style={mdRoomList ? undefined : {width: sideBar+'px'}} onScroll={(e) => {
                if (!editRoomRef.current) return;
                const target = e.target as HTMLElement;
                const delta = target.scrollTop - baseScroll;
                editRoomRef.current.style.top = `${baseTop - delta}px`;
            }}
            >
                <div className="sticky top-0 bg-white dark:bg-gray-950/95 backdrop-blur">
                    <div className={`px-4 w-full text-gray-950 dark:text-white flex ${(sideBar > 50) ? "justify-end" : "justify-center"} items-center py-3 border-b border-gray-200 dark:border-gray-800`}>
                        <button type="button" className={`m-0 cursor-pointer ${mdRoomList ? "pointer-events-none opacity-0" :""}`} onClick={() => {
                            (sideBar > 50) ? setSideBar(50) : setSideBar(230)
                        }}>
                            {(sideBar > 50) ? <FontAwesomeIcon icon={faSquareCaretLeft} className="text-xl"/> : <FontAwesomeIcon icon={faSquareCaretRight} className="text-xl"/>}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => {resetRoom(); setMdRoomListToggle(false);}}
                        className={`transition-colors duration-150 w-full text-gray-800 dark:text-gray-100 flex ${(mdRoomList || sideBar > 50) ? "justify-start px-5" : "justify-center"} items-center py-2.5 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                        <FontAwesomeIcon icon={faPenSquare} className="m-0 text-xl"/>
                        {(mdRoomList || sideBar > 50) && (
                            <span className="ml-1">새 채팅</span>
                        )}
                    </button>
                </div>
                <RoomList setMdRoomListToggle={setMdRoomListToggle} mdRoomListToggle={mdRoomListToggle} mdRoomList={mdRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} setBaseScroll={setBaseScroll} setBaseTop={setBaseTop} editRoomRef={editRoomRef} setEditId={setEditId} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={(mdRoomList || sideBar > 50)} editId={editId}/>
                <div className="py-3 sticky bottom-0 w-full bg-white dark:bg-gray-950/95 border-t border-t-gray-200 dark:border-t-gray-800 backdrop-blur">
                    <button></button>
                </div>
            </aside>
        </>
    );
}
