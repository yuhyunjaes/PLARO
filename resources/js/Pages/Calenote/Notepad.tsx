// 메모장 영역

import { Head, router } from '@inertiajs/react';
import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { AuthUser, Notepads, Category } from "../../Types/CalenoteTypes";
import FormModal from "../../Components/Elements/FormModal";
import Modal from "../../Components/Elements/Modal";
import NotepadsSection from "./Sections/Notepad/NotepadsSection";
import NotepadFilterSection from "./Sections/Notepad/NotepadFilterSection";
import { useContext } from "react";
import {GlobalUIContext} from "../../Providers/GlobalUIContext";
import {AlertsData} from "../../Components/Elements/ElementsData";
import {DateUtils} from "../../Utils/dateUtils";


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
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [editId, setEditId] = useState<string>("");
    const [deleteId, setDeleteId] = useState<string>("");
    const [editStatus, setEditStatus] = useState<string>("");
    const [temporaryEditTitle, setTemporaryEditTitle] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);

    const categories:string[] = useMemo(() => {
        return Array.from(
            new Set(notepads.map(n => n.category))
        );
    }, [notepads]);


    const [formModal, setFormModal] = useState<boolean>(false);
    const [notepadTitle, setNotepadTitle] = useState<string>("");
    const [notepadCategory, setNotepadCategory] = useState<string>("");

    const [formInputs, setFormInputs] = useState([
        { label: "제목", type: "text", id: "new-title", name: "new-title", value: notepadTitle },
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
            if(!res.data.success) {
                const alertData:AlertsData = {
                    id: DateUtils.now(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);

                return false;
            }

            router.visit(`/calenote/notepad/${res.data.id}`, {
                method: "get",
                preserveState: true,
                preserveScroll: true,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [notepadTitle, notepadCategory]);

    const [searchTitle, setSearchTitle] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    const getNotepads = useCallback(async (append = false) => {
        if (!tab) return;

        append ? setIsFetchingMore(true) : setLoading(true);

        try {
            const res = await axios.get('/api/notepads', {
                params: {
                    page,
                    title: searchTitle,
                    category: searchCategory,
                    liked: tab === 'liked',
                }
            });

            if (res.data.success) {
                setLastPage(res.data.pagination.last_page);

                setNotepads(prev =>
                    append
                        ? [...prev, ...res.data.notepads]
                        : res.data.notepads
                );
            } else {
                setAlerts(pre => [...pre, {
                    id: DateUtils.now(),
                    message: res.data.message,
                    type: res.data.type
                }]);
            }
        } catch (err) {
            console.log(err);
        } finally {
            append ? setIsFetchingMore(false) : setLoading(false);
        }
    }, [tab, searchTitle, searchCategory, page]);

    useEffect(() => {
        getNotepads();
        setPage(1);
    }, [tab, searchTitle, searchCategory]);

    useEffect(() => {
        getNotepads(page !== 1);
    }, [page, getNotepads]);

    useEffect(() => {
        const container = document.querySelector('.CalenoteLayout-container');
        if (!container) return;

        const handleScroll = () => {
            if (isFetchingMore) return;
            if (page >= lastPage) return;

            const { scrollTop, clientHeight, scrollHeight } = container;

            if (scrollTop + clientHeight >= scrollHeight) {
                setPage(p => p + 1);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isFetchingMore, page, lastPage]);

    const handleDeleteNotepad = useCallback( async () => {
        if(!deleteId) return;
        setLoading(true);
        try {
            const res = await axios.delete(`/api/notepads/${deleteId}`);
            if(res.data.success) {
                setEditStatus("");
                setNotepads((prevNotepads) => prevNotepads.filter(notepad => notepad.id !== deleteId));
                setDeleteId("");
            } else {
                const alertData:AlertsData = {
                    id: DateUtils.now(),
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
    }, [deleteId]);

    return (
        <>
            <Head title="Notepad"/>
            <div className="min-h-full bg-white dark:bg-gray-950 relative flex flex-col">
                {
                    (notepads.length <= 0) && (
                        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold w-full text-center">
                            {
                                (tab === "liked") ? "찜한 메모가 아직 없어요." : "아직 작성된 메모가 없어요."
                            }
                        </p>
                    )
                }

                <div className="px-5 pb-5 flex-1">
                    {/*메모장 필터 영역(search, grid)*/}
                    <NotepadFilterSection setSearchCategory={setSearchCategory} categories={categories} setSearchTitle={setSearchTitle} viewOption={viewOption} setViewOption={setViewOption} tab={tab} setTab={setTab}/>

                    {/*메모장 read영역*/}
                    <NotepadsSection deleteId={deleteId} setDeleteId={setDeleteId} categories={categories} modal={modal} setModal={setModal} editId={editId} setEditId={setEditId} editStatus={editStatus} setEditStatus={setEditStatus} temporaryEditTitle={temporaryEditTitle} setTemporaryEditTitle={setTemporaryEditTitle} tab={tab} viewOption={viewOption} notepads={notepads} setNotepads={setNotepads} />
                </div>

                {/*메모장 삭제 모달창*/}
                {modal ? <Modal Title="메모장 삭제" onClickEvent={handleDeleteNotepad} setModal={setModal} setEditId={setDeleteId} setEditStatus={setEditStatus} Text={deleteId && '"'+notepads.find(item => item.id === deleteId)?.title+'"' + " 메모장을 정말 삭제 하시겠습니까?"} Position="top" CloseText="삭제" /> : ""}

                <button onClick={() => {
                    setFormModal(true);
                }} className="fixed bottom-0 cursor-pointer right-0 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150 size-12 rounded-full text-white font-semibold m-[25px] sm:m-[50px]">
                    <FontAwesomeIcon icon={faPlus} />
                </button>

                {formModal ? (
                    <FormModal
                        Title="메모장 생성"
                        SubmitText="생성"
                        Inputs={formInputs}            // 다중 입력 배열 전달
                        toggle={formModal}
                        setToggle={setFormModal}
                        onChangeArray={handleInputChange} // index 기반 onChange
                        Submit={handleStoreNotepad}
                    />
                ) : ""}
            </div>
        </>
    );
}
