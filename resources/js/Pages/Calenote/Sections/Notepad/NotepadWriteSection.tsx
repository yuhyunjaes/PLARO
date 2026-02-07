import { Head } from '@inertiajs/react';
import {useCallback, useState} from "react";
import 'quill/dist/quill.snow.css';
import WriteSection from "./NotepadWriteSection/WriteSection";
import ControlSection from "./NotepadWriteSection/ControllSection";
import axios from "axios";

interface NotepadWriteSectionProps {
    content: string;
    uuid: string;
    title: string;
}


export default function NotepadWriteSection({ content, uuid, title } : NotepadWriteSectionProps) {
    const [notepadText, setNotepadText] = useState<string>(content || "");
    const [saveStatus, setSaveStatus] = useState<boolean>(false);

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


    return (
        <>
            <Head title={`Notepad - ${title}`} />
            <div className="h-full flex flex-col relative overflow-y-auto">
                <ControlSection saveStatus={saveStatus} title={title}/>
                <WriteSection handleSaveNotepadContent={handleSaveNotepadContent} notepadText={notepadText} setNotepadText={setNotepadText} setSaveStatus={setSaveStatus}/>
            </div>
        </>
    );
}
