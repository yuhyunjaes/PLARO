import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faPen } from "@fortawesome/free-solid-svg-icons";
import {useEffect} from "react";
export default function EditRoom({ EditTitle, editRoomRef, sideBar, toggle, deleteRoom, smRoomList, smRoomListToggle }) {
    return (
        <div ref={editRoomRef} className={`absolute ${((sideBar > 50 && toggle) || (smRoomList && smRoomListToggle && toggle)) ? "block" : "hidden"} ${(smRoomList && smRoomListToggle && toggle) && "right-0 mt-5 z-[11] rounded-3xl border"} ${(sideBar > 50 && toggle) && "left-[250px] border-t border-r border-b rounded-e-3xl"} m-0  w-[200px] bg-gray-100  dark:bg-gray-950 border-gray-200 dark:border-gray-900`}>
            <div className="p-2">
                <button onClick={EditTitle} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600">
                    <FontAwesomeIcon className="m-0" icon={faPen} />
                    <span className="ml-1">이름 변경</span>
                </button>
                <button onClick={deleteRoom} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-red-400 hover:bg-red-400/20">
                    <FontAwesomeIcon className="m-0" icon={faTrashCan} />
                    <span className="ml-1">삭제</span>
                </button>
            </div>
        </div>
    );
}
