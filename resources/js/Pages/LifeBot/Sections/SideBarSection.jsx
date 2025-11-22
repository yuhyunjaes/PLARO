// 라이프 봇 사이드바 영역

import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenSquare, faX } from "@fortawesome/free-solid-svg-icons";
import { faSquareCaretLeft, faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import RoomList from "@/Pages/LifeBot/Sections/SideBarSection/RoomList.jsx";
export default function SideBarSection({ auth, rooms, setRooms, chatId, setChatId, sideBar, setSideBar, setLoading, setMessages, editId, setEditId,  editRoomRef, baseTop, setBaseTop, baseScroll, setBaseScroll, editStatus, temporaryEditTitle, setTemporaryEditTitle, handleEditRoom, smRoomList, smRoomListToggle, setSmRoomListToggle }) {
    const resetRoom = () => {
        setChatId(null);
        setMessages([]);
        setRooms([]);
        router.visit('/lifebot');
    };

    return (
        <>
            <aside className={`bg-white border-r border-gray-300 dark:border-gray-800 dark:bg-gray-950 transition-[width] duration-300 overflow-x-hidden overflow-y-auto ${(smRoomListToggle && smRoomList) ? "fixed inset-0 z-10 top-[70px]" : "relative"}`} style={(smRoomListToggle && smRoomList) ? {width: "100%"} : {width: sideBar+'px'}} onScroll={(e) => {
                if (!editRoomRef.current) return;
                if (smRoomList) return;
                const delta = e.target.scrollTop - baseScroll;
                editRoomRef.current.style.top = `${baseTop - delta}px`;
            }}
            >
                <div className="sticky top-0 bg-white dark:bg-gray-950">
                    {(!smRoomListToggle || !smRoomList) && (
                        <div className={`px-5 w-full text-gray-950 dark:text-white flex ${(sideBar > 50) ? "justify-end" : "justify-center"} items-center py-2`}>
                            <button className="m-0 cursor-pointer" onClick={() => {
                                (sideBar > 50) ? setSideBar(50) : setSideBar(250)
                            }}>
                                {(sideBar > 50) ? <FontAwesomeIcon icon={faSquareCaretLeft} className="text-xl"/> : <FontAwesomeIcon icon={faSquareCaretRight} className="text-xl"/>}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={resetRoom}
                        className={`btn transition-colors duration-300 w-full text-gray-950 dark:text-white flex ${(sideBar > 50 || smRoomListToggle) ? "justify-start" : "justify-center"} items-center px-0 py-2 hover:bg-blue-500 hover:text-white`}
                    >
                        <FontAwesomeIcon icon={faPenSquare} className="m-0 text-xl"/>
                        {(sideBar > 50 || smRoomListToggle)&& (
                            <span className="ml-1">새 채팅</span>
                        )}
                    </button>
                </div>
                <RoomList setSmRoomListToggle={setSmRoomListToggle} smRoomListToggle={smRoomListToggle} smRoomList={smRoomList} handleEditRoom={handleEditRoom} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} setBaseScroll={setBaseScroll} setBaseTop={setBaseTop} editRoomRef={editRoomRef} setEditId={setEditId} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={(sideBar > 50)} setLoading={setLoading} editId={editId}/>
                <div className="sticky bottom-0 h-[200px] sm:h-[70px] bg-white dark:bg-gray-950 border-t border-gray-300 dark:border-gray-700 flex justify-center items-center">
                    {(smRoomList && smRoomListToggle) && (
                        <button className="size-8 rounded-full shadow bg-blue-500 text-white" onClick={() => {
                            setSmRoomListToggle(false);
                        }}>
                            <FontAwesomeIcon icon={faX} />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
