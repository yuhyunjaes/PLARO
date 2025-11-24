// 메모장 영역

import { Head, router } from '@inertiajs/react';
import {useCallback, useEffect, useState} from "react";
import Loading from "@/Components/Elements/Loading.jsx";
import NotepadTitleSection from "@/Pages/Calenote/Sections/Notepad/NotepadTitleSection.jsx";
import NotepadFilterSection from "@/Pages/Calenote/Sections/Notepad/NotepadFilterSection.jsx";
import NotepadsSection from "@/Pages/Calenote/Sections/Notepad/NotepadsSection.jsx";
import Modal from "@/Components/Elements/Modal.jsx";
import axios from "axios";

export default function Notepad({ auth }) {
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("all");
    const [viewOption, setViewOption] = useState("grid");
    const [notepads, setNotepads] = useState([]);
    const [notepadLikes, setNotepadLikes] = useState([]);

    const [editId, setEditId] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [temporaryEditTitle, setTemporaryEditTitle] = useState("");

    const [modal, setModal] = useState(false);

    const [categories, setCategories] = useState([]);

    const getNotepadCategories = useCallback(async () => {
        try {
            const res = await axios.get("/api/notepads/categories");
            if(res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getNotepadCategories();
    }, [getNotepadCategories]);

    const [searchTitle, setSearchTitle] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    const getNotepads = useCallback(async () => {
        if(!tab) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/notepads', {
                params: {
                    title: searchTitle,
                    category: searchCategory,
                    liked: tab === 'liked'
                }
            });

            if (res.data.success) {
                setNotepads(res.data.notepads);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, [tab, searchTitle, searchCategory]);

    useEffect(() => {
        getNotepads();
    }, [getNotepads]);

    const handleDeleteNotepad = useCallback( async () => {
        if(!editId) return;
        setLoading(true);
        try {
            const res = await axios.delete(`/api/notepads/${editId}`);
            if(res.data.success) {
                setEditStatus("");
                setEditId("");
                setNotepads((prevNotepads) => prevNotepads.filter(notepad => notepad.id !== editId));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [editId]);

    return (
        <>
            <Head title="Notepad"/>
            <div className="min-h-full bg-gray-100 dark:bg-gray-950 relative flex flex-col">
                {
                    (notepads.length <= 0) && (
                        <span className="normal-text text-sm lg:text-base w-full px-5 text-center absolute top-[70%] lg:top-1/2 left-1/2 -translate-1/2 font-semibold">
                          {
                              (tab === "liked") ? "찜한 메모가 아직 없어요." : "아직 작성된 메모가 없어요."
                          }
                        </span>
                    )
                }

                {/*메모장 메인 타이틀 영역*/}
                <NotepadTitleSection />

                <div className="px-5 space-y-3 flex-1">
                    {/*메모장 필터 영역(search, grid)*/}
                    <NotepadFilterSection setSearchCategory={setSearchCategory} categories={categories} setSearchTitle={setSearchTitle} getNotepads={getNotepads} viewOption={viewOption} setViewOption={setViewOption} tab={tab} setTab={setTab}/>

                    {/*메모장 read영역*/}
                    <NotepadsSection getNotepadCategories={getNotepadCategories} categories={categories} setCategories={setCategories} modal={modal} setModal={setModal} editId={editId} setEditId={setEditId} editStatus={editStatus} setEditStatus={setEditStatus} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} notepadLikes={notepadLikes} tab={tab} setNotepadLikes={setNotepadLikes} viewOption={viewOption} setLoading={setLoading} notepads={notepads} setNotepads={setNotepads} />
                </div>

                {/*로딩창*/}
                <Loading Toggle={loading}/>

                {/*메모장 삭제 모달창*/}
                {modal && <Modal Title="메모장 삭제" onClickEvent={handleDeleteNotepad} setModal={setModal} setEditId={setEditId} setEditStatus={setEditStatus} Text={editId && '"'+notepads.filter(item => item.id === editId)[0].title+'"' + " 메모장을 정말 삭제 하시겠습니까?"} Position="top" CloseText="삭제" />}
            </div>
        </>
    );
}
