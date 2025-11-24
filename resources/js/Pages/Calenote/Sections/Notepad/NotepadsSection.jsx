// 메모장들 read영역

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faShareNodes, faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {useCallback, useEffect, useState} from "react";
import NotepadShare from "@/Pages/Calenote/Sections/Notepad/NotepadsSection/NotepadShare.jsx";
import NotepadEdit from "@/Pages/Calenote/Sections/Notepad/NotepadsSection/NotepadEdit.jsx";
import axios from "axios";
import {router} from "@inertiajs/react";
import NotepadCategoryEdit from "@/Pages/Calenote/Sections/Notepad/NotepadsSection/NotepadCategoryEdit.jsx";

export default function NotepadsSection({ notepads, setNotepads, setLoading, viewOption, notepadLikes, setNotepadLikes, tab, setEditId, setEditStatus, editId, editStatus, setTemporaryEditTitle, temporaryEditTitle, setModal, modal, categories, setCategories, getNotepadCategories }) {
    const [shareId, setShareId] = useState("");

    const EditTitle = useCallback(() => {
        if(!editId) return;

        if(editId && editStatus === "update") {
            setEditId("");
            setEditStatus("");
            setTemporaryEditTitle("");
            return;
        }

        const title = notepads.filter(item => item.id === editId)[0].title;
        setTemporaryEditTitle(title);
        setEditStatus("update");
    }, [editId, editStatus, notepads]);

    const deleteNotepad = useCallback(() => {
        if(!editId) return;
        if(temporaryEditTitle) {
            setTemporaryEditTitle("");
        }
        setEditStatus("delete");
        setModal(true);
    }, [editId, temporaryEditTitle]);

    const getNotepadLikes = useCallback(async ()=> {
        setLoading(true);
        try {
            const res = await axios.get("/notepads/likes");
            if(res.data.success) {
                setNotepadLikes(res.data.likes);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getNotepadLikes();
    }, [getNotepadLikes]);

    const handleLikeInsert = async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.post(`/notepads/${uuid}/like`);
            if(res.data.success) {
                setNotepadLikes(prev => [...prev, { notepad_id: uuid }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLikeDelete = useCallback(async (uuid) => {
        setLoading(true);
        try {
            const res = await axios.delete(`/notepads/${uuid}/like`);
            if(res.data.success) {
                setNotepadLikes(prev => prev.filter(like => like.notepad_id !== uuid));
            }
            if(res.data.success && (tab === "liked")) {
                setNotepads(prev => prev.filter(notepad => notepad.id !== uuid));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tab]);

    const getColumnCount = () => {
        if(viewOption === "grid") {
            if(window.innerWidth >= 1280) return 4;
            if(window.innerWidth >= 1024) return 3;
            if(window.innerWidth >= 768) return 2;
            return 1;
        }
        return 1;
    };

    const handleEditNotepadTitle = useCallback(async () => {
        if (!editId || !temporaryEditTitle.trim()) return;
        setLoading(true);

        try {
            const res = await axios.put(`/api/notepads/${editId}/title`, {
                title : temporaryEditTitle.trim()
            });
            if(res.data.success) {
                setNotepads((prevNotepads) =>
                    prevNotepads.map((notepad) =>
                        notepad.id === editId
                            ? { ...notepad, title: temporaryEditTitle.trim() }
                            : notepad
                    )
                );
                setEditId("");
                setEditStatus("");
                setTemporaryEditTitle("");
            }

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, [editId, temporaryEditTitle]);

    return (
        <div className={`grid gap-5 ${viewOption === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {notepads.map((notepad, index) => {
                const colCount = getColumnCount();
                const isLastInRow = (index + 1) % colCount === 0;
                return (
                    (
                        <div onClick={() => {
                            router.visit(`/calenote/notepad/${notepad.id}`, {
                                method: "get",
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }} key={index} className="notepad-item">
                            {(editStatus === "update" && editId === notepad.id) ? (
                                <input autoFocus
                                       onClick={(e) => e.stopPropagation()}
                                       onMouseDown={(e) => e.stopPropagation()}
                                       onFocus={(e) => e.stopPropagation()}
                                       onChange={(e) => {
                                    setTemporaryEditTitle(e.target.value);
                                }}
                                       onKeyDown={(e) => {
                                           if (e.key === "Enter") {
                                               if(temporaryEditTitle.trim().length > 0) {
                                                   e.stopPropagation();
                                                   handleEditNotepadTitle();
                                               }
                                           }
                                       }}
                                       type="text" name="" id="" className="normal-text font-semibold truncate border-0 outline-none max-w-full min-w-full" value={temporaryEditTitle}/>
                            ) : (
                                <h5 className="normal-text font-semibold truncate">
                                    {notepad.title}
                                </h5>
                            )}
                            <p className="text-white normal-text text-sm min-h-[80px] max-h-[80px] line-clamp-4">
                                <span dangerouslySetInnerHTML={{ __html: notepad.content }} />
                            </p>
                            <p className="text-sm normal-text truncate">{notepad.created_at.substring(0, 10)}</p>
                            <div className="flex justify-between items-center">
                                <NotepadCategoryEdit categories={categories} getNotepadCategories={getNotepadCategories} setLoading={setLoading} setNotepads={setNotepads} notepadCategory={notepad.category} notepadId={notepad.id}/>

                                <div className="space-x-2 flex">
                                    <NotepadEdit handleEditNotepadTitle={handleEditNotepadTitle} modal={modal} deleteNotepad={deleteNotepad} EditTitle={EditTitle} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} setEditStatus={setEditStatus} editId={editId} setEditId={setEditId} notepadId={notepad.id} isLastInRow={isLastInRow}/>

                                    <NotepadShare
                                        isLastInRow={isLastInRow}
                                        notepadId={notepad.id}
                                        shareId={shareId}
                                        setShareId={setShareId}
                                        setLoading={setLoading}
                                    />

                                    <button
                                        className="transition-colors duration-300 text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(notepadLikes.some(like => like.notepad_id === notepad.id)) {
                                                handleLikeDelete(notepad.id);
                                            } else {
                                                handleLikeInsert(notepad.id);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={(notepadLikes.some(like => like.notepad_id === notepad.id)) ? (faHeartSolid) : (faHeartRegular)} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )
            })}
        </div>

    );
}
