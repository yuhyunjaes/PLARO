// 메모장 수정 및 삭제를 담당하는 영역

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsis, faPen, faTrashCan, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from "react";

interface NotepadEditProps {
    editId: string;
    setEditId: Dispatch<SetStateAction<string>>;
    notepadId: string;
    isLastInRow: boolean;
    editStatus: string;
    setEditStatus: Dispatch<SetStateAction<string>>;
    temporaryEditTitle: string;
    setTemporaryEditTitle: Dispatch<SetStateAction<string>>;
    EditTitle: () => void;
    deleteNotepad: () => void;
    modal: boolean;
    handleEditNotepadTitle: () => Promise<void>;
}

export default function NotepadEdit({ editId, setEditId, notepadId, isLastInRow, editStatus, setEditStatus, temporaryEditTitle, setTemporaryEditTitle, EditTitle, deleteNotepad, modal, handleEditNotepadTitle } : NotepadEditProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback( (e: MouseEvent) => {
        if (!editId || modal) return;

        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setEditId("");
            setEditStatus("");
            setTemporaryEditTitle("");
        }
    }, [editId, modal]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            setEditId(notepadId);
        }}
             className={`transition-colors duration-300 relative ${
                 editId === notepadId
                     ? "text-blue-700"
                     : "text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
             }`}
        >
            <FontAwesomeIcon icon={faEllipsis} />
            {(editId === notepadId) && (
                <div
                    ref={menuRef}
                    className={`
                        w-[160px] absolute p-2 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 top-[100%] shadow-md rounded-xl
                        ${isLastInRow ? "right-0" : "left-0"}
                    `}
                >

                    {(editStatus === "update") ? (
                        <button onClick={(e) => {
                            if(temporaryEditTitle.trim().length > 0) {
                                e.stopPropagation();
                                handleEditNotepadTitle();
                            }
                        }} className="btn text-xs transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-green-500 hover:text-green-50 hover:bg-green-500/80 space-x-1">
                            <FontAwesomeIcon icon={faFloppyDisk}/>
                            <span>
                            제목저장
                        </span>
                        </button>
                    ) : (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            EditTitle();
                        }} className="btn text-xs transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                            <FontAwesomeIcon icon={faPen}/>
                            <span>
                            제목변경
                        </span>
                        </button>
                    )}

                    <button onClick={(e) => {
                        e.stopPropagation();
                        deleteNotepad();
                    }} className="btn text-xs transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                        <FontAwesomeIcon icon={faTrashCan}/>
                        <span>
                            삭제
                        </span>
                    </button>
                </div>
            )
            }
        </div>
    );
}
