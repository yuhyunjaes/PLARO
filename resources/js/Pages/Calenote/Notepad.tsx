// 메모장 영역

import { Head, router } from '@inertiajs/react';
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import axios from "axios";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { AuthUser, Notepads, NotepadsLike, Category } from "../../Types/CalenoteTypes";
import FormModal from "../../Components/Elements/FormModal";
import Modal from "../../Components/Elements/Modal";
import NotepadsSection from "./Sections/Notepad/NotepadsSection";
import NotepadFilterSection from "./Sections/Notepad/NotepadFilterSection";
import { useContext } from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import {AlertsData} from "../../Components/Elements/ElementsData";


interface NotepadProps {
    auth: {
        user: AuthUser | null;
    };
}

export default function Notepad({ auth } : NotepadProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
    } = ui;

    const [tab, setTab] = useState<"all" | "liked">("all");
    const [viewOption, setViewOption] = useState<"grid" | "list">("grid");
    const [notepads, setNotepads] = useState<Notepads[]>([]);
    const [notepadLikes, setNotepadLikes] = useState<NotepadsLike[]>([]);

    const [editId, setEditId] = useState<string>("");
    const [editStatus, setEditStatus] = useState<string>("");
    const [temporaryEditTitle, setTemporaryEditTitle] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);

    const [categories, setCategories] = useState<Category[]>([]);

    const [formModal, setFormModal] = useState<boolean>(false);
    const [notepadTitle, setNotepadTitle] = useState<string>("");
    const [notepadCategory, setNotepadCategory] = useState<string>("");

    const [formInputs, setFormInputs] = useState([
        { label: "타이틀", type: "text", id: "new-title", name: "new-title", value: notepadTitle },
        { label: "카테고리", type: "text", id: "new-category", name: "new-category", value: notepadCategory }
    ]);

    const handleInputChange = (index :number, newValue :string) => {
        setFormInputs((prev) => {
            const copy = [...prev];
            if(copy[index]) {
                copy[index].value = newValue;
            }
            return copy;
        });

        if (index === 0) setNotepadTitle(newValue);
        if (index === 1) setNotepadCategory(newValue);
    };

    const handleStoreNotepad = useCallback(async () => {
        if(!notepadTitle || !notepadCategory) return;
        setLoading(true);

        try {
            const res = await axios.post("/api/notepads", {
                note_title: notepadTitle,
                category: notepadCategory
            });
            if(res.data.success) {
                router.visit(`/calenote/notepad/${res.data.id}`, {
                    method: "get",
                    preserveState: true,
                    preserveScroll: true,
                });
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [notepadTitle, notepadCategory]);

    const getNotepadCategories = useCallback(async () => {
        try {
            const res = await axios.get("/api/notepads/categories");
            if(res.data.success) {
                setCategories(res.data.categories);
            } else {
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
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
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
                getNotepadCategories();
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
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

                <div className="px-5 pb-5 flex-1">
                    {/*메모장 필터 영역(search, grid)*/}
                    <NotepadFilterSection setSearchCategory={setSearchCategory} categories={categories} setSearchTitle={setSearchTitle} viewOption={viewOption} setViewOption={setViewOption} tab={tab} setTab={setTab}/>

                    {/*메모장 read영역*/}
                    <NotepadsSection getNotepadCategories={getNotepadCategories} categories={categories} modal={modal} setModal={setModal} editId={editId} setEditId={setEditId} editStatus={editStatus} setEditStatus={setEditStatus} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} notepadLikes={notepadLikes} tab={tab} setNotepadLikes={setNotepadLikes} viewOption={viewOption} notepads={notepads} setNotepads={setNotepads} />
                </div>

                {/*메모장 삭제 모달창*/}
                {modal && <Modal Title="메모장 삭제" onClickEvent={handleDeleteNotepad} setModal={setModal} setEditId={setEditId} setEditStatus={setEditStatus} Text={editId && '"'+notepads.find(item => item.id === editId)?.title+'"' + " 메모장을 정말 삭제 하시겠습니까?"} Position="top" CloseText="삭제" />}

                <button onClick={() => {
                    setFormModal(true);
                }} className="fixed bottom-0 cursor-pointer right-0 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-10 rounded-full text-white font-semibold m-[25px] sm:m-[50px]">
                    <FontAwesomeIcon icon={faPlus} />
                </button>

                {formModal && (
                    <FormModal
                        Title="메모장 생성"
                        SubmitText="생성"
                        Inputs={formInputs}            // 다중 입력 배열 전달
                        toggle={formModal}
                        setToggle={setFormModal}
                        onChangeArray={handleInputChange} // index 기반 onChange
                        Submit={handleStoreNotepad}
                    />
                )}
            </div>
        </>
    );
}
