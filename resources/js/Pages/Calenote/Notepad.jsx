import { Head, router } from '@inertiajs/react';
import { useEffect, useState} from "react";
import Loading from "@/Components/Elements/Loading.jsx";
import NotepadTitleSection from "@/Components/Calenote/Notepad/NotepadTitleSection.jsx";
import NotepadTabSection from "@/Components/Calenote/Notepad/NotepadTabSection.jsx";
import NotepadsSection from "@/Components/Calenote/Notepad/NotepadsSection.jsx";

export default function Notepad({ auth }) {
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("all");
    const [viewOption, setViewOption] = useState("grid");
    const [notepads, setNotepads] = useState([]);
    const [notepadLikes, setNotepadLikes] = useState([]);

    return (
        <>
            <Head title="Notepad"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950">
                <NotepadTitleSection />
                <div className="py-16 px-5 overflow-y-auto space-y-5">
                    <NotepadTabSection viewOption={viewOption} setViewOption={setViewOption}  tab={tab} setTab={setTab}/>
                    <NotepadsSection notepadLikes={notepadLikes} tab={tab} setNotepadLikes={setNotepadLikes} viewOption={viewOption} setLoading={setLoading} notepads={notepads} setNotepads={setNotepads} />
                </div>
                <Loading Toggle={loading}/>
            </div>
        </>
    );
}
