import {router} from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenSquare } from "@fortawesome/free-solid-svg-icons";
import { faSquareCaretLeft, faSquareCaretRight } from "@fortawesome/free-regular-svg-icons";
import RoomList from "@/Components/LifeBot/SideBarSection/RoomList.jsx";

export default function SideBarSection({ auth, rooms, setRooms, chatId, setChatId, sideBar, setSideBar, setLoading, setMessages, editId, setEditId,  editRoomRef }) {
    const resetRoom = () => {
        setChatId(null);
        setMessages([]);
        setRooms([]);
        router.visit('/lifebot');
    };

    return (
        <>
            <aside className="bg-gray-100 dark:bg-gray-950 hidden sm:block transition-[width] duration-300 overflow-x-hidden overflow-y-auto relative" style={{width: sideBar+'px'}}>
                <div className="sticky top-0 bg-gray-100 dark:bg-gray-950">
                    <div className={`px-5 w-full text-gray-950 dark:text-white flex ${(sideBar > 50) ? "justify-end" : "justify-center"} items-center py-2`}>
                        <button className="m-0 cursor-pointer" onClick={() => {
                            (sideBar > 50) ? setSideBar(50) : setSideBar(250)
                        }}>
                            {(sideBar > 50) ? <FontAwesomeIcon icon={faSquareCaretLeft} className="text-xl"/> : <FontAwesomeIcon icon={faSquareCaretRight} className="text-xl"/>}
                        </button>
                    </div>
                    <button
                        onClick={resetRoom}
                        className={`btn transition-colors duration-300 w-full text-gray-950 dark:text-white flex ${(sideBar > 50) ? "justify-start" : "justify-center"} items-center px-0 py-2 hover:bg-gray-200 dark:hover:bg-gray-600`}
                    >
                        <FontAwesomeIcon icon={faPenSquare} className="m-0 text-xl"/>
                        {(sideBar > 50)&& (
                            <span className="ml-2">새 채팅</span>
                        )}
                    </button>
                </div>
                <RoomList  editRoomRef={editRoomRef} editId={editId} setEditId={setEditId} auth={auth} rooms={rooms} setRooms={setRooms} chatId={chatId} setChatId={setChatId} sideBar={(sideBar > 50)} setLoading={setLoading}/>
            </aside>
        </>
    );
}
