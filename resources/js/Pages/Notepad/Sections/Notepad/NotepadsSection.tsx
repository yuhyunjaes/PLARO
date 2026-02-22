// 메모장들 read영역

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import axios from "axios";
import {router} from "@inertiajs/react";
import NotepadShare from "./NotepadsSection/NotepadShare";
import NotepadEdit from "./NotepadsSection/NotepadEdit";
import NotepadCategoryEdit from "./NotepadsSection/NotepadCategoryEdit";
import {Notepads, Category} from "../../../../Types/AppTypes";
import { useContext } from "react";
import {GlobalUIContext} from "../../../../Providers/GlobalUIContext";
import {AlertsData} from "../../../../Components/Elements/ElementsData";
import {DateUtils} from "../../../../Utils/dateUtils";

interface NotepadsSectionProps {
    deleteId: string;
    setDeleteId:Dispatch<SetStateAction<string>>;
    notepads: Notepads[];
    setNotepads: Dispatch<SetStateAction<Notepads[]>>;
    viewOption: "grid" | "list";
    tab: "all" | "liked";
    setEditStatus: Dispatch<SetStateAction<string>>;
    editId: string;
    setEditId: Dispatch<SetStateAction<string>>;
    editStatus: string;
    temporaryEditTitle: string;
    setTemporaryEditTitle: Dispatch<SetStateAction<string>>;
    modal: boolean;
    setModal: Dispatch<SetStateAction<boolean>>;
    categories: string[];
}

