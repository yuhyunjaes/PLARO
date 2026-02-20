import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faHeart as faHeartSolid,
    faEllipsisVertical,
    faShareNodes
} from "@fortawesome/free-solid-svg-icons";
import {Link} from "@inertiajs/react";
import {CalenoteSectionsData} from "../../CalenoteSectionsData";
import {Dispatch, SetStateAction, useCallback, useContext, useEffect, useState} from "react";
import {faHeart as faHeartRegular} from "@fortawesome/free-regular-svg-icons";
import axios from "axios";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";
import {GlobalUIContext} from "../../../../../Providers/GlobalUIContext";
import {DateUtils} from "../../../../../Utils/dateUtils";

interface ControlSectionProps {
    currentCategory: string;
    setCurrentCategory: Dispatch<SetStateAction<string>>;
    notepadShareToggle: boolean;
    setNotepadShareToggle: Dispatch<SetStateAction<boolean>>;
    notepadContentsToggle: boolean;
    setNotepadContentsToggle: Dispatch<SetStateAction<boolean>>;
    currentTitle: string;
    setCurrentTitle: Dispatch<SetStateAction<string>>;
    saveStatus: boolean;
    notepadLiked: boolean;
    setNotepadLiked: Dispatch<SetStateAction<boolean>>;
    uuid: string;
}

export default function ControlSection({ currentCategory, setCurrentCategory, notepadShareToggle, setNotepadShareToggle, notepadContentsToggle, setNotepadContentsToggle, currentTitle, setCurrentTitle, saveStatus, notepadLiked, setNotepadLiked, uuid } : ControlSectionProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading
    } = ui;

    const handleLikeInsertOrDelete = useCallback(async (type: "insert" | "delete") => {
        if(!uuid || !type) return;
        try {
            const res = type === "insert" ? await axios.post(`/notepads/${uuid}/like`) : await axios.delete(`/notepads/${uuid}/like`);

            if (res.data.success) {
                setNotepadLiked(type === "insert");
            }
        } catch (err) {
            console.error(err);
        }
    }, [uuid]);

    const handleEditNotepadTitle = useCallback(async () => {
        if (!uuid || !currentTitle.trim()) return;
        setLoading(true);

        try {
            const res = await axios.put(`/api/notepads/${uuid}/title`, {
                title : currentTitle.trim()
            });
            if(!res.data.success) {
                const alertData:AlertsData = {
                    id: DateUtils.now(),
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
    }, [uuid, currentTitle]);

    const handleEditNotepadCategory = useCallback(async () => {
        if (!uuid || !currentCategory.trim()) return;
        setLoading(true);

        try {
            const res = await axios.put(`/api/notepads/${uuid}/category`, {
                category : currentCategory.trim()
            });
            if(!res.data.success) {
                const alertData:AlertsData = {
                    id: DateUtils.now(),
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
    }, [uuid, currentCategory]);

    return(
        <div className="flex justify-between items-center px-5 border border-t-transparent border-x-transparent bg-white dark:bg-gray-950 py-2 border-b-gray-300 dark:border-b-gray-800 sticky top-0 z-[1]">
            <div className="flex space-x-2 items-center max-w-1/2">
                <Link href={CalenoteSectionsData[1]?.link} className="normal-text cursor-pointer">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                <div className="flex flex-col gap-1 max-w-5/12">
                    <input
                        onChange={(e) => {
                            setCurrentTitle(e.target.value);
                        }}
                        onBlur={handleEditNotepadTitle}
                        type="text" name="" id="" className="normal-text font-semibold text-lg truncate border-0 outline-none" value={currentTitle}/>

                    <input onBlur={handleEditNotepadCategory} onChange={(e) => {
                        setCurrentCategory(e.target.value);
                    }} type="text" value={currentCategory} className="normal-text text-[0.65rem] truncate border-0 outline-none"/>
                </div>
                <div className={`size-2 rounded-full bg-gray-300 dark:bg-gray-800 transition-opacity duration-300 ${saveStatus ? "opacity-100" : "opacity-0"}`}></div>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => {
                    handleLikeInsertOrDelete(notepadLiked ? "delete" : "insert");
                }} className="transition-colors duration-300 text-blue-500 cursor-pointer hover:text-blue-600 active:text-blue-700">
                    <FontAwesomeIcon
                        icon={notepadLiked ? faHeartSolid : faHeartRegular}
                    />
                </button>

                <button onClick={() => {
                    setNotepadShareToggle(!notepadShareToggle);
                }} className={`transition-colors duration-300 relative ${notepadShareToggle ? "text-blue-700" : "text-blue-500 hover:text-blue-600 active:text-blue-700"} cursor-pointer`}>
                    <FontAwesomeIcon icon={faShareNodes} />
                </button>

                <button onClick={() => {
                    setNotepadContentsToggle(!notepadContentsToggle);
                }} className={`transition-colors duration-300 relative ${notepadContentsToggle ? "text-blue-700" : "text-blue-500 hover:text-blue-600 active:text-blue-700"} cursor-pointer`}>
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
            </div>
        </div>
    );
}
