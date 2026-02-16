import {Head, router} from '@inertiajs/react';
import {RefObject, useCallback, useContext, useEffect, useRef, useState} from "react";
import 'quill/dist/quill.snow.css';
import WriteSection from "./NotepadWriteSection/WriteSection";
import ControlSection from "./NotepadWriteSection/ControlSection";
import axios from "axios";
import Contents from "./NotepadWriteSection/Contents";
import Modal from "../../../../Components/Elements/Modal";
import {AlertsData} from "../../../../Components/Elements/ElementsData";
import {GlobalUIContext} from "../../../../Providers/GlobalUIContext";
import Share from "./NotepadWriteSection/Share";

interface NotepadWriteSectionProps {
    content: string;
    uuid: string;
    title: string;
    liked: boolean;
    category: string;
}


export default function NotepadWriteSection({ content, uuid, title, liked, category } : NotepadWriteSectionProps) {
    const [modal, setModal] = useState<boolean>(false);
    const [notepadText, setNotepadText] = useState<string>(content || "");
    const [saveStatus, setSaveStatus] = useState<boolean>(false);
    const [notepadLiked, setNotepadLiked] = useState<boolean>(liked);
    const [emptyState, setEmptyState] = useState<string>("");
    const [currentTitle, setCurrentTitle] = useState(title || "");
    const [currentCategory, setCurrentCategory] = useState(category || "");

    const contentsRef:RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const [notepadContentsToggle, setNotepadContentsToggle] = useState<boolean>(false);
    const [notepadShareToggle, setNotepadShareToggle] = useState<boolean>(false);

    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
    } = ui;

    const handleSaveNotepadContent = useCallback(async (text : string) => {
        if(!uuid) return;
        try {
            const res = await axios.put(`/api/notepads/${uuid}`, {
                text : text
            });

            if(res.data.success) {
                setSaveStatus(false);
            }
        } catch (err) {
            console.error(err);
        }
    }, [uuid]);

    const handleDeleteNotepad = useCallback( async () => {
        if(!uuid) return;
        try {
            const res = await axios.delete(`/api/notepads/${uuid}`);
            if(res.data.success) {
                router.visit(`/calenote/notepad`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });

                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [uuid]);

    useEffect(() => {
        const handleClickOutside = (e : any) => {
            if (contentsRef.current && contentsRef.current && !contentsRef.current.contains(e.target)) {
                if(notepadContentsToggle) {
                    setNotepadContentsToggle(false);
                }
                if(notepadShareToggle) {
                    setNotepadShareToggle(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notepadContentsToggle, notepadShareToggle]);


    return (
        <>
            <Head title={`Notepad - ${currentTitle}`} />
            <div className="h-full flex flex-col relative overflow-y-auto">
                <ControlSection currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} notepadShareToggle={notepadShareToggle} setNotepadShareToggle={setNotepadShareToggle} notepadContentsToggle={notepadContentsToggle} setNotepadContentsToggle={setNotepadContentsToggle} saveStatus={saveStatus} currentTitle={currentTitle} setCurrentTitle={setCurrentTitle} notepadLiked={notepadLiked} setNotepadLiked={setNotepadLiked} uuid={uuid}/>
                {notepadShareToggle ? <Share uuid={uuid} ref={contentsRef} /> : ""}
                {notepadContentsToggle ? <Contents setModal={setModal} ref={contentsRef} /> : ""}
                <WriteSection handleSaveNotepadContent={handleSaveNotepadContent} notepadText={notepadText} setNotepadText={setNotepadText} setSaveStatus={setSaveStatus}/>
            </div>
            {modal ? (
                <Modal Title="메모장 삭제" onClickEvent={handleDeleteNotepad} setModal={setModal} setEditId={setEmptyState} setEditStatus={setEmptyState} Text={`${currentTitle} 메모장을 정말 삭제 하시겠습니까?`} Position="top" CloseText="삭제" />
            ) : ""}
        </>
    );
}