export default function NotepadsSection({ deleteId, setDeleteId, notepads, setNotepads, viewOption, tab, setEditId, setEditStatus, editId, editStatus, setTemporaryEditTitle, temporaryEditTitle, setModal, modal, categories } : NotepadsSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("GlobalProvider context is required");
    }

    const {
        setAlerts,
    } = ui;
    const [shareId, setShareId] = useState<string>("");

    const markdownPreviewToHtml = useCallback((markdown: string): string => {
        const escapeHtml = (raw: string): string =>
            raw
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const normalizeColorToken = (token: string): string => {
            const value = token.trim();
            if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
            if (/^[a-zA-Z]+$/.test(value)) return value;
            return "inherit";
        };

        let escaped = escapeHtml(markdown || "");
        escaped = escaped
            .replace(/\{red\}([\s\S]*?)\{\/red\}/g, '<span class="md-color-red">$1</span>')
            .replace(/\{bg-red\}([\s\S]*?)\{\/bg-red\}/g, '<span class="md-bg-red">$1</span>')
            .replace(/\{color:([^}]+)\}([\s\S]*?)\{\/color\}/g, (_, color, text) => `<span style="color:${normalizeColorToken(String(color))};">${text}</span>`)
            .replace(/\{bg:([^}]+)\}([\s\S]*?)\{\/bg\}/g, (_, color, text) => `<span style="background-color:${normalizeColorToken(String(color))};padding:0 4px;border-radius:4px;">${text}</span>`)
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
            .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>")
            .replace(/~~([^~]+)~~/g, "<del>$1</del>")
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');

        const lines = escaped.replace(/\r\n/g, "\n").split("\n");
        const normalized = lines.map((line) => {
            const trimmed = line.trim();
            if (/^#{1,6}\s+/.test(trimmed)) {
                return `<strong>${trimmed.replace(/^#{1,6}\s+/, "")}</strong>`;
            }
            if (/^[-*]\s+\[( |x|X)\]\s+/.test(trimmed)) {
                const checked = /^[-*]\s+\[(x|X)\]\s+/.test(trimmed);
                return `${checked ? "☑" : "☐"} ${trimmed.replace(/^[-*]\s+\[( |x|X)\]\s+/, "")}`;
            }
            if (/^[-*]\s+/.test(trimmed)) {
                return `• ${trimmed.replace(/^[-*]\s+/, "")}`;
            }
            if (/^\d+\.\s+/.test(trimmed)) {
                return trimmed;
            }
            if (/^>\s+/.test(trimmed)) {
                return `❝ ${trimmed.replace(/^>\s+/, "")}`;
            }
            if (trimmed === "---" || trimmed === "***") {
                return "────────";
            }
            return line;
        });

        return normalized.join("<br/>");
    }, []);

    const EditTitle = useCallback((uuid?:string) => {
        if(uuid) {
            setEditStatus("update");
            setEditId(uuid);

            const title = notepads.find(item => item.id === uuid)?.title;
            if(title) {
                setTemporaryEditTitle(title);
            }
            return;
        }

        if(!editId) return;

        if(editId && editStatus === "update") {
            setEditId("");
            setEditStatus("");
            setTemporaryEditTitle("");
            return;
        }

        const title = notepads.find(item => item.id === editId)?.title;
        if(title) {
            setTemporaryEditTitle(title);
        }
        setEditStatus("update");
    }, [editId, editStatus, notepads]);

    const deleteNotepad = useCallback(() => {
        if(!deleteId) return;
        if(temporaryEditTitle) {
            setTemporaryEditTitle("");
        }
        setEditStatus("delete");
        setModal(true);
    }, [deleteId, temporaryEditTitle]);

    const handleLikeInsert = async (uuid: string) => {
        if(!uuid) return;

        try {
            const res = await axios.post(`/notepads/${uuid}/like`);

            if (res.data.success) {
                updateLikeState(uuid, true);
            } else {
                setAlerts(prev => [...prev, {
                    id: DateUtils.now(),
                    message: res.data.message,
                    type: res.data.type,
                }]);
            }

        } catch (err) {
            console.error(err);
        }
    };

    const handleLikeDelete = useCallback(async (uuid: string) => {
        if(!uuid) return;
        try {
            const res = await axios.delete(`/notepads/${uuid}/like`);

            if (res.data.success) {
                updateLikeState(uuid, false, tab === "liked");
            } else {
                setAlerts(prev => [...prev, {
                    id: DateUtils.now(),
                    message: res.data.message,
                    type: res.data.type,
                }]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [tab]);

    const updateLikeState = (
        uuid: string,
        liked: boolean,
        removeWhenUnliked = false
    ) => {
        setNotepads(prev =>
            removeWhenUnliked && !liked
                ? prev.filter(n => n.id !== uuid)
                : prev.map(n =>
                    n.id === uuid ? { ...n, liked } : n
                )
        );
    };

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
            } else {
                const alertData:AlertsData = {
                    id: DateUtils.now(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }

        } catch (err) {
            console.log(err);
        }
    }, [editId, temporaryEditTitle]);

    useEffect(() => {
        if(shareId) {
            setDeleteId("");
        }
    }, [shareId]);

    return (
         <div className={`grid gap-5 ${viewOption === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {notepads.map((notepad, index) => {
                const colCount = getColumnCount();
                const isLastInRow = (index + 1) % colCount === 0;
                return (
                    (
                        <div onClick={() => {
                            router.visit(`/notepad/${notepad.id}`, {
                                method: "get",
                                preserveState: true,
                                preserveScroll: true,
                            });
                            }} key={index} className="notepad-item">
                            {(editStatus === "update" && editId === notepad.id) ? (
                                <input autoFocus
                                       onBlur={() => {
                                           if(temporaryEditTitle.trim().length > 0) {
                                               handleEditNotepadTitle();
                                           }
                                       }}
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
                                <h5 onClick={(e) => {
                                    e.stopPropagation();
                                    EditTitle(notepad.id);
                                }} className="normal-text font-semibold truncate">
                                    {notepad.title}
                                </h5>
                            )}
                            <p className="normal-text text-sm min-h-[120px] max-h-[120px] bg-gray-100 dark:bg-[#0d1117] p-2 rounded line-clamp-4">
                                <span className="md-preview" dangerouslySetInnerHTML={{ __html: markdownPreviewToHtml(notepad.content || "") }} />
                            </p>
                            <div className="flex flex-row gap-2">
                                <div>
                                    <p className="text-xs normal-text truncate font-semibold">{DateUtils.formatDate(DateUtils.parseServerDate(notepad.created_at))}</p>
                                </div>
                                <div className="flex-1 flex justify-center items-center">
                                    <div className="h-[1px] w-full bg-gray-300 dark:bg-gray-800"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <NotepadCategoryEdit categories={categories} setNotepads={setNotepads} notepadCategory={notepad.category} notepadId={notepad.id}/>

                                <div className="space-x-2 flex">
                                    <NotepadEdit deleteId={deleteId} setDeleteId={setDeleteId} handleEditNotepadTitle={handleEditNotepadTitle} modal={modal} deleteNotepad={deleteNotepad} EditTitle={EditTitle} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} editStatus={editStatus} setEditStatus={setEditStatus} editId={editId} setEditId={setEditId} notepadId={notepad.id} isLastInRow={isLastInRow}/>

                                    <NotepadShare
                                        isLastInRow={isLastInRow}
                                        notepadId={notepad.id}
                                        shareId={shareId}
                                        setShareId={setShareId}
                                    />

                                    <button
                                        className="transition-colors duration-150 text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            notepad.liked
                                                ? handleLikeDelete(notepad.id)
                                                : handleLikeInsert(notepad.id);
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={notepad.liked ? faHeartSolid : faHeartRegular}
                                        />
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
