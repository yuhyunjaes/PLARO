// 메모장 수정 및 삭제를 담당하는 영역

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsis, faPen, faTrashCan, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from "react";

interface NotepadEditProps {
    deleteId: string;
    setDeleteId:Dispatch<SetStateAction<string>>;
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

export default function NotepadEdit({ deleteId, setDeleteId, editId, setEditId, notepadId, isLastInRow, editStatus, setEditStatus, temporaryEditTitle, setTemporaryEditTitle, EditTitle, deleteNotepad, modal, handleEditNotepadTitle } : NotepadEditProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback( (e: MouseEvent) => {
        if (!deleteId || modal) return;

        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setDeleteId("");
            setEditStatus("");
            setTemporaryEditTitle("");
        }
    }, [deleteId, modal]);

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            setDeleteId(notepadId);
        }}
             className={`transition-colors duration-300 relative ${
                 deleteId === notepadId
                     ? "text-blue-700"
                     : "text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
             }`}
        >
            <FontAwesomeIcon icon={faEllipsis} />
            {(deleteId === notepadId) && (
                <div
                    ref={menuRef}
                    className={`
                        w-[160px] absolute p-2 bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800 top-[100%] rounded
                        ${isLastInRow ? "right-0" : "left-0"}
                    `}
                >

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
