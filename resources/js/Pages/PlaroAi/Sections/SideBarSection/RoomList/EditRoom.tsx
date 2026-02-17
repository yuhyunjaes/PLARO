// 라이프 봇 채팅방 수정 및 삭제 박스

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTrashCan, faPen, faFloppyDisk} from "@fortawesome/free-solid-svg-icons";
import {RefObject} from "react";

interface EditRoomProps {
    EditTitle: () => void;
    editRoomRef: RefObject<HTMLDivElement | null>;
    sideBar: number;
    toggle: string | null;
    deleteRoom: () => void;
    mdRoomList: boolean;
    mdRoomListToggle: boolean;
    editStatus: string;
    handleEditRoom: () => Promise<void>;
    temporaryEditTitle: string;
}
export default function EditRoom({ EditTitle, editRoomRef, sideBar, toggle, deleteRoom, mdRoomList, mdRoomListToggle, editStatus, handleEditRoom, temporaryEditTitle } : EditRoomProps) {
    return (
        <div ref={editRoomRef} className={`absolute z-[11] ${((sideBar > 50 && toggle) || (mdRoomList && mdRoomListToggle && toggle)) ? "block" : "hidden"} ${(mdRoomList && mdRoomListToggle && toggle) && "right-0 mt-5 rounded-3xl border"} ${(sideBar > 50 && toggle) && "left-[250px] border-t border-r border-b rounded-e-xl"} m-0  w-[200px] bg-white  dark:bg-gray-950 border-gray-200 dark:border-gray-900`}>
            <div className="p-2">
                {
                    (editStatus === "update") ? (
                        <button onClick={() => {
                            if(temporaryEditTitle.trim().length <= 0) return;
                            handleEditRoom();
                        }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-green-500 hover:text-green-50 hover:bg-green-500/80 space-x-1">
                            <FontAwesomeIcon icon={faFloppyDisk}/>
                            <span>
                            제목저장
                        </span>
                        </button>
                    ) : (
                        <button onClick={EditTitle} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600">
                            <FontAwesomeIcon className="m-0" icon={faPen} />
                            <span className="ml-1">이름 변경</span>
                        </button>
                    )
                }

                <button onClick={deleteRoom} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-red-400 hover:bg-red-500/80 hover:text-red-50">
                    <FontAwesomeIcon className="m-0" icon={faTrashCan} />
                    <span className="ml-1">삭제</span>
                </button>
            </div>
        </div>
    );
}
