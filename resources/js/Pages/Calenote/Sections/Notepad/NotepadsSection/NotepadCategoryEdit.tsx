import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import {Category, Notepads} from "../../../../../Types/CalenoteTypes";
import { useContext } from "react";
import {GlobalUIContext} from "../../../../../Providers/GlobalUIContext";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";
import {DateUtils} from "../../../../../Utils/dateUtils";

interface NotepadCategoryEdit {
    notepadId: string;
    notepadCategory: string;
    setNotepads: Dispatch<SetStateAction<Notepads[]>>;
    categories: string[];
}

export default function NotepadCategoryEdit({ notepadId, notepadCategory, setNotepads, categories } : NotepadCategoryEdit) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
    } = ui;

    const [categoryEditId, setCategoryEditId] = useState<string>("");
    const [temporaryEditCategory, setTemporaryEditCategory] = useState<string>("");

    const editNotepadCategory = useCallback(async (temporary? : string) => {
        const temporaryCategory = temporary ? temporary : temporaryEditCategory;
        if(!categoryEditId || !temporaryCategory) return;
        setLoading(true);

        try {
            const res = await axios.put(`/api/notepads/${categoryEditId}/category`, {
                category: temporaryCategory,
            });
            if(res.data.success) {
                setNotepads((prevNotepads) =>
                    prevNotepads.map((notepad) =>
                        notepad.id === categoryEditId
                            ? { ...notepad, category: temporaryCategory.trim() }
                            : notepad
                    )
                );

                setCategoryEditId("");
                setTemporaryEditCategory("");

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

    }, [categoryEditId, temporaryEditCategory]);

    const categoryRef = useRef<HTMLDivElement | null>(null);

    const handleClickOutside = useCallback( (e : any) => {
        if (!categoryEditId) return;

        if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
            setCategoryEditId("");
            setTemporaryEditCategory("");
        }
    }, [categoryEditId]);

    useEffect(() => {
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            setCategoryEditId(notepadId);
            setTemporaryEditCategory(notepadCategory);
        }} className="text-gray-500 text-sm cursor-pointer relative">
            {categoryEditId ? (
                <div className="flex space-x-1">
                    <input
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if(temporaryEditCategory.trim().length > 0) {
                                    editNotepadCategory();
                                }
                            }
                        }}
                        onBlur={() => {
                            if(temporaryEditCategory.trim().length > 0) {
                                editNotepadCategory();
                            }
                        }}
                        onChange={(e) => {
                            setTemporaryEditCategory(e.target.value);
                        }}
                        type="text" name="temporaryEditCategory" id="temporaryEditCategory" className="normal-text text-xs truncate border-0 outline-none max-w-[100px]" value={temporaryEditCategory}/>
                </div>
            ) : (
                <p className="truncate max-w-[100px] text-xs font-semibold">{notepadCategory}</p>
            )}
            {
                (notepadId === categoryEditId) && (
                    <div ref={categoryRef} className="w-[200px] max-h-[100px] absolute px-2 py-1 bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-gray-800 top-[100%] rounded left-0 divide-y divide-gray-200 dark:divide-gray-800 overflow-y-auto text-xs font-semibold">
                        {(categories.filter(item => item !== notepadCategory).length <= 0) ? (
                            <div className="py-2 rounded">
                                <p className="normal-text">등록된 카테고리가 없습니다.</p>
                            </div>
                        ) : (
                            categories.map((category, index) => {
                                if(category !== notepadCategory) {
                                    return (
                                        <div onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            editNotepadCategory(category);
                                        }} key={index} className="py-2 rounded">
                                            <p className="normal-text truncate">{category}</p>
                                        </div>
                                    )
                                }
                            })
                        )}
                    </div>
                )
            }
        </div>
    );
}
