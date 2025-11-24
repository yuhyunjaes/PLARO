import {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

export default function NotepadCategoryEdit({ notepadId, notepadCategory, setNotepads, setLoading, categories, getNotepadCategories }) {
    const [categoryEditId, setCategoryEditId] = useState("");
    const [temporaryEditCategory, setTemporaryEditCategory] = useState("");

    const editNotepadCategory = useCallback(async (temporary) => {
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
                getNotepadCategories();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }

    }, [categoryEditId, temporaryEditCategory]);

    const categoryRef = useRef(null);

    const handleClickOutside = useCallback( (e) => {
        if (!categoryEditId) return;

        if (categoryRef.current && !categoryRef.current.contains(e.target)) {
            setCategoryEditId("");
            setTemporaryEditCategory("");
        }
    }, [categoryEditId]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            getNotepadCategories();
            setCategoryEditId(notepadId);
            setTemporaryEditCategory(notepadCategory);
        }} className="text-gray-500 text-sm cursor-pointer relative">
            {categoryEditId ? (
                <div className="flex">
                    <input
                        autoFocus
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                                if(temporaryEditCategory.trim().length > 0) {
                                    editNotepadCategory();
                                }
                            }
                        }}
                        onChange={(e) => {
                            setTemporaryEditCategory(e.target.value);
                        }}
                        type="text" name="" id="" className="normal-text truncate border-0 outline-none max-w-[100px]" value={temporaryEditCategory}/>

                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if(temporaryEditCategory.trim().length > 0) {
                                editNotepadCategory();
                            }
                    }}
                            className="size-5 text-green-400 hover:bg-green-400/20 rounded-full cursor-pointer">
                        <FontAwesomeIcon icon={faFloppyDisk} />
                    </button>
                </div>
            ) : (
                <p>{notepadCategory}</p>
            )}
            {
                (notepadId === categoryEditId) && (
                    <div ref={categoryRef} className="w-[200px] max-h-[100px] absolute p-2 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 top-[100%] shadow-md rounded-2xl left-0 divide-y divide-gray-800 overflow-y-auto">
                        {(categories.filter(item => item.category !== notepadCategory).length <= 0) ? (
                            <div className="py-2 rounded">
                                <p className="normal-text">등록된 카테고리가 없습니다.</p>
                            </div>
                        ) : (
                            categories.map((category, index) => {
                                if(category.category !== notepadCategory) {
                                    return (
                                        <div onClick={() => {
                                            editNotepadCategory(category.category);
                                        }} key={index} className="py-2 rounded">
                                            <p className="normal-text">{category.category}</p>
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
